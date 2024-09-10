from django.contrib import admin
from django.contrib.auth.models import Permission
from .models import Mesa, Pedido, Item, DetallePedido,EstadoPedido

from .models import Categoria, Item

admin.site.register(Permission)

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion', 'fecha_creacion')
    search_fields = ('nombre', 'descripcion')

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('id','nombre','precio', 'descripcion', 'fecha_creacion')
    search_fields = ('nombre', 'precio', 'descripcion', 'fecha_creacion', 'categoria')


@admin.register(Mesa)
class MesaAdmin(admin.ModelAdmin):
    list_display = ('id', 'numero', 'capacidad', 'ubicacion', 'ocupada', 'activa')
    list_filter = ('ocupada','activa')


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha', 'mesa', 'usuario', 'total_pedido', 'pagado','estado','es_confirmada')
    list_filter = ('fecha', 'mesa', 'usuario','estado','es_confirmada' )

@admin.register(EstadoPedido)
class EstadoPedidoAdmin(admin.ModelAdmin):
    list_display = ('id','nombre')
    list_filter = ('nombre',)


@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'item_id',
        'pedido',
        'item',
        'cantidad',
        'comentario',
    )
    list_filter = ('pedido', 'item')