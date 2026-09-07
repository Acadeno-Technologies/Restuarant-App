from django.core.management.base import BaseCommand
from menu.models import Category, MenuItem
from tables.models import DiningTable, Reservation
from orders.models import Order, OrderItem
from billing.models import Bill

class Command(BaseCommand):
    help = 'Clears all categories, menu items, dining tables, reservations, orders, order items, and bills from the database for a completely fresh start.'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')

        # Delete operational data first
        b_count, _ = Bill.objects.all().delete()
        oi_count, _ = OrderItem.objects.all().delete()
        o_count, _ = Order.objects.all().delete()
        r_count, _ = Reservation.objects.all().delete()
        
        # Delete catalog and layout data
        m_count, _ = MenuItem.objects.all().delete()
        c_count, _ = Category.objects.all().delete()
        t_count, _ = DiningTable.objects.all().delete()

        self.stdout.write(self.style.SUCCESS(
            f'Successfully removed:\n'
            f' - {m_count} Menu Items\n'
            f' - {c_count} Categories\n'
            f' - {t_count} Dining Tables\n'
            f' - {r_count} Reservations\n'
            f' - {o_count} Orders\n'
            f' - {oi_count} Order Items\n'
            f' - {b_count} Bills\n'
            f'Database is now completely clean and ready for fresh data!'
        ))
