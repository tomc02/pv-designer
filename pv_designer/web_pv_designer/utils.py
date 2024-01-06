import base64
import copy
import json
import math
import os
from io import BytesIO

import matplotlib
from reportlab.lib import colors

matplotlib.use('Agg')

import matplotlib.pyplot as plt
import requests
from PIL import Image
from django.http import JsonResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Image as ImagePlatypus
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF
from reportlab.platypus.flowables import KeepTogether

from .models import MapData, PVPowerPlant, Area, CustomUser
from fpdf import FPDF


def process_map_data(data, user_id):
    try:
        parsed_data = json.loads(data)
        if parsed_data['mapDataID'] != '':
            map_data = MapData.objects.get(id=parsed_data['mapDataID'])
            map_data.latitude = parsed_data['lat']
            map_data.longitude = parsed_data['lng']
            map_data.areas = parsed_data['shapes']
            map_data.areasData = parsed_data['shapesData']
            map_data.zoom = parsed_data['zoom']
            map_data.map_image = save_map_img(parsed_data['imageUrl'], user_id, map_data.id)
            map_data.areasObjects.clear()
            map_data.save()
            parse_areas_data(parsed_data['shapesData'], map_data, float(map_data.pv_power_plant.solar_panel.power))
        else:
            last_map_data = MapData.objects.last()
            if last_map_data is None:
                id = 0
            else:
                id = last_map_data.id
            img_path = save_map_img(parsed_data['imageUrl'], user_id, id + 1)
            power_plant = PVPowerPlant.objects.get(id=parsed_data['instanceID'])
            pv_panel = power_plant.solar_panel
            user_obj = CustomUser.objects.get(id=user_id)
            map_data = MapData(user=user_obj, latitude=parsed_data['lat'], longitude=parsed_data['lng'],
                               areas=parsed_data['shapes'],
                               areasData=parsed_data['shapesData'], zoom=parsed_data['zoom'], map_image=img_path,
                               pv_power_plant=power_plant)
            map_data.save()
            parse_areas_data(parsed_data['shapesData'], map_data, float(pv_panel.power))
            delete_rotated_images()

    except json.JSONDecodeError as e:
        return JsonResponse({"error": f"Invalid JSON format: {e}"}, status=400)
    return map_data.id


def parse_areas_data(areas_data_list, map_data, pv_panel_power):
    print(areas_data_list)
    areas = []
    for area in areas_data_list:
        print("area: " + area['title'] + " " + str(area['mountingType']))
        area_instance = Area(
            panels_count=area['panelsCount'],
            installed_peak_power=int(area['panelsCount']) * pv_panel_power,
            mounting_position=area['mountingType'] == '1' and 'option1' or 'option2',
            slope=area['slope'],
            azimuth=area['azimuth'],
            title=area['title'],
            rotations=area['rotations'],
        )
        area_instance.save()
        print(area_instance)
        map_data.areasObjects.add(area_instance)
    map_data.save()


def save_map_img(image_url, user_id, db_id=None):
    image_url = image_url.replace('data:image/png;base64,', '')
    save_path = './web_pv_designer/pdf_sources/' + user_id + '/'
    db_path = './media/map_images/'
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    with open(save_path + 'pv_image.png', "wb") as fh:
        fh.write(base64.decodebytes(image_url.encode()))
    im = Image.open(save_path + 'pv_image.png')
    width, height = im.size
    im = im.crop((0, 0, width, height - 15))
    im.save(save_path + 'pv_image.png')
    if db_id is not None:
        db_path = db_path + str(db_id) + '.png'
        im.save(db_path)
        return 'map_images/' + str(db_id) + '.png'


def load_map_img(user_id):
    load_path = './web_pv_designer/pdf_sources/' + user_id + '/'
    im = Image.open(load_path + 'pv_image.png')
    return im


def set_params(data):
    params = {
        'lat': data['latitude'],
        'lon': data['longitude'],
        'peakpower': data['installed_peak_power'],
        'loss': data['system_loss'],
        'mountingplace': data['mounting_position'] == 'option1' and 'free' or 'building',
        'angle': data['slope'],
        'aspect': data['azimuth'],
        'pvprice': data['pv_system_cost'] == 'True' and '1' or '0',
        'systemcost': data['pv_electricity_price'],
        'interest': data['interest'],
        'lifetime': data['lifetime'],
        'components': '0',
        'outputformat': 'json'
    }
    return params


