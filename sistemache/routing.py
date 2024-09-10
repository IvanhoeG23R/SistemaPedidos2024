from django.urls import path
from .consumers import OrderItemConsumer  # Cambia 'your_app' por el nombre de tu aplicación

websocket_urlpatterns = [
    path('ws/orders/', OrderItemConsumer.as_asgi()),  # Aquí defines la ruta de WebSocket
]