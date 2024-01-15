import json
import requests
from django.core.management.base import BaseCommand
from pv_designer.web_pv_designer.models import SolarPanel

class Command(BaseCommand):
    help = 'Import solar panel data from an external source'

    def handle(self, *args, **options):
        # You can replace the URL with the actual URL of the data source
        api_url = 'https://example.com/api/solar_panels'

        try:
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()

            # Assuming data is a list of dictionaries with 'model', 'width', 'height', and 'power' keys
            for panel_data in data:
                SolarPanel.objects.create(
                    model=panel_data['model'],
                    width=panel_data['width'],
                    height=panel_data['height'],
                    power=panel_data['power']
                )

            self.stdout.write(self.style.SUCCESS('Successfully imported solar panel data'))

        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f'Failed to import solar panel data. Error: {e}'))
