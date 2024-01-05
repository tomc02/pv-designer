from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    address = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username

class MapData(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    areas = models.JSONField()
    areasData = models.JSONField()
    zoom = models.IntegerField()
    map_image = models.ImageField(upload_to='map_images/', blank=True, null=True)
    pv_power_plant = models.ForeignKey('PVPowerPlant', null=True, on_delete=models.CASCADE)
    areasObjects = models.ManyToManyField('Area', blank=True)
    def __str__(self):
        return f"Map Data - ID: {self.id}"

    def to_JSON(self):
        return {
            'id': self.id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'areas': self.areas,
            'areasData': self.areasData,
            'zoom': self.zoom,
        }


class PVPowerPlant(models.Model):
    title = models.CharField(max_length=255)
    system_loss = models.FloatField()
    pv_electricity_price = models.BooleanField(default=False)
    pv_system_cost = models.FloatField(blank=True, null=True)
    interest = models.FloatField(blank=True, null=True)
    lifetime = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    solar_panel = models.ForeignKey('SolarPanel', on_delete=models.PROTECT, null=True)
class Area(models.Model):
    panels_count = models.IntegerField()
    installed_peak_power = models.FloatField()
    mounting_position = models.CharField(max_length=20, choices=(
        ('option1', 'Free standing'),
        ('option2', 'Roof added'),
    ))
    slope = models.FloatField()
    azimuth = models.FloatField()
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"Area - ID: {self.id}"

    def to_JSON(self):
        return {
            'id': self.id,
            'panels_count': self.panels_count,
            'installed_peak_power': self.installed_peak_power,
            'mounting_position': self.mounting_position,
            'slope': self.slope,
            'azimuth': self.azimuth,
            'title': self.title,
        }

class SolarPanel(models.Model):
    model = models.CharField(max_length=100)
    width = models.FloatField()
    height = models.FloatField()
    power = models.FloatField()

    def __str__(self):
        return f"{self.model} - {self.width}m - {self.height}m - {self.power}W"