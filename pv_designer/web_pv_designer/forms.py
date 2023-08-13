from allauth.account.forms import SignupForm, LoginForm
from django import forms

from .models import SolarPVCalculator


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

        # Add custom placeholder text for form fields
        self.fields['login'].widget.attrs['placeholder'] = 'Username or Email'
        self.fields['password'].widget.attrs['placeholder'] = 'Password'


class SolarPVCalculatorForm(forms.ModelForm):
    class Meta:
        model = SolarPVCalculator
        fields = ['installed_peak_power', 'system_loss', 'mounting_position', 'slope', 'azimuth', 'optimize_slope',
                  'optimize_slope_and_azimuth', 'pv_electricity_price', 'pv_system_cost', 'interest', 'lifetime',
                  'latitude', 'longitude', 'map_data']
        widgets = {
            'installed_peak_power': forms.TextInput(attrs={'class': 'form-control'}),
            'system_loss': forms.TextInput(attrs={'class': 'form-control'}),
            'mounting_position': forms.Select(attrs={'class': 'form-control'}),
            'slope': forms.TextInput(attrs={'class': 'form-control'}),
            'azimuth': forms.TextInput(attrs={'class': 'form-control'}),
            'optimize_slope': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'optimize_slope_and_azimuth': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'pv_electricity_price': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'pv_system_cost': forms.TextInput(attrs={'class': 'form-control'}),
            'interest': forms.TextInput(attrs={'class': 'form-control'}),
            'lifetime': forms.TextInput(attrs={'class': 'form-control'}),
            'latitude': forms.HiddenInput(),
            'longitude': forms.HiddenInput(),
            'map_data': forms.HiddenInput()
        }
