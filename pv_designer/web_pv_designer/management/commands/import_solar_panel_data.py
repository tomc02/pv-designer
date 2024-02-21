from django.core.management.base import BaseCommand
from web_pv_designer.models import SolarPanel
import csv


class Command(BaseCommand):
    help = 'Fill SolarPanel model from CSV file'

    def add_arguments(self, parser):
        # Make the csv_file argument optional
        parser.add_argument('csv_file', nargs='?', type=str, help='Path to the CSV file')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs.get('csv_file')

        if csv_file_path is None:
            self.stdout.write('Please enter the path to the CSV file with solar panels:')
            csv_file_path = input()

        with open(csv_file_path, 'r') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                manufacturer, model, width, height, power, pv_technology = row
                SolarPanel.objects.create(
                    manufacturer=manufacturer,
                    model=model,
                    width=float(width) / 1000,  # width is in mm and converting it to meters
                    height=float(height) / 1000,  # height is in mm and converting it to meters
                    power=float(power),
                    pv_technology=pv_technology
                )
        self.stdout.write(self.style.SUCCESS('SolarPanel model filled successfully from CSV.'))
