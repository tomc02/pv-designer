import json
import os

import matplotlib
import requests
from django.conf import settings
from django.http import JsonResponse

from .images import save_map_img, delete_rotated_images
from ..models import MapData, Area, CustomUser, SolarPanel

matplotlib.use('Agg')


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
            parse_areas_data(parsed_data['shapesData'], map_data, float(map_data.solar_panel.power))
        else:
            last_map_data = MapData.objects.last()
            if last_map_data is None:
                id = 0
            else:
                id = last_map_data.id
            img_path = save_map_img(parsed_data['imageUrl'], user_id, id + 1)
            pv_panel = SolarPanel.objects.get(id=parsed_data['solarPanelID'])
            user_obj = CustomUser.objects.get(id=user_id)
            map_data = MapData(user=user_obj, latitude=parsed_data['lat'], longitude=parsed_data['lng'],
                               areas=parsed_data['shapes'],
                               areasData=parsed_data['shapesData'], zoom=parsed_data['zoom'], map_image=img_path,
                               solar_panel=pv_panel)
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
            mounting_position=area['mountingType'],
            slope=area['slope'],
            azimuth=area['azimuth'],
            title=area['title'],
            rotations=area['rotations'],
        )
        area_instance.save()
        print(area_instance)
        map_data.areasObjects.add(area_instance)
    map_data.save()


def get_pvgis_response(params):
    base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
    response = requests.get(base_url, params=params)
    return response


def get_pvgis_response_off_grid(params):
    base_url = 'https://re.jrc.ec.europa.eu/api/SHScalc'
    response = requests.get(base_url, params=params)
    return response


def save_response(file_name, response, user_id, index=0):
    path_to_source = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str(user_id))
    with open(path_to_source + '/' + file_name + str(index) + '.json', 'wb') as f:
        f.write(response.text.encode('utf-8'))


def make_api_calling(data_id, user_id):
    map_data = MapData.objects.get(id=data_id)
    areas = map_data.areasObjects.all()
    pv_power_plant = map_data.pv_power_plant
    sum_power = 0
    params = []
    index = 0
    for area in areas:
        param = {
            'lat': map_data.latitude,
            'lon': map_data.longitude,
            'pvtechchoice': map_data.solar_panel.pv_technology,
            'peakpower': area.installed_peak_power / 1000,
            'loss': pv_power_plant.system_loss,
            'mountingplace': area.mounting_position == 'optimize' and 'free' or area.mounting_position,
            'angle': area.slope,
            'aspect': area.azimuth,
            'pvprice': pv_power_plant.pv_electricity_price and '1' or '0',
            'systemcost': pv_power_plant.pv_system_cost,
            'interest': pv_power_plant.interest,
            'lifetime': pv_power_plant.lifetime,
            'outputformat': 'json',
            'optimalinclination': area.mounting_position == 'optimize' and '1' or '0',
            'optimalangles': area.mounting_position == 'optimize' and '1' or '0',
        }
        params.append(param)
        save_response("response", get_pvgis_response(param), user_id, index)
        index += 1
        sum_power += area.installed_peak_power

    if pv_power_plant.off_grid:
        param = {
            'lat': map_data.latitude,
            'lon': map_data.longitude,
            'peakpower': sum_power / 1000,
            'angle': areas[0].slope,
            'aspect': areas[0].azimuth,
            'batterysize': pv_power_plant.battery_capacity,
            'cutoff': pv_power_plant.discharge_cutoff_limit,
            'consumptionday': pv_power_plant.consumption_per_day,
            'outputformat': 'json'
        }
        save_response("response_off_grid", get_pvgis_response_off_grid(param), user_id, 0)
