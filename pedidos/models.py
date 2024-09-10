from django.db import models
from django.contrib.auth.models import User

class Mesa(models.Model):
    numero = models.IntegerField(unique=True)
    capacidad = models.IntegerField()  
    ubicacion = models.CharField(max_length=50)
    ocupada = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"Mesa {self.numero}"

class EstadoPedido(models.Model):
  nombre = models.CharField(max_length=100, unique=True)
  def __str__(self):
     return f"{self.nombre}"
class Pedido(models.Model):
    nombre = models.CharField(max_length=50, default="consumidor final")
    cedula = models.CharField(max_length=13, default="0000000000")
    fecha = models.DateTimeField(auto_now_add=True)
    mesa = models.ForeignKey(Mesa, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    total_pedido = models.DecimalField(max_digits=10, decimal_places=2, default=0)  
    estado = models.ForeignKey(EstadoPedido, on_delete=models.RESTRICT)
    es_confirmada = models.BooleanField(default=False)
    pagado = models.BooleanField(default=False)

  
    def __str__(self):
        return f"Pedido {self.id} - {self.mesa} "



class Categoria(models.Model):
  nombre = models.CharField(max_length=100, unique=True)
  descripcion = models.TextField(blank=True, null=True)
  fecha_creacion = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return self.nombre

class Item(models.Model):
  nombre = models.CharField(max_length=100, unique=True)
  precio = models.DecimalField(max_digits=10, decimal_places=2)
  descripcion = models.TextField(max_length=200, null=True, blank=True)
  fecha_creacion = models.DateTimeField(auto_now_add=True)
  categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='items')

  def __str__(self):
    return self.nombre
    


class DetallePedido(models.Model):
    pedido = models.ForeignKey('Pedido', on_delete=models.CASCADE)
    item = models.ForeignKey('Item', on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    comentario = models.CharField(max_length=500, blank=True, null=True)
    
    

    def __str__(self):
        return f"{self.item} - {self.cantidad}"

