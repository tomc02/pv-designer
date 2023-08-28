import base64
import os
import json
import matplotlib.pyplot as plt
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import JsonResponse
from .models import MapData


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
            map_data.save()
        else:
            map_data = MapData(latitude=parsed_data['lat'], longitude=parsed_data['lng'], areas=parsed_data['shapes'],
                           areasData=parsed_data['shapesData'], zoom=parsed_data['zoom'])
        saved_data = map_data.save()
        save_map_img(parsed_data['imageUrl'], user_id)
        # Save data to the database
    except json.JSONDecodeError as e:
        return JsonResponse({"error": f"Invalid JSON format: {e}"}, status=400)
    return map_data.id


def save_map_img(image_url, user_id):
    image_url = image_url.replace('data:image/png;base64,', '')
    save_path = './web_pv_designer/pdf_sources/' + user_id + '/'
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    with open(save_path + 'pv_image.png', "wb") as fh:
        fh.write(base64.decodebytes(image_url.encode()))
    im = Image.open(save_path + 'pv_image.png')
    width, height = im.size
    im = im.crop((0, 0, width, height - 15))
    im.save(save_path + 'pv_image.png')


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


def rotate_pv_img(angle):
    original_image_path = '/static/images/pv_panel.png'
    rotated_image_path = '/static/images/pv_panel_rotated.png'
    file_path = os.path.dirname(os.path.relpath(__file__))
    original_image = Image.open(file_path + original_image_path).convert("RGBA")

    rotation_angle = float(angle)
    rotated_image = original_image.rotate(rotation_angle, expand=True, resample=Image.BICUBIC)

    canvas_width = int(rotated_image.width * 1.5)
    canvas_height = int(rotated_image.height * 1.5)
    canvas = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))
    paste_x = (canvas_width - rotated_image.width) // 2
    paste_y = (canvas_height - rotated_image.height) // 2
    canvas.paste(rotated_image, (paste_x, paste_y), rotated_image)

    rotated_image.save(file_path + rotated_image_path)


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
