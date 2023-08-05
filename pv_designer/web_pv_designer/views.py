from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from allauth.account.forms import ChangePasswordForm, SetPasswordForm
from allauth.account.views import LogoutView
from .forms import SolarPVCalculatorForm

def solar_pv_calculator(request):
    if request.method == 'POST':
        form = SolarPVCalculatorForm(request.POST)
        if form.is_valid():
            form.save()
            # Add your calculations or processing logic here
            return render(request, 'calculation_result.html')  # Replace with the actual result page
    else:
        form = SolarPVCalculatorForm()
    return render(request, 'solar_pv_calculator.html', {'form': form})
# Create your views here.
def index(request):
    # retutn index page from templates
    return render(request, 'home.html')
def map_view(request):
    # retutn index page from templates
    return render(request,'map.html')

@login_required
def account_details(request):
    user = request.user
    return render(request, 'account/account_details.html', {'user': user})
