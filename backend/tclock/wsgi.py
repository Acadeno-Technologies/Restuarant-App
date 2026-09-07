"""Django WSGI config for T Clock project."""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tclock.settings')
application = get_wsgi_application()
