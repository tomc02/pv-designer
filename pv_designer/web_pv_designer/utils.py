import base64
import math
import os
from PIL import Image, ImageOps
import json
import matplotlib.pyplot as plt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import JsonResponse

def rotate_pv_img(angle):
    original_image_path = '/static/images/pv_panel.png'
    rotated_image_path = '/static/images/pv_panel_rotated.png'
    file_path = os.path.dirname(os.path.relpath(__file__))
    original_image = Image.open(file_path + original_image_path).convert("RGBA")

    rotation_angle = float(angle)  # Change this to your desired angle
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
    totals_data = data['outputs']['totals']['fixed']
    pv_module_data = data['inputs']['pv_module']
    location_data = data['inputs']['location']

    months = [entry['month'] for entry in monthly_data]
    E_d_values = [entry['E_d'] for entry in monthly_data]
    H_i_m_values = [entry['H(i)_m'] for entry in monthly_data]

    plt.figure(figsize=(10, 4))
    plt.bar(months, E_d_values, color='skyblue', label='Energy Production')
    plt.xlabel('Month')
    plt.ylabel('Average daily energy production (kWh/d)')
    plt.title('Monthly Energy Production')
    plt.xticks(months)
    plt.grid(True, axis='y', linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()

    plt.savefig(path_to_source + 'monthly_energy_production.png')
    plt.close()

    plt.figure(figsize=(10, 4))
    plt.bar(months, H_i_m_values, color='lightgreen', label='Global Irradiation')
    plt.xlabel('Month')
    plt.ylabel('Average monthly global irradiation (kWh/m²/mo)')
    plt.title('Monthly Global Irradiation')
    plt.xticks(months)
    plt.grid(True, axis='y', linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()

    plt.savefig(path_to_source + 'monthly_global_irradiation.png')
    plt.close()

    pdf_file = './web_pv_designer/static/pv_data_report.pdf'
    c = canvas.Canvas(pdf_file, pagesize=letter)

    lat = round(location_data['latitude'], 4)
    long = round(location_data['longitude'], 4)
    c.setFont('Helvetica-Bold', 20)
    c.drawCentredString(400, 700, 'Photovoltaic System Performance Report')
    c.setFont('Helvetica', 12)
    c.drawCentredString(400, 650, f'Location: Latitude {lat}°, Longitude {long}°, Elevation 424m')
    c.drawCentredString(400, 630, f'Photovoltaic Technology: {pv_module_data["technology"]}')
    c.drawCentredString(400, 610, f'Nominal Power of PV Module: {pv_module_data["peak_power"]} kW')
    c.drawCentredString(400, 590, f'System Loss: {pv_module_data["system_loss"]}%')
    c.drawCentredString(400, 550, 'Monthly Energy Production and Global Irradiation')

    c.drawImage(path_to_source + 'monthly_global_irradiation.png', 50, 50, width=500, height=250)

    c.setFont('Helvetica-Bold', 14)
    c.drawString(50, 600, 'Energy Production Summary:')
    c.setFont('Helvetica', 12)
    c.drawString(50, 580, f'Total Energy Production (E_d): {totals_data["E_d"]} kWh/d')
    c.drawString(50, 560, f'Total Energy Production (E_m): {totals_data["E_m"]} kWh/mo')
    c.drawString(50, 540, f'Total Energy Production (E_y): {totals_data["E_y"]} kWh/y')
    c.drawString(50, 520, f'Average Daily Global Irradiation (H(i)_d): {totals_data["H(i)_d"]} kWh/m²/d')
    c.drawString(50, 500, f'Average Monthly Global Irradiation (H(i)_m): {totals_data["H(i)_m"]} kWh/m²/mo')
    c.drawString(50, 480, f'Average Annual Global Irradiation (H(i)_y): {totals_data["H(i)_y"]} kWh/m²/y')
    c.drawString(50, 460, f'Standard Deviation of Monthly Energy Production (SD_m): {totals_data["SD_m"]} kWh')
    c.drawString(50, 440, f'Standard Deviation of Annual Energy Production (SD_y): {totals_data["SD_y"]} kWh')
    c.drawString(50, 420, f'Angle of Incidence Loss (l_aoi): {totals_data["l_aoi"]}%')
    c.drawString(50, 400, f'Spectral Loss (l_spec): {totals_data["l_spec"]}%')
    c.drawString(50, 380, f'Temperature and Irradiance Loss (l_tg): {totals_data["l_tg"]}%')
    c.drawString(50, 360, f'Total Loss (l_total): {totals_data["l_total"]}%')

    c.showPage()

    c.drawImage(path_to_source + 'monthly_energy_production.png', 50, 350, width=500, height=250)

    c.drawImage(path_to_source + 'pv_image.png', 50, 50, width=500, height=250)

    c.save()

    print(f"Report generated and saved as {pdf_file}")

    return True

def process_map_data(data, response_msg):
    try:
        parsed_data = json.loads(data)
        lat = parsed_data['lat']
        lon = parsed_data['lng']
        shapes = parsed_data['shapes']
        print(shapes)
        imageUrl = parsed_data['imageUrl']
        imageUrl = imageUrl.replace('data:image/png;base64,', '')
        save_path = './web_pv_designer/pdf_sources/'
        with open(save_path + 'pv_image.png', "wb") as fh:
            fh.write(base64.decodebytes(imageUrl.encode()))
        im = Image.open(save_path + 'pv_image.png')
        width, height = im.size
        im = im.crop((0, 0, width, height - 15))
        im.save(save_path + 'pv_image.png')
        # Save data to the database

    except json.JSONDecodeError as e:
        return JsonResponse({"error": f"Invalid JSON format: {e}"}, status=400)
    return JsonResponse(response_msg)
