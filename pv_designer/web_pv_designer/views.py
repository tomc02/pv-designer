import json
import os

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .forms import SolarPanelForm, AddSolarPanelForm
from .models import MapData, SolarPanel
from .utils.images import rotate_pv_img
from .utils.pdf_report import create_pdf_report
from .utils.utils import process_map_data, make_api_calling

@login_required
def data_page(request):
    if request.method == 'POST':
        form = SolarPanelForm(request.POST)
        if form.is_valid():
            print(form.cleaned_data)
            form.instance.user = request.user
            saved_instance = form.save()
            map_data_id = form.cleaned_data['map_id']
            if map_data_id:
                map_data = MapData.objects.get(id=map_data_id)
                map_data.pv_power_plant = saved_instance
                map_data.save()
                return redirect('calculation_result', id=map_data_id)
        else:
            print(form.errors)
    else:
        req_id = request.GET.get('id')
        if req_id:
            form = SolarPanelForm()
            # if exists map data with this id
            map_data = get_object_or_404(MapData, id=req_id)
            # if map_data.pv_power_plant exists
            if map_data.pv_power_plant:
                form = SolarPanelForm(instance=map_data.pv_power_plant)
            form.fields['map_id'].initial = req_id
            return render(request, 'data_page.html', {'form': form})


def index(request):
    return render(request, 'home.html')

@login_required
def map_view(request):
    record_id = request.GET.get('record_id')

    panel_size = json.dumps(
        {'width': 1,
         'height': 2})

    if record_id:
        print("record_id: " + record_id)
        map_data = get_object_or_404(MapData, id=record_id).to_JSON()
        areasObjects = MapData.objects.get(id=record_id).areasObjects.all()
        areasObjects = [area.to_JSON() for area in areasObjects]

        context = {
            'latitude': map_data['latitude'],
            'longitude': map_data['longitude'],
            'map_data': json.dumps(map_data),
            'areas_objects': areasObjects,
            'instance_id': 0,
            'panel_size': panel_size,
            'solar_panels': SolarPanel.objects.all(),
        }

        return render(request, 'map.html', context)
    latitude = 49.83137
    longitude = 18.16086
    context = {
        'latitude': latitude,
        'longitude': longitude,
        'map_data': {},
        'areas_objects': [],
        'instance_id': 0,
        'panel_size': panel_size,
        'solar_panels': SolarPanel.objects.all(),
    }
    return render(request, 'map.html', context)


@login_required
def account_details(request):
    user = request.user
    return render(request, 'account/account_details.html', {'user': user})


def rotate_img(request):
    angle = request.GET.get('angle')
    slope = request.GET.get('slope')
    result = rotate_pv_img(angle, slope, 'pv_panel', 'pv_panel_rotated')
    result = rotate_pv_img(angle, slope, 'pv_panel_selected',
                           'pv_panel_selected_rotated')
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
                # save_response(get_pvgis_response(params), request.user.id)
                return JsonResponse({'message': 'Data saved', 'id': result})
            else:
                return result
        else:
            return JsonResponse(response_msg)
    return JsonResponse({"error": "Invalid request method"})

@login_required
def calculation_result(request, id):
    make_api_calling(id, request.user.id)
    pdf_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str(request.user.id),
                            'pv_data_report.pdf')
    map_data = MapData.objects.get(id=id)
    areas = map_data.areasObjects.all()
    pdf_created = create_pdf_report(request.user.id, areas, map_data)
    if pdf_created:
        return render(request, 'calculation_result.html', {'pdf_path': pdf_path})
    else:
        pass
        # something went wrong

@login_required
def calculations_list(request):
    records = MapData.objects.filter(user=request.user)
    context = {'records': records}
    return render(request, 'user_calculations.html', context)


def get_pdf_result(request):
    if request.method == 'GET':
        calculation_id = request.GET.get('id')
        map_data = MapData.objects.get(id=calculation_id)
        image = map_data.map_image
        image_path = './web_pv_designer/pdf_sources/' + str(request.user.id) + '/' + 'pv_image.png'
        with open(image_path, 'wb') as f:
            f.write(image.file.read())
        return redirect('calculation_result', id=calculation_id)


def delete_record(request):
    if request.method == 'POST':
        print('delete record' + str(request.GET.get('id')))
        record_id = request.GET.get('id')
        record = get_object_or_404(MapData, id=record_id)
        os.remove(os.path.join(settings.MEDIA_ROOT, record.map_image.name))
        for area in record.areasObjects.all():
            area.delete()
        record.pv_power_plant.delete()
        record.delete()
        return redirect('calculations')
    else:
        # Handle other HTTP methods if needed
        return redirect('calculations')

def add_solar_panel(request):
    if request.method == 'POST':
        form = AddSolarPanelForm(request.POST)
        if form.is_valid():
            solar_panel = form.save()
            solar_panel.user = request.user
            solar_panel.save()
            return redirect('add_solar_panel')
    else:
        form = AddSolarPanelForm()

    return render(request, 'add_solar_panel.html', {'form': form})