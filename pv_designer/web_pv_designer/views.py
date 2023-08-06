import json

import pandas as pd
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from allauth.account.forms import ChangePasswordForm, SetPasswordForm
from allauth.account.views import LogoutView
from .forms import SolarPVCalculatorForm
import requests

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
