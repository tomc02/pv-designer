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

from ..models import MonthlyConsumption


def create_pdf_report(user_id, areas, pv_data):
    pdf_file = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str(user_id), 'pv_data_report.pdf')
    path_to_source = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str(user_id)) + '/'
    doc = SimpleDocTemplate(pdf_file, pagesize=letter)
    style_sheet = getSampleStyleSheet()
    elements = []

    response_file_paths = [path_to_source + f'response{index}.json' for index in range(len(areas))]
    sum_responses(response_file_paths, path_to_source)

    with open(path_to_source + 'response_sum.json', 'r') as json_file:
        data = json.load(json_file)
        location_data = data['inputs']['location']
        lat = round(location_data['latitude'], 4)
        long = round(location_data['longitude'], 4)

    input_values = data['inputs']
    # Title
    title_style = style_sheet['Title']
    elements.append(Paragraph('Photovoltaic System Performance Report', title_style))

    # Image with PV Panels
    pv_panel_img_path = path_to_source + 'pv_image.png'
    page_content_width = doc.width
    print(f"page_content_width: {page_content_width}")
    # load the image and find its dimensions
    image = ImagePlatypus(pv_panel_img_path)
    img_width, img_height = image.wrap(doc.width, doc.height)
    # calculate aspect ratio
    aspect = float(img_height) / float(img_width)
    # calculate image width and height to fit into the page
    img_width = page_content_width
    img_height = img_width * aspect
    img = ImagePlatypus(pv_panel_img_path, width=img_width, height=img_height)
    elements.append(img)
    elements.append(Paragraph('<br/>', style_sheet['BodyText']))

    yearly_consumption = 0
    monthly_consumption_array = []
    known_consumption = pv_data.system_details.known_consumption
    if known_consumption:
        monthly_consumption = MonthlyConsumption.objects.filter(power_plant=pv_data.system_details)
        if monthly_consumption.count() < 12:
            monthly_consumption_array = [(pv_data.system_details.consumption_per_year * 1000) / 12] * 12
            yearly_consumption = pv_data.system_details.consumption_per_year
        else:
            for month in monthly_consumption:
                monthly_consumption_array.append(month.consumption)
            yearly_consumption = round(sum(monthly_consumption_array) / 1000, 2)

    consumption_per_year = pv_data.system_details.consumption_per_year
    if consumption_per_year is None:
        consumption_per_year = '-'
    total_peak_power = 0
    for area in areas:
        total_peak_power += area.installed_peak_power
    total_peak_power = round(total_peak_power / 1000, 2)
    year_production = round(float(data["outputs"]["totals"]["fixed"]["E_y"]) / 1000, 2)
    table_data = [
        ["PV Panel Type", "Location Information", "Totals"],
        [f'Model: {pv_data.solar_panel.model}', f'Latitude: {lat}', f'Energy Production: {year_production} MWh'],
        [f'Width: {pv_data.solar_panel.width} m', f'Longitude: {long}', f'Peak Power: {total_peak_power} kW'],
        [f'Height: {pv_data.solar_panel.height} m', '', f'Consumption: {yearly_consumption} MWh'],
        [f'Power: {pv_data.solar_panel.power} W', ''],
    ]

    # Create the table
    table = Table(table_data, colWidths=[page_content_width / len(table_data[0])])

    # Add style to the table(bold text in the first row)
    table_style = TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold')])
    table.setStyle(table_style)

    # Add the table to the elements
    elements.append(table)
    elements.append(Paragraph('<br/>', style_sheet['BodyText']))

    # If azimuth and slope was optimized, add the optimized values to the areas
    # For response in responses:
    index = 0
    optimized_areas = []
    for response in response_file_paths:
        with open(response, 'r') as json_file:
            print(f"Reading response file: {response}")
            data_response = json.load(json_file)
            azimuth = data_response['inputs']['mounting_system']['fixed']['azimuth']
            slope = data_response['inputs']['mounting_system']['fixed']['slope']
            if azimuth['optimal'] and slope['optimal']:
                areas[index].azimuth = azimuth['value']
                areas[index].slope = slope['value']
                optimized_areas.append(index)
            index += 1

    # Table with Area Information
    table_data = create_table(areas, page_content_width, optimized_areas)
    elements.append(table_data)
    elements.append(Paragraph('<br/>', style_sheet['BodyText']))

    if optimized_areas:
        optimized_text = 'The values highlighted in <font color="green">green</font> have been optimized for the best performance.'
        elements.append(Paragraph(optimized_text, style_sheet['BodyText']))
        elements.append(Paragraph('<br/>', style_sheet['BodyText']))

    year_energy_data = data['outputs']['totals']['fixed']

    monthly_energy_data = data['outputs']['monthly']['fixed']

    chart = create_monthly_energy_chart(monthly_energy_data, monthly_consumption_array)
    add_graph_to_report(chart, elements, page_content_width)

    totals = {'consumed': 0, 'unused': 0, 'deficit': 0}
    for i in range(0, 12):
        production = monthly_energy_data[i]['E_m']
        if monthly_consumption_array[i] >= production:
            totals['consumed'] += production
            totals['deficit'] += monthly_consumption_array[i] - production
        else:
            totals['consumed'] += monthly_consumption_array[i]
            totals['unused'] += production - monthly_consumption_array[i]

    chart = create_energy_balance_chart(totals)
    add_graph_to_report(chart, elements, page_content_width)

    # If consumption is known, create a chart with the yearly energy production and consumption
    known_consumption = pv_data.system_details.known_consumption
    if known_consumption:
        year_consumption = pv_data.system_details.consumption_per_year
        # chart = create_consumption_chart(year_consumption, year_production)
        # add_graph_to_report(chart, elements, page_content_width)

        coverage_percentage = year_production / year_consumption * 100
        coverage_percentage = round(coverage_percentage, 2)
        # elements.append(Paragraph(f'Yearly energy production covers {coverage_percentage}% of the yearly consumption',))

    # Create a chart with the losses
    # chart = create_looses_chart(year_energy_data, input_values)
    # add_graph_to_report(chart, elements, page_content_width)

    doc.build(elements)

    print(f"Report generated and saved as {pdf_file}")

    return True


