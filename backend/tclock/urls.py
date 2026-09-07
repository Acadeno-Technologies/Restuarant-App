"""T Clock — Root URL Configuration"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    """Fast, zero-DB health check endpoint for Render/Cron-job keep-alive pings."""
    return JsonResponse({'status': 'ok', 'service': 'tclock-pos-backend'})


urlpatterns = [
    path('api/health/', health_check, name='health_check'),
    path('api/ping/', health_check, name='ping'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/tables/', include('tables.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/kitchen/', include('kitchen.urls')),
    path('api/analytics/', include('analytics.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
