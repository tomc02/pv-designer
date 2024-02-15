from django.core.management.base import BaseCommand
from web_pv_designer.models import SolarPanel
import csv

class Command(BaseCommand):
    help = 'Fill SolarPanel model from CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']
        with open(csv_file_path, 'r') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                manufacturer, model, width, height, power, pv_technology = row
                SolarPanel.objects.create(
                    manufacturer=manufacturer,
                    model=model,
                    width=float(width)/1000,
                    height=float(height)/1000,
                    power=float(power),
                    pv_technology=pv_technology
                )
        self.stdout.write(self.style.SUCCESS('SolarPanel model filled successfully from CSV.'))
