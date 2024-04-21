from allauth.account.forms import SignupForm, LoginForm, ChangePasswordForm
from django import forms
from django.contrib.gis.geos import Point

from .models import PVSystemDetails, SolarPanel, CustomUser, MonthlyConsumption
from .maps_config import INITIAL_LATITUDE, INITIAL_LONGITUDE


class CustomSignupForm(SignupForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'

    pass


class CustomLoginForm(LoginForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['login'].widget.attrs['class'] = 'form-control mb-3'
        self.fields['password'].widget.attrs['class'] = 'form-control mb-3'
        self.fields['remember'].widget.attrs['class'] = 'form-check-input'


class PVSystemDetailsForm(forms.ModelForm):
    map_id = forms.IntegerField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = PVSystemDetails
        fields = ['title', 'system_loss', 'pv_electricity_price', 'pv_system_cost', 'interest', 'lifetime', 'consumption_per_year']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'system_loss': forms.NumberInput(attrs={'class': 'form-control'}),
            'pv_electricity_price': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'pv_system_cost': forms.NumberInput(attrs={'class': 'form-control'}),
            'interest': forms.NumberInput(attrs={'class': 'form-control'}),
            'lifetime': forms.NumberInput(attrs={'class': 'form-control'}),
            'consumption_per_year': forms.NumberInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super(PVSystemDetailsForm, self).__init__(*args, **kwargs)
        self.fields['map_id'].label = 'Map ID'


class SolarPanelForm(forms.ModelForm):
    class Meta:
        model = SolarPanel
        fields = ['manufacturer', 'model', 'width', 'height', 'power', 'pv_technology']

        widgets = {
            'manufacturer': forms.TextInput(attrs={'class': 'form-control'}),
            'model': forms.TextInput(attrs={'class': 'form-control'}),
            'width': forms.NumberInput(attrs={'class': 'form-control'}),
            'height': forms.NumberInput(attrs={'class': 'form-control'}),
            'power': forms.NumberInput(attrs={'class': 'form-control'}),
            'pv_technology': forms.Select(attrs={'class': 'form-control'}),
        }


class UserAccountForm(forms.ModelForm):
    latitude = forms.FloatField(widget=forms.HiddenInput(), required=False)
    longitude = forms.FloatField(widget=forms.HiddenInput(), required=False)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'latitude', 'longitude']
    def __init__(self, *args, **kwargs):
        super(UserAccountForm, self).__init__(*args, **kwargs)
        if self.instance.home_location:
            self.fields['latitude'].initial = self.instance.home_location.y
            self.fields['longitude'].initial = self.instance.home_location.x
        else:
            self.fields['latitude'].initial = INITIAL_LATITUDE
            self.fields['longitude'].initial = INITIAL_LONGITUDE
        self.fields['username'].widget.attrs['class'] = 'form-control'
        self.fields['email'].widget.attrs['class'] = 'form-control'
        self.fields['username'].help_text = ''


    def save(self, commit=True):
        user = super().save(commit=False)
        latitude = self.cleaned_data.get('latitude')
        longitude = self.cleaned_data.get('longitude')
        if latitude and longitude:
            user.home_location = Point(longitude, latitude)
        if commit:
            user.save()
        return user


class MonthlyConsumptionForm(forms.ModelForm):
    class Meta:
        model = MonthlyConsumption
        fields = ['month', 'consumption']

        widgets = {
            'month': forms.Select(attrs={'class': 'form-control'}),
            'consumption': forms.NumberInput(attrs={'class': 'form-control'}),
        }