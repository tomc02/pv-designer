from allauth.account.signals import password_changed
from django.contrib import messages
from django.dispatch import receiver, Signal

solar_panel_added = Signal()

@receiver(solar_panel_added)
def solar_panel_added_receiver(sender, instance, request, **kwargs):
    messages.success(request, f'New solar panel {instance.model} added successfully!')