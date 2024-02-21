from django.core.management.commands.migrate import Command as MigrateCommand
from django.core.management import call_command
from web_pv_designer.models import CustomUser


class Command(MigrateCommand):
    def handle(self, *args, **options):
        super().handle(*args, **options)
        if self.is_first_migration():
            call_command('import_solar_panel_data')
            call_command('add_anon_user')
    @staticmethod
    def is_first_migration():
        if not CustomUser.objects.exists():
            return True
