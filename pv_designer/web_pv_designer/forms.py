from allauth.account.forms import SignupForm, LoginForm
from django import forms

from .models import PVPowerPlant


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


class SolarPanelForm(forms.ModelForm):
    map_id = forms.IntegerField(widget=forms.HiddenInput(), required=False)
    class Meta:
        model = PVPowerPlant
        fields = ['title', 'system_loss', 'pv_electricity_price', 'pv_system_cost', 'interest', 'lifetime']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'system_loss': forms.NumberInput(attrs={'class': 'form-control'}),
            'pv_electricity_price': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'pv_system_cost': forms.NumberInput(attrs={'class': 'form-control'}),
            'interest': forms.NumberInput(attrs={'class': 'form-control'}),
            'lifetime': forms.NumberInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super(SolarPanelForm, self).__init__(*args, **kwargs)
        self.fields['map_id'].label = 'Map ID'
