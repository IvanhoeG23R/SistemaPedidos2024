"""
URL configuration for sistemache project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from pedidos.views import area_cocina, getData,waiterHome,eliminarPedido,buscarPedido, obtenerPedido, addItems, newOrder, kitchenHome,guardarDetalles, getDetails,actualizarEstado, salir,cashHome,login_view, cobrar
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('area_cocina/', area_cocina, name='area_cocina'),
    path('login/',login_view, name='login'),

    path('waiter/', waiterHome, name="waiter-home"),
    path('waiter/new-order/<int:id>/', addItems, name='add-items'),
    path('waiter/new-order', newOrder, name="new-order"),
    path('waiter/save-details', guardarDetalles, name="guardar_detalle"),


    path('pedidos/<int:pedidoId>/<int:estadoId>', actualizarEstado, name='actualizar_estado'),

    path('cash/', cashHome, name="cash-home"),
    path('cash/search/', buscarPedido, name="buscar_pedido"),
    path('cash/pay/', cobrar, name="cobrar"),


    path('kitchen/', kitchenHome, name="kitchen-home"),
    path('kitchen/get-details/<int:id>/', getDetails, name='add-items'),
    path('kitchen/pedido/<int:id>/', obtenerPedido, name='add-pedido'),
    path('logout/',salir, name='salir'),
    
    path('waiter/delete-order/<int:id>/', eliminarPedido, name='eliminar-pedido'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])