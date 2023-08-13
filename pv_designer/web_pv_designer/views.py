import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect
from .forms import SolarPVCalculatorForm
from .utils import rotate_pv_img, create_pdf_report, process_map_data
import requests
from django.views.decorators.csrf import csrf_exempt
from .models import SolarPVCalculator, MapData

lat_global = 50
lon_global = 14


def solar_pv_calculator(request):
    if request.method == 'POST':
        form = SolarPVCalculatorForm(request.POST)
        if form.is_valid():
            form.instance.user = request.user
            data = form.cleaned_data
            calculation = form.save(commit=False)
            calculation.user = request.user
            # find the map data in the database by the latitude and longitude
            calculation.save()
            base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
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
            response = requests.get(base_url, params=params)
            print(response.text)
            # save the response as a csv file
            with open('./web_pv_designer/pdf_sources/' + str(request.user.id) + '/response.json', 'wb') as f:
                f.write(response.text.encode('utf-8'))
            return redirect('calculation_result')
    elif request.method == 'GET':
        form = SolarPVCalculatorForm()
        id = request.GET.get('id')
        map_data = MapData.objects.get(id=id)
        map_data = map_data.to_JSON()
        map_data = json.dumps(map_data)
        print(map_data)
        return render(request, 'solar_pv_calculator.html', {'form': form, 'map_data': map_data})

    else:
        form = SolarPVCalculatorForm()
    return render(request, 'solar_pv_calculator.html', {'form': form})


def index(request):
    return render(request, 'home.html')


def map_view(request):
    latitude = 50
    longitude = 14
    return render(request, 'map.html', {'latitude': latitude, 'longitude': longitude})


@login_required
def account_details(request):
    user = request.user
    return render(request, 'account/account_details.html', {'user': user})


def rotate_img(request):
    angle = request.GET.get('angle')
    result = rotate_pv_img(angle)
    return JsonResponse({'result': result})


@csrf_exempt
def ajax_endpoint(request):
    if request.method == "POST":
        custom_header_value = request.META.get("HTTP_CUSTOM_HEADER", "")
        data_from_js = request.POST.get("data", "")
        response_msg = {"message": "Data received and processed in backend"}
        if custom_header_value == "Map-Data":
            result = process_map_data(data_from_js, str(request.user.id))
            if result is not JsonResponse:
                # show solar pv calculator page
                return JsonResponse({'message': 'Data saved', 'id': result})
            else:
                return result
        else:
            return JsonResponse(response_msg)
    return JsonResponse({"error": "Invalid request method"})


def calculation_result(request):
    save_path = './web_pv_designer/pdf_sources/'+str(request.user.id)+'/'
    pdf_created = create_pdf_report(save_path)
    if pdf_created:
        return render(request, 'calculation_result.html')
    else:
        pass
        # something went wrong
