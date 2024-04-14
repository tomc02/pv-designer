"""
URL configuration for pv_designer project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views;
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from web_pv_designer import views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),  # Include allauth URLs
    path('', views.index, name='home'),
    path('map/', views.map_view, name='map'),
    path('accounts/details/', views.account_details, name='account_details'),
    path('accounts/update/', views.account_update, name='account_update'),
    path('rotate_img/', views.rotate_img, name='rotate_img'),
    path('ajax_endpoint/', views.ajax_endpoint, name='ajax_endpoint'),
    path('calculation_result/<int:id>/', views.calculation_result, name='calculation_result'),
    path('calculations/', views.calculations_list, name='calculations'),
    path('pdf_result/', views.get_pdf_result, name='get_pdf_result'),
    path('data/', views.data_page, name='data_page'),
    path('delete_record/', views.delete_record, name='delete_record'),
    path('add_solar_panel/', views.add_solar_panel, name='add_solar_panel'),
    path('get_solar_panels/', views.get_solar_panels, name='get_solar_panels'),
    path('api/google-maps-js', views.google_maps_js, name='google-maps-js'),
    path('mapy-cz-tiles/<int:zoom>/<int:x>/<int:y>/', views.mapy_cz_tiles, name='mapy_cz_tiles'),
    path('pdf/', views.serve_pdf, name='serve_pdf'),
]
