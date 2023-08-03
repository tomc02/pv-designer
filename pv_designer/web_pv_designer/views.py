from django.shortcuts import render
from allauth.account.views import LogoutView

# Create your views here.
def index(request):
    # retutn index page from templates
    return render(request, 'home.html')
def map_view(request):
    # retutn index page from templates
    return render(request,'map.html')