def rotate_pv_img(angle, slope, original_image_path, rotated_image_path):
    file_path = os.path.dirname(os.path.relpath(__file__))
    original_image = Image.open(file_path + original_image_path).convert("RGBA")
    width, height = original_image.size
    slope = 90 - float(slope)
    new_height = height * math.sin(math.radians(slope))
    original_image = original_image.resize((width, int(new_height)))
    print(height, new_height)

    rotation_angle = float(angle)
    rotated_image = original_image.rotate(rotation_angle, expand=True, resample=Image.BICUBIC)

    angle = str(round(rotation_angle))
    rotated_image.save(file_path + rotated_image_path + angle + '.png')


def delete_rotated_images():
    file_path = os.path.dirname(os.path.relpath(__file__))
    dir_path = file_path + '/static/images/'
    for file in os.listdir(dir_path):
        if file.startswith('pv_panel_rotated'):
            os.remove(dir_path + file)
        if file.startswith('pv_panel_selected_rotated'):
            os.remove(dir_path + file)


def create_pdf_report(path_to_source, areas):
    pdf_file = './web_pv_designer/static/pv_data_report.pdf'
    doc = SimpleDocTemplate(pdf_file, pagesize=letter)

    lat, long = None, None

    response_file_paths = [path_to_source + f'response{index}.json' for index in range(len(areas))]
    sum_responses(response_file_paths, path_to_source)

    with open(path_to_source + 'response_sum.json', 'r') as json_file:
        data = json.load(json_file)
        location_data = data['inputs']['location']
        lat = round(location_data['latitude'], 4)
        long = round(location_data['longitude'], 4)

    story = []

    # Title
    title_style = getSampleStyleSheet()['Title']
    story.append(Paragraph('Photovoltaic System Performance Report', title_style))

    # Image with PV Panels
    pv_panel_img_path = path_to_source + 'pv_image.png'
    story.append(ImagePlatypus(pv_panel_img_path, width=400, height=200))

    # Table with Area Information
    area_info = [['Area', 'Panels Count', 'Installed Peak Power', 'Slope', 'Azimuth']]
    total_values = [0, 0, 0, 0, 0]  # Initialize total values

    for area in areas:
        data_json = area.to_JSON()
        area_values = [data_json['title'], data_json['panels_count'], data_json['installed_peak_power'] / 1000, data_json['slope'],
                       data_json['azimuth']]
        area_info.append(area_values)
        total_values = [sum(x) for x in zip(total_values, area_values[1:])]

    # Add row for total values
    total_values = [round(x, 2) for x in total_values]
    total_values[2] = '-'
    total_values[3] = '-'
    total_row = ['Total', *total_values]
    area_info.append(total_row)
    last_row_index = len(area_info) - 1

    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('BACKGROUND', (0, last_row_index), (-1, last_row_index), (222/255, 222/255, 182/255)),
    ])

    table_data = Table(area_info, colWidths=[80, 80, 120, 60, 60])  # Set custom column widths
    table_data.setStyle(table_style)
    story.append(table_data)

    monthly_energy_data = data['outputs']['monthly']['fixed']

    months = [entry['month'] for entry in monthly_energy_data]
    energy_values = [entry['E_m'] for entry in monthly_energy_data]

    plt.figure(figsize=(10, 6))
    bars = plt.bar(months, energy_values, color='#4285F4', edgecolor='black', linewidth=1.2)

    plt.xlabel('Month')
    plt.ylabel('Energy Production (kWh/mo)')
    plt.title('Monthly Energy Production')

    # Add values above the bars with better styling
    for bar, value in zip(bars, energy_values):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.2, f'{value:.2f}', ha='center', va='bottom',
                 color='black', fontweight='bold', fontsize=10)

    plt.xticks(months)
    plt.ylim(0, max(energy_values)*1.1)  # Adjust y-axis limit for better visualization
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Beautify the chart
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    plt.gca().spines['left'].set_linewidth(0.5)
    plt.gca().spines['bottom'].set_linewidth(0.5)

    plt.tight_layout()

    # Save the chart to a BytesIO buffer
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    plt.close()

    # Embed the chart in the PDF report
    chart_img = ImagePlatypus(buffer, width=500, height=300)
    story.append(chart_img)
    doc.build(story)

    print(f"Report generated and saved as {pdf_file}")

    return True