def create_energy_balance_chart(totals):
    labels = ['Consumed', 'Unused', 'Deficit']
    sizes = [totals['consumed'], totals['unused'], totals['deficit']]
    chart_colors = ['#4CAF50', '#FFC107', '#F44336']
    explode = (0.1, 0, 0)
    labels_with_values = [f'{label}: {round(size, 2)} kWh' for label, size in zip(labels, sizes)]

    fig1, ax1 = plt.subplots()
    ax1.pie(sizes, explode=explode, labels=labels_with_values, colors=chart_colors,
            autopct='%1.1f%%',
            shadow=True, startangle=90)

    ax1.axis('equal')
    plt.title('Overall Energy Balance', fontsize=14)
    return plt


def create_looses_chart(year_energy_data, input_values):
    l_aoi = year_energy_data['l_aoi']  # Losses due to angle of incidence
    l_spec = year_energy_data['l_spec']  # Losses due to spectral effects
    l_tg = year_energy_data['l_tg']  # Losses due Temperature and irradiance losses
    l_system = input_values['pv_module']['system_loss']  # System losses
    l_system = l_system * -1
    l_total = year_energy_data['l_total']  # Total losses

    colors_plt = ['red' if value < 0 else 'green' for value in [l_spec, l_aoi, l_tg, l_system, l_total]]

    losses = [l_spec, l_aoi, l_tg, l_system, l_total]
    labels = ['Spectral Effects', 'Angle of Incidence', 'Temperature and Irradiance', 'System', 'Total']

    plt.figure(figsize=(12, 8))
    bars = plt.bar(labels, losses, color=colors_plt, edgecolor='black', linewidth=1.2)
    plt.title('Losses', fontsize=16)
    plt.ylabel('Percentage (%)')

    for bar, value in zip(bars, losses):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() / 2, f'{value:.2f}%', ha='center', va='center',
                 color='black', fontweight='bold', fontsize=10)

    return plt


def create_consumption_chart(year_consumption, year_production):
    categories = ['Production', 'Consumption']
    values = [year_production, year_consumption]

    plt.figure(figsize=(10, 6))
    bars = plt.barh(categories, values, color=['#4285F4', '#EA4335'], edgecolor='black', linewidth=1.2)
    plt.xlabel('Energy (MWh)')
    plt.title('Yearly Energy Production vs Consumption')

    for bar, value in zip(bars, [year_production, year_consumption]):
        plt.text(bar.get_width(), bar.get_y() + bar.get_height() / 2, f'{value:.2f} MWh',
                 va='center', ha='right', fontweight='bold', color='black', fontsize=10)

    plt.tight_layout()
    return plt


