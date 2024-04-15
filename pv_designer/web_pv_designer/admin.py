from django.contrib.gis import admin
from .models import CustomUser, PVPowerPlant, PVSystemDetails, Area, SolarPanel, MonthlyConsumption

# Register your models here.
admin.site.site_header = 'PV Designer Admin'
admin.site.site_title = 'PV Designer Admin Portal'
admin.site.index_title = 'Welcome to PV Designer Portal'

admin.site.register(CustomUser)
admin.site.register(PVPowerPlant)
admin.site.register(PVSystemDetails)
admin.site.register(Area, admin.OSMGeoAdmin)
admin.site.register(SolarPanel)
admin.site.register(MonthlyConsumption)