def process_area_for_pdf(area, index, path_to_source):
    with open(path_to_source + f'response{0}.json', 'r') as json_file:
        data = json.load(json_file)

    monthly_data = data['outputs']['monthly']['fixed']
    pv_module_data = data['inputs']['pv_module']
    location_data = data['inputs']['location']

    months = [entry['month'] for entry in monthly_data]
    e_d_values = [entry['E_d'] for entry in monthly_data]

    plt.figure(figsize=(10, 4))
    plt.bar(months, e_d_values, color='skyblue', label='Energy Production')
    plt.xlabel('Month')
    plt.ylabel('Average daily energy production (kWh/d)')
    plt.title('Monthly Energy Production')
    plt.xticks(months)
    plt.grid(True, axis='y', linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()

    plt.savefig(path_to_source + f'monthly_energy_production{index}.png')
    plt.close()


def get_pvgis_response(params):
    base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
    response = requests.get(base_url, params=params)
    return response


def save_response(response, user_id, index=0):
    with open('./web_pv_designer/pdf_sources/' + str(user_id) + '/response' + str(index) + '.json', 'wb') as f:
        f.write(response.text.encode('utf-8'))


def make_api_calling(data_id, user_id):
    map_data = MapData.objects.get(id=data_id)
    areas = map_data.areasObjects.all()
    pv_power_plant = map_data.pv_power_plant
    params = []
    index = 0
    for area in areas:
        param = {
            'lat': map_data.latitude,
            'lon': map_data.longitude,
            'peakpower': area.installed_peak_power / 1000,
            'loss': pv_power_plant.system_loss,
            'mountingplace': area.mounting_position == 'option1' and 'free' or 'building',
            'angle': area.slope,
            'aspect': area.azimuth,
            'pvprice': pv_power_plant.pv_system_cost == 'True' and '1' or '0',
            'systemcost': pv_power_plant.pv_electricity_price,
            'interest': pv_power_plant.interest,
            'lifetime': pv_power_plant.lifetime,
            'outputformat': 'json'
        }
        params.append(param)
        save_response(get_pvgis_response(param), user_id, index)
        index += 1

def sum_responses(file_paths, path_to_source):
    # Initialize variables to store the sum
    sum_response = {
        "inputs": {},
        "meta": {},
        "outputs": {
            "monthly": {"fixed": []},
            "totals": {"fixed": {}}
        }
    }

    # Copy inputs and meta from the first file
    with open(file_paths[0], 'r') as file:
        response = json.load(file)
        sum_response["inputs"] = copy.deepcopy(response["inputs"])
        sum_response["meta"] = copy.deepcopy(response["meta"])

    for file_path in file_paths:
        with open(file_path, 'r') as file:
            response = json.load(file)

        # Summing values for monthly output
        for i, month_data in enumerate(response["outputs"]["monthly"]["fixed"]):
            if len(sum_response["outputs"]["monthly"]["fixed"]) <= i:
                sum_response["outputs"]["monthly"]["fixed"].append(month_data)
            else:
                for key in month_data.keys():
                    if key not in ["month"]:
                        sum_response["outputs"]["monthly"]["fixed"][i][key] += month_data[key]

        # Summing values for totals output
        for key in response["outputs"]["totals"]["fixed"].keys():
            sum_response["outputs"]["totals"]["fixed"][key] = sum_response["outputs"]["totals"]["fixed"].get(key, 0) + float(response["outputs"]["totals"]["fixed"][key])

    # Save the sum to a new file
    with open(path_to_source+'response_sum.json', 'w') as output_file:
        json.dump(sum_response, output_file, indent=2)