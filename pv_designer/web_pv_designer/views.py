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
            data = form.cleaned_data
            calc = SolarPVCalculator.objects.create(
                latitude=data['latitude'],
                longitude=data['longitude'],
                installed_peak_power=data['installed_peak_power'],
                system_loss=data['system_loss'],
                mounting_position=data['mounting_position'],
                slope=data['slope'],
                azimuth=data['azimuth'],
                optimize_slope=data['optimize_slope'],
                optimize_slope_and_azimuth=data['optimize_slope_and_azimuth'],
                pv_electricity_price=data['pv_electricity_price'],
                pv_system_cost=data['pv_system_cost'],
                interest=data['interest'],
                lifetime=data['lifetime'],
                user=request.user
            )
            calc.save()
            base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
            params = {
                'lat': data['latitude'],
                'lon': data['longitude'],
                'peakpower': data['installed_peak_power'],
                'loss': data['system_loss'],
                'components': 'true',
                'format': 'json'
            }
            result = requests.get(base_url, params=params)
            with open('response.json', 'w') as f:
                f.write(result.text)
            return render(request, 'calculation_result.html', {'result': result})
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
