import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mob_backend.settings')
django.setup()
django_asgi_app = get_asgi_application()

import rooms.routing
from .middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            rooms.routing.websocket_urlpatterns
        )
    ),
})