from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models


class CustomUser(AbstractUser):
    address = models.CharField(max_length=255, blank=True, null=True)
    home_location = models.PointField(blank=True, null=True)

    def __str__(self):
        return self.username


class MapData(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    zoom = models.IntegerField()
    map_image = models.ImageField(upload_to='map_images/', blank=True, null=True)
    pv_power_plant = models.ForeignKey('PVPowerPlant', null=True, on_delete=models.CASCADE)
    areasObjects = models.ManyToManyField('Area', blank=True)
    solar_panel = models.ForeignKey('SolarPanel', on_delete=models.PROTECT, null=True)

    def __str__(self):
        return f"Map Data - ID: {self.id}"

    def areas_objects_to_JSON(self):
        return [area.to_JSON() for area in self.areasObjects.all()]

    def to_JSON(self):
        areas = self.areas_objects_to_JSON()
        return {
            'id': self.id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'areas': self.areas,
            'areasData': areas,
            'zoom': self.zoom,
            'solar_panel_id': self.solar_panel.id,
        }


class PVPowerPlant(models.Model):
    title = models.CharField(max_length=255)
    system_loss = models.FloatField()
    pv_electricity_price = models.BooleanField(default=False)
    pv_system_cost = models.FloatField(blank=True, null=True)
    interest = models.FloatField(blank=True, null=True)
    lifetime = models.IntegerField(blank=True, null=True)
    off_grid = models.BooleanField(default=False)
    battery_capacity = models.FloatField(blank=True, null=True)
    discharge_cutoff_limit = models.FloatField(blank=True, null=True)
    consumption_per_day = models.FloatField(blank=True, null=True)
    known_consumption = models.BooleanField(default=False)
    consumption_per_year = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Area(models.Model):
    panels_count = models.IntegerField()
    installed_peak_power = models.FloatField()
    mounting_position = models.CharField(max_length=20, choices=(
        ('free', 'Free standing'),
        ('building', 'Roof added'),
        ('optimize', 'Optimize position'),
    ))
    slope = models.FloatField()
    azimuth = models.FloatField()
    title = models.CharField(max_length=255)
    rotations = models.IntegerField()
    polygon = models.PolygonField(blank=True, null=True)

    def __str__(self):
        return f"Area - ID: {self.id}"

    def get_polygon_coords(self):
        dict_coords = {}
        for i in range(len(self.polygon.coords[0]) - 1):
            dict_coords[i] = [self.polygon.coords[0][i][1], self.polygon.coords[0][i][0]] # lat, lon
        return dict_coords

    def to_JSON(self):
        return {
            'id': self.id,
            'panels_count': self.panels_count,
            'installed_peak_power': self.installed_peak_power,
            'mounting_position': self.mounting_position,
            'slope': self.slope,
            'azimuth': self.azimuth,
            'title': self.title,
            'rotations': self.rotations,
            'polygon': self.get_polygon_coords(),
        }


class SolarPanel(models.Model):
    manufacturer = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    width = models.FloatField()
    height = models.FloatField()
    power = models.FloatField()
    pv_technology = models.CharField(max_length=20, choices=(
        ('crystSi', 'Crystalline silicon'),
        ('CIS', 'Copper indium selenide'),
        ('CdTe', 'Cadmium telluride'),
        ('Unknown', 'Unknown'),
    ))
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True)

    def __str__(self):
        pv_technology_display = dict(self._meta.get_field('pv_technology').flatchoices).get(self.pv_technology,
                                                                                            self.pv_technology)
        return f"{self.manufacturer} - {self.model} - {self.width}m - {self.height}m - {self.power}W - {pv_technology_display}"
