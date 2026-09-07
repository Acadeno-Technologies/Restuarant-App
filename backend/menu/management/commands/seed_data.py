from django.core.management.base import BaseCommand
from accounts.models import User
from menu.models import Category, MenuItem
from tables.models import DiningTable

class Command(BaseCommand):
    help = 'Seeds PostgreSQL database with default admin user, menu categories, dishes, and dining tables'

    def handle(self, *args, **options):
        # 1. Admin user
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'role': 'admin',
                'first_name': 'Admin',
                'last_name': 'Manager',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Created initial admin user: admin / admin123'))
        else:
            self.stdout.write(self.style.SUCCESS('Admin user exists. Preserving custom client password.'))

        # 2. Staff user
        staff, s_created = User.objects.get_or_create(
            username='staff',
            defaults={
                'role': 'staff',
                'first_name': 'Cashier',
                'last_name': 'Staff',
                'is_staff': True,
            }
        )
        if s_created:
            staff.set_password('staff123')
            staff.save()

        # 3. Kitchen user
        kitchen, k_created = User.objects.get_or_create(
            username='kitchen',
            defaults={
                'role': 'kitchen',
                'first_name': 'Kitchen',
                'last_name': 'Chef',
                'is_staff': True,
            }
        )
        if k_created:
            kitchen.set_password('kitchen123')
            kitchen.save()

        # 4. Success message - No sample menu items or tables added for fresh setup
        self.stdout.write(self.style.SUCCESS('Database initial setup completed with core user roles (admin, staff, kitchen). No hardcoded sample menu items or tables seeded.'))

