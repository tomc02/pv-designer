import json
import os

import requests
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse

from .forms import SolarPanelForm
from .utils import rotate_pv_img, create_pdf_report, process_map_data, set_params, save_response, get_pvgis_response, make_api_calling
from django.views.decorators.csrf import csrf_exempt
from .models import MapData, SolarPanel
from django.views.static import serve

from django.conf import settings


def start_page(request):
    if request.method == 'POST':
        form = SolarPanelForm(request.POST)
        if form.is_valid():
            print(form.cleaned_data)
            form.instance.user = request.user
            saved_instance = form.save()
            return redirect(reverse('map', kwargs={'instance_id': saved_instance.id}))
        else:
            print(form.errors)
    else:
        form = SolarPanelForm()

    return render(request, 'start_page.html', {'form': form, 'solar_panels' : SolarPanel.objects.all()})


def index(request):
    return render(request, 'home.html')


def map_view(request, instance_id):
    record_id = request.GET.get('record_id')
    if record_id:
        print("record_id: " + record_id)
        map_data = get_object_or_404(MapData, id=record_id).to_JSON()
        latitude = map_data['latitude']
        longitude = map_data['longitude']
        areasObjects = MapData.objects.get(id=record_id).areasObjects.all()
        areasObjects = [area.to_JSON() for area in areasObjects]
        print(areasObjects)
        map_data = json.dumps(map_data)
        print(map_data)
        return render(request, 'map.html', {'latitude': latitude, 'longitude': longitude, 'map_data': map_data, 'areas_objects': areasObjects})
    latitude = 49.83137
    longitude = 18.16086
    return render(request, 'map.html', {'latitude': latitude, 'longitude': longitude, 'map_data': {}, 'instance_id': instance_id})


@login_required
def account_details(request):
    user = request.user
    return render(request, 'account/account_details.html', {'user': user})


def rotate_img(request):
    angle = request.GET.get('angle')
    slope = request.GET.get('slope')
    result = rotate_pv_img(angle, slope,'/static/images/pv_panel.png', '/static/images/pv_panel_rotated')
    result = rotate_pv_img(angle, slope,'/static/images/pv_panel_selected.png', '/static/images/pv_panel_selected_rotated')
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
                #save_response(get_pvgis_response(params), request.user.id)
                return JsonResponse({'message': 'Data saved', 'id': result})
            else:
                return result
        else:
            return JsonResponse(response_msg)
    return JsonResponse({"error": "Invalid request method"})


def calculation_result(request):
    req_id = request.GET.get('id')
    if req_id:
        make_api_calling(req_id, request.user.id)
        save_path = './web_pv_designer/pdf_sources/'+str(request.user.id)+'/'
        pdf_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str(request.user.id), 'pv_data_report.pdf')
        pdf_created = create_pdf_report(save_path)
        if pdf_created:
            return render(request, 'calculation_result.html', {'pdf_path' : pdf_path})
        else:
            pass
            # something went wrong


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

        # Use reverse to construct the URL for 'calculation_result' without the '/pdf_result/' prefix
        redirect_url = reverse('calculation_result') + f'?id={calculation_id}'
        return redirect(redirect_url)

def delete_record(request):
    if request.method == 'POST':
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