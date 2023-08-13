from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    address = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.username

class MapData(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    areas = models.JSONField()
    areasData = models.JSONField()
    def __str__(self):
        return f"Map Data - ID: {self.id}"

    def to_JSON(self):
        return {
            'id': self.id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'areas': self.areas,
            'areasData': self.areasData,
        }

class SolarPVCalculator(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    installed_peak_power = models.FloatField()
    system_loss = models.FloatField()
    mounting_position = models.CharField(max_length=20, choices=(
        ('option1', 'Free standing'),
        ('option2', 'Roof added'),
    ))
    slope = models.FloatField()
    azimuth = models.FloatField()
    optimize_slope = models.BooleanField(default=False)
    optimize_slope_and_azimuth = models.BooleanField(default=False)
    pv_electricity_price = models.BooleanField(default=False)
    pv_system_cost = models.FloatField(blank=True, null=True)
    interest = models.FloatField(blank=True, null=True)
    lifetime = models.IntegerField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    map_data = models.ForeignKey(MapData, on_delete=models.CASCADE, null=True)
    def __str__(self):
        return f"Solar PV Calculator - ID: {self.id}"

