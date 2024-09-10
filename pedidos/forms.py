from django import forms
from .models import Pedido, DetallePedido

class PedidoForm(forms.ModelForm):
    class Meta:
        model = Pedido
        #fields = ['fecha', 'mesa', 'usuario', 'estado_pedido'] 
        fields = []

class DetallePedidoForm(forms.ModelForm):
    class Meta:
        model = DetallePedido
        fields = ['pedido', 'item', 'cantidad']


