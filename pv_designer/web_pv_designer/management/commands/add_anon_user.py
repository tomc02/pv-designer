from django.core.management.base import BaseCommand
from web_pv_designer.models import CustomUser


class Command(BaseCommand):
    help = 'Fill SolarPanel model from CSV file'

    def handle(self, *args, **kwargs):
        CustomUser.objects.get_or_create(username='anonymous', defaults={'is_active': False})
        self.stdout.write(self.style.SUCCESS('Anonymous user added successfully'))
