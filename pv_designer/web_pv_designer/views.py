from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from allauth.account.forms import ChangePasswordForm, SetPasswordForm
from allauth.account.views import LogoutView

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
