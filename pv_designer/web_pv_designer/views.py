import base64
import json

import pandas as pd
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from allauth.account.forms import ChangePasswordForm, SetPasswordForm
from allauth.account.views import LogoutView
from .forms import SolarPVCalculatorForm
from .utils import rotate_pv_img
import requests
from django.views.decorators.csrf import csrf_exempt


from .models import SolarPVCalculator


def solar_pv_calculator(request):
    if request.method == 'POST':
        lat = request.POST.get('lat')
        long = request.POST.get('long')
        form = SolarPVCalculatorForm(request.POST)
        if form.is_valid():
            form.instance.user = request.user
            data = form.cleaned_data
            calculation = form.save(commit=False)
            calculation.user = request.user
            calculation.save()
            base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
            print(data['pv_electricity_price'])
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
            with open('response.json', 'wb') as f:
                f.write(response.text.encode('utf-8'))

            return render(request, 'calculation_result.html', {'result': response})
    else:
        form = SolarPVCalculatorForm()
        lat = 0
        long = 0
    return render(request, 'solar_pv_calculator.html', {'form': form, 'lat': lat, 'long': long})


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
    angle = request.GET.get('angle')  # Get parameter value from AJAX request
    result = rotate_pv_img(angle)  # Call your Python function with the parameter
    return JsonResponse({'result': result})

@csrf_exempt
def ajax_endpoint(request):
    if request.method == "POST":
        custom_header_value = request.META.get("HTTP_CUSTOM_HEADER", "")
        data_from_js = request.POST.get("data", "")
        response_data = {"message": "Data received and processed in backend"}
        try:
            parsed_data = json.loads(data_from_js)  # Parse the JSON data
            lat = parsed_data['lat']
            lng = parsed_data['lng']
            shapes = parsed_data['shapes']
            print(shapes)
            imageUrl = parsed_data['imageUrl']
            imageUrl = imageUrl.replace('data:image/png;base64,', '')
            save_path = './web_pv_designer/pdf_sources/'
            with open(save_path + 'pv_image.png', "wb") as fh:
                fh.write(base64.decodebytes(imageUrl.encode()))

            # Save data to the database

        except json.JSONDecodeError as e:
            return JsonResponse({"error": f"Invalid JSON format: {e}"}, status=400)

        return JsonResponse(response_data)
    return JsonResponse({"error": "Invalid request method"})

