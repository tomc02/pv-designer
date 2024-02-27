from allauth.account.signals import password_changed
from django.contrib import messages
from django.dispatch import receiver, Signal

solar_panel_added = Signal()

@receiver(password_changed)
def password_change_success(request, **kwargs):
    messages.success(request, 'Your password has been changed successfully.')

@receiver(solar_panel_added)
def solar_panel_added_receiver(sender, instance, request, **kwargs):
    messages.success(request, f'New solar panel {instance.model} added successfully!')