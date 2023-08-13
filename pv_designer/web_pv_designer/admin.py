from django.contrib import admin
from .models import CustomUser, SolarPVCalculator, MapData

# Register your models here.
admin.site.site_header = "PV Designer Admin"
admin.site.site_title = "PV Designer Admin Portal"
admin.site.index_title = "Welcome to PV Designer Portal"

admin.site.register(CustomUser)
admin.site.register(SolarPVCalculator)
admin.site.register(MapData)
