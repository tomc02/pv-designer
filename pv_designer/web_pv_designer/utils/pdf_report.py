import copy
import json
import os
from io import BytesIO

from django.conf import settings
from matplotlib import pyplot as plt
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image as ImagePlatypus, TableStyle, Table


def create_pdf_report(user_id, areas, pv_data):
    pdf_file = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'static', 'pv_data_report.pdf')
    path_to_source = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str(user_id)) + '/'
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

    known_consumption = pv_data.known_consumption
    if known_consumption:
        year_consumption = pv_data.consumption_per_year
        year_energy_data = data['outputs']['totals']['fixed']
        year_production = year_energy_data['E_y']

        print(f"year_consumption: {year_consumption}")
        print(f"year_production: {year_production}")

        plt.figure(figsize=(10, 6))

        pie_plot = plt.pie([year_consumption, year_production], labels=['Consumption', 'Production'], colors=['#4285F4', '#DB4437'], autopct='%1.1f%%', startangle=90)
        plt.title('Yearly Consumption vs Production')


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
