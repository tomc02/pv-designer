import json
import os

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.forms import modelformset_factory
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .forms import SolarPanelForm, AddSolarPanelForm, UserAccountForm, MonthlyConsumptionForm
from .models import MapData, SolarPanel, CustomUser, MonthlyConsumption
from .utils.images import rotate_pv_img
from .utils.pdf_report import create_pdf_report
from .utils.utils import process_map_data, make_api_calling, get_user_id
from .signals import solar_panel_added
import requests



def data_page(request):
    MonthlyConsumptionFormSet = modelformset_factory(MonthlyConsumption, form=MonthlyConsumptionForm, extra=12)
    MonthlyConsumptionFormSetZero = modelformset_factory(MonthlyConsumption, form=MonthlyConsumptionForm, extra=0)
    month_names = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    if request.method == 'POST':
        form = SolarPanelForm(request.POST)
        if form.is_valid():
            print(form.cleaned_data)
            form.instance.user = request.user
            saved_instance = form.save()
            map_data_id = form.cleaned_data['map_id']
            consumption_formset = MonthlyConsumptionFormSet(request.POST)
            print(str(saved_instance.id) + 'saved_instance')
            if consumption_formset.is_valid():
                instances = consumption_formset.save(commit=False)
                for instance in instances:
                    instance.power_plant = saved_instance
                    instance.save()
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
            map_data = get_object_or_404(MapData, id=req_id)
            pv_power_plant = map_data.pv_power_plant
            initial_months = [{'month': i + 1} for i in range(12)]
            if map_data.pv_power_plant:
                form = SolarPanelForm(instance=pv_power_plant)
                consumption_objects = MonthlyConsumption.objects.filter(power_plant=pv_power_plant)
                print(str(consumption_objects.count()) + 'consumption_objects')
                if consumption_objects.count() > 0:
                    consumption_formset = MonthlyConsumptionFormSetZero(queryset=consumption_objects)
                else:
                    consumption_formset = MonthlyConsumptionFormSet(queryset=MonthlyConsumption.objects.none(),
                                                                    initial=initial_months)
            else:
                consumption_formset = MonthlyConsumptionFormSet(queryset=MonthlyConsumption.objects.none(),
                                                                initial=initial_months)
            form.fields['map_id'].initial = req_id
            return render(request, 'data_page.html', {'form': form, 'consumption_formset': consumption_formset, 'month_names': month_names})


def index(request):
    return render(request, 'home.html')


def map_view(request):
    record_id = request.GET.get('record_id')
    panel_size = json.dumps(
        {'width': 1,
         'height': 2})

    if record_id:
        print("record_id: " + record_id)
        map_data = get_object_or_404(MapData, id=record_id)
        if map_data.user != request.user:
            return redirect('home')
        map_data = map_data.to_JSON()
        areas_objects = MapData.objects.get(id=record_id).areasObjects.all()
        areas_objects = [area.to_JSON() for area in areas_objects]

        context = {
            'latitude': map_data['latitude'],
            'longitude': map_data['longitude'],
            'map_data': json.dumps(map_data),
            'areas_objects': areas_objects,
            'instance_id': 0,
            'panel_size': panel_size,
            'solar_panels': SolarPanel.objects.all(),
        }

        return render(request, 'map.html', context)
    # if users home location is set
    if request.user.is_authenticated:
        custom_user = CustomUser.objects.get(id=request.user.id)
        if custom_user.home_location:
            latitude = custom_user.home_location.y
            longitude = custom_user.home_location.x
    else:
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
    orientation = request.GET.get('orientation')
    result = rotate_pv_img(angle, slope, 'pv_panel', 'pv_panel_rotated', orientation)
    result = rotate_pv_img(angle, slope, 'pv_panel_selected',
                           'pv_panel_selected_rotated', orientation)
    return JsonResponse({'result': result})


def ajax_endpoint(request):
    if request.method == "POST":
        custom_header_value = request.META.get("HTTP_CUSTOM_HEADER", "")
        data_from_js = request.POST.get("data", "")
        response_msg = {"message": "Data received and processed in backend"}
        user_id = get_user_id(request)
        if custom_header_value == "Map-Data":
            result = process_map_data(data_from_js, str(user_id))
            if result is not JsonResponse:
                # save_response(get_pvgis_response(params), request.user.id)
                return JsonResponse({'message': 'Data saved', 'id': result})
            else:
                return result
        else:
            return JsonResponse(response_msg)
    return JsonResponse({"error": "Invalid request method"})

 
def calculation_result(request, id):
    map_data = MapData.objects.get(id=id)
    if map_data.user != request.user:
        return redirect('home')
    user_id = get_user_id(request)
    make_api_calling(id, user_id)
    pdf_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', str( user_id),
                            'pv_data_report.pdf')
    areas = map_data.areasObjects.all()
    pdf_created = create_pdf_report(user_id, areas, map_data)
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
        image_path = './web_pv_designer/pdf_sources/' + str(get_user_id(request)) + '/' + 'pv_image.png'
        with open(image_path, 'wb') as f:
            f.write(image.file.read())
        return redirect('calculation_result', id=calculation_id)


@login_required
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


@login_required
def add_solar_panel(request):
    if request.method == 'POST':
        form = AddSolarPanelForm(request.POST)
        if form.is_valid():
            solar_panel = form.save()
            solar_panel.user = request.user
            solar_panel.save()
            solar_panel_added.send(sender=solar_panel.__class__, instance=solar_panel, request=request)
            return redirect('add_solar_panel')
    else:
        form = AddSolarPanelForm()

    return render(request, 'add_solar_panel.html', {'form': form})


def get_solar_panels(request):
    solar_panels = SolarPanel.objects.all()
    data = []
    for panel in solar_panels:
        if panel.user == request.user or panel.user is None:
            data.append({'id': panel.id, 'model': panel.model, 'width': panel.width, 'height': panel.height,
                         'power': panel.power, 'pv_technology': panel.pv_technology, 'str': str(panel)})
    return JsonResponse(data, safe=False)


def google_maps_js(request):
    api_key = settings.GOOGLE_MAPS_API_KEY
    google_maps_js_url = f"https://maps.googleapis.com/maps/api/js?key={api_key}&libraries=drawing,places"
    response = requests.get(google_maps_js_url)
    return HttpResponse(response.content, content_type="application/javascript")


def mapy_cz_tiles(request, zoom, x, y):
    api_key = settings.MAPY_CZ_API_KEY
    url = f"https://api.mapy.cz/v1/maptiles/aerial/256/{zoom}/{x}/{y}?apikey={api_key}"
    response = requests.get(url)
    content_type = response.headers['Content-Type']
    return HttpResponse(response.content, content_type=content_type)


def help_page(request):
    return render(request, 'help_page.html')

def account_update(request):
    if request.method == 'POST':
        form = UserAccountForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            return redirect('account_details')  # Redirect to a new URL
    else:
        form = UserAccountForm(instance=request.user)

    return render(request, 'account/update_account.html', {'form': form})