def create_monthly_energy_chart(monthly_energy_data, consumption=None):
    months = [entry['month'] for entry in monthly_energy_data]
    energy_values = [entry['E_m'] for entry in monthly_energy_data]
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    # Convert month indices to names for better readability on the chart
    month_labels = [month_names[month - 1] for month in months]

    plt.figure(figsize=(10, 6))
    bars = plt.bar(months, energy_values, color='#4285F4', edgecolor='black', linewidth=1.2, label='Energy Production')

    if consumption:
        plt.plot(months, consumption, color='red', marker='o', linestyle='-', linewidth=2, label='Consumption')

    plt.xlabel('Month')
    plt.ylabel('Energy (kWh/mo)')
    plt.title('Monthly Energy Production vs. Consumption')

    for bar, value in zip(bars, energy_values):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.2, f'{value:.2f}', ha='center', va='bottom',
                 color='black', fontweight='bold', fontsize=10)
    plt.legend()

    plt.xticks(months, labels=month_labels)
    plt.ylim(0, max(energy_values + (consumption if consumption else [0])) * 1.1)
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    plt.gca().spines['left'].set_linewidth(0.5)
    plt.gca().spines['bottom'].set_linewidth(0.5)

    plt.tight_layout()

    return plt


def create_table(areas, page_content_width, optimized_areas):
    area_info = [['Area', 'Panels Count', 'Peak Power [kW]', 'Slope [°]', 'Azimuth']]
    total_values = [0, 0, 0, 0, 0]  # Initialize total values

    index = 0
    cell_styles = []  # Initialize list to hold cell styles for optimized values
    for area in areas:
        data_json = area.to_JSON()
        azimuth = data_json['azimuth']
        slope = data_json['slope']
        if index in optimized_areas:
            # Instead of adding *, we'll change the text color later
            slope = f'{slope:.1f}'
            azimuth = f'{azimuth:.1f}'
            # Add cell style command for slope and azimuth values
            cell_styles.append(('TEXTCOLOR', (3, index + 1), (3, index + 1), colors.green))  # Slope value
            cell_styles.append(('TEXTCOLOR', (4, index + 1), (4, index + 1), colors.green))  # Azimuth value
        area_values = [data_json['title'], data_json['panels_count'], data_json['installed_peak_power'] / 1000,
                       slope, azimuth]
        area_info.append(area_values)
        total_values = [sum(x) for x in zip(total_values, area_values[1:3])]
        index += 1

    # Add row for total values
    total_values = [round(x, 2) for x in total_values]
    total_row = ['Total', *total_values, '-', '-']
    area_info.append(total_row)
    last_row_index = len(area_info) - 1

    # Initial table style configuration
    table_style = TableStyle([
                                 ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                                 ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                 ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                 ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                 ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                 ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                                 ('BACKGROUND', (0, last_row_index), (-1, last_row_index),
                                  (222 / 255, 222 / 255, 182 / 255)),
                             ] + cell_styles)  # Add cell styles for optimized values

    table_data = Table(area_info, colWidths=[page_content_width / len(area_info[0])])
    table_data.setStyle(table_style)

    return table_data


def add_graph_to_report(plt, elements, width=500, height=300):
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    plt.close()

    chart_img = ImagePlatypus(buffer, width=width, height=height)
    elements.append(chart_img)
    elements.append(Paragraph('<br/>', getSampleStyleSheet()['BodyText']))


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
            if key not in ["l_total", "l_aoi", "l_spec", "l_tg"]:
                sum_response["outputs"]["totals"]["fixed"][key] = sum_response["outputs"]["totals"]["fixed"].get(key,
                                                                                                                 0) + float(
                    response["outputs"]["totals"]["fixed"][key])

        # Summing values for losses by average because they are percentages
        for key in ["l_aoi", "l_spec", "l_tg"]:
            sum_response["outputs"]["totals"]["fixed"][key] = (
                    sum_response["outputs"]["totals"]["fixed"].get(key, 0) + float(
                response["outputs"]["totals"]["fixed"][key]))

    for key in ["l_aoi", "l_spec", "l_tg"]:
        sum_response["outputs"]["totals"]["fixed"][key] = (
                sum_response["outputs"]["totals"]["fixed"][key] / len(file_paths))
    # Summing all losses to get the total loss
    sum_response["outputs"]["totals"]["fixed"]["l_total"] = sum_response["outputs"]["totals"]["fixed"]["l_aoi"] + \
                                                            sum_response["outputs"]["totals"]["fixed"]["l_spec"] + \
                                                            sum_response["outputs"]["totals"]["fixed"]["l_tg"] - \
                                                            sum_response["inputs"]["pv_module"]["system_loss"]

    # Save the sum to a new file
    with open(path_to_source + 'response_sum.json', 'w') as output_file:
        json.dump(sum_response, output_file, indent=2)
