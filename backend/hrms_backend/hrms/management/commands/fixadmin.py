from django.core.management.base import BaseCommand
from hrms.models import User


class Command(BaseCommand):
    help = 'Fix admin user role to ADMIN'

    def handle(self, *args, **options):
        try:
            admin_user = User.objects.get(username='admin')
            self.stdout.write(f'Admin user found: {admin_user.username}, Current role: {admin_user.role}')
            
            if admin_user.role != 'ADMIN':
                admin_user.role = 'ADMIN'
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(f'✅ Fixed! Admin role updated to: {admin_user.role}'))
            else:
                self.stdout.write(self.style.SUCCESS('✅ Admin user already has correct role: ADMIN'))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Admin user not found!'))

