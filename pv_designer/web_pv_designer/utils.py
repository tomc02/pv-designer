import base64
import json
import math
import os

import matplotlib.pyplot as plt
import requests
from PIL import Image
from django.http import JsonResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from .models import MapData, PVPowerPlant, Area


def process_map_data(data, user_id):
    try:
        delete_rotated_images()
        parsed_data = json.loads(data)
        print('ID:' + parsed_data['mapDataID'])
        if parsed_data['mapDataID'] != '':
            map_data = MapData.objects.get(id=parsed_data['mapDataID'])
            map_data.latitude = parsed_data['lat']
            map_data.longitude = parsed_data['lng']
            map_data.areas = parsed_data['shapes']
            map_data.areasData = parsed_data['shapesData']
            map_data.zoom = parsed_data['zoom']
            map_data.map_image = save_map_img(parsed_data['imageUrl'], user_id, map_data.id)
            map_data.save()
        else:
            last_map_data = MapData.objects.last()
            if last_map_data is None:
                id = 0
            else:
                id = last_map_data.id
            img_path = save_map_img(parsed_data['imageUrl'], user_id, id + 1)
            power_plant = PVPowerPlant.objects.get(id=parsed_data['instanceID'])
            map_data = MapData(latitude=parsed_data['lat'], longitude=parsed_data['lng'], areas=parsed_data['shapes'],
                               areasData=parsed_data['shapesData'], zoom=parsed_data['zoom'], map_image=img_path,
                               pv_power_plant=power_plant)
            saved_data = map_data.save()
            parse_areas_data(parsed_data['shapesData'], map_data)

    except json.JSONDecodeError as e:
        return JsonResponse({"error": f"Invalid JSON format: {e}"}, status=400)
    return map_data.id


def parse_areas_data(areas_data_list, map_data):
    print(areas_data_list)
    areas = []
    for area in areas_data_list:
        area_instance = Area(
            panels_count=area['panelsCount'],
            installed_peak_power=500.0,
            mounting_position=area['mountingType'] == 'free-standing' and 'option1' or 'option2',
            slope=area['slope'],
            azimuth=area['azimuth'],
            title=area['title'],
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

    rotated_image.save(file_path + rotated_image_path + angle + '.png')


def delete_rotated_images():
    file_path = os.path.dirname(os.path.relpath(__file__))
    dir_path = file_path + '/static/images/'
    for file in os.listdir(dir_path):
        if file.startswith('pv_panel_rotated'):
            os.remove(dir_path + file)
        if file.startswith('pv_panel_selected_rotated'):
            os.remove(dir_path + file)


def create_pdf_report(path_to_source):
    with open(path_to_source + 'response.json', 'r') as json_file:
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

    plt.savefig(path_to_source + 'monthly_energy_production.png')
    plt.close()

    pdf_file = './web_pv_designer/static/pv_data_report.pdf'
    c = canvas.Canvas(pdf_file, pagesize=letter)

    lat = round(location_data['latitude'], 4)
    long = round(location_data['longitude'], 4)
    c.setFont('Helvetica-Bold', 20)
    c.drawCentredString(300, 700, 'Photovoltaic System Performance Report')
    c.setFont('Helvetica', 12)
    c.drawCentredString(300, 650, f'Location: Latitude {lat}°, Longitude {long}°')
    c.drawCentredString(300, 610, f'Nominal Power: {pv_module_data["peak_power"]} kW')

    c.drawImage(path_to_source + 'monthly_energy_production.png', 50, 350, width=500, height=250)
    c.drawImage(path_to_source + 'pv_image.png', 50, 50, width=500, height=250)

    c.save()

    print(f"Report generated and saved as {pdf_file}")

    return True


def get_pvgis_response(params):
    base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
    response = requests.get(base_url, params=params)
    return response


def save_response(response, user_id):
    with open('./web_pv_designer/pdf_sources/' + str(user_id) + '/response.json', 'wb') as f:
        f.write(response.text.encode('utf-8'))
