import json
import requests
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from .forms import SolarPVCalculatorForm
from .utils import rotate_pv_img, create_pdf_report, process_map_data, set_params
from django.views.decorators.csrf import csrf_exempt
from .models import SolarPVCalculator, MapData

def solar_pv_calculator(request):
    if request.method == 'POST':
        form = SolarPVCalculatorForm(request.POST)
        if form.is_valid():
            form.instance.user = request.user
            data = form.cleaned_data
            calculation = form.save(commit=False)
            calculation.user = request.user
            calculation.save()
            base_url = 'https://re.jrc.ec.europa.eu/api/PVcalc'
            params = set_params(data)
            response = requests.get(base_url, params=params)
            with open('./web_pv_designer/pdf_sources/' + str(request.user.id) + '/response.json', 'wb') as f:
                f.write(response.text.encode('utf-8'))
            return redirect('calculation_result')
    elif request.method == 'GET':
        form = SolarPVCalculatorForm()
        id = request.GET.get('id')
        map_data = MapData.objects.get(id=id)
        map_data = json.dumps(map_data.to_JSON())
        return render(request, 'solar_pv_calculator.html', {'form': form, 'map_data': map_data})

    else:
        form = SolarPVCalculatorForm()
    return render(request, 'solar_pv_calculator.html', {'form': form})


def index(request):
    return render(request, 'home.html')


def map_view(request):
    record_id = request.GET.get('record_id')  # Get the record ID query parameter
    if record_id:
        map_data = get_object_or_404(MapData, id=record_id).to_JSON()
        latitude = map_data['latitude']
        longitude = map_data['longitude']
        map_data = json.dumps(map_data)
        return render(request, 'map.html', {'latitude': latitude, 'longitude': longitude, 'map_data': map_data})
    latitude = 49.83137
    longitude = 18.16086
    return render(request, 'map.html', {'latitude': latitude, 'longitude': longitude, 'map_data': {}})


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


def calculations_list(request):
    records = SolarPVCalculator.objects.filter(user=request.user)
    context = {'records': records}
    return render(request, 'user_calculations.html', context)
