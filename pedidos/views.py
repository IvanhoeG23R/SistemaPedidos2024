from django.shortcuts import render, redirect, get_object_or_404
from .models import Pedido, DetallePedido, Item, Mesa, Categoria, EstadoPedido
from .forms import PedidoForm, DetallePedidoForm
from django.http import JsonResponse 
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
from django.contrib.auth.models import User
from django.contrib.auth import logout,login
import json
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from .transform import get_object_format, get_data_to_update, format_item

def login_view(request):
  if request.method == 'POST':
    #request._messages = request._messages.class_(request)
    #storage = messages.get_messages(request)
    #storage.used = True
    form = AuthenticationForm(request, data=request.POST)
    if form.is_valid():
      user = form.get_user()
      login(request, user)
      if user.has_perm('auth.mesero'): 
        return redirect('waiter-home') 
      elif user.has_perm('auth.cocina'):
        return redirect('kitchen-home') 
      elif user.has_perm('auth.caja'):
        return redirect('cash-home') 
      else:
        messages.error(request, 'No tienes los permisos necesarios para acceder.')
    else:
      messages.error(request, 'Nombre de usuario o contraseña incorrectos.')
  else:
    form = AuthenticationForm()
  return render(request, 'login.html',{'form':form})
                



def salir(request):
  logout(request)
  return redirect("login")


def area_cocina(request):
    pedidos = Pedido.objects.all()
    # TODO : FILTRAR TODOS LOS PEDIDOS PENDIENTES
    print("Pedidos en la vista:", pedidos)
    
    return render(request, 'area_cocina.html', {'pedidos': pedidos})

def camarero(request):
  user = request.user
  categories= Categoria.objects.all()
  context={
    'user': user,
    'title': 'Camarero',
    'categories': categories

  }

  if request.method == 'POST':
    categoria_id = request.POST.get('category_id', '').strip('"')
    if categoria_id:
      try:
          # Filtra los ítems por la categoría usando category_id
          items = Item.objects.filter(categoria_id=int(categoria_id)).values('id', 'nombre', 'descripcion', 'precio')
          items_list = list(items)
          return JsonResponse({'status': 'success', 'items': items_list}, safe=False)
      except Categoria.DoesNotExist:
          return JsonResponse({'status': 'error', 'message': 'Categoría no encontrada'}, status=404)

  return render(request,'camarero.html', context=context)


def crear_pedido(request):
    if request.method == 'POST':
        pedido_form = PedidoForm(request.POST)
        detalle_form = DetallePedidoForm(request.POST)
        
        if pedido_form.is_valid() and detalle_form.is_valid():
            # Crear el pedido
            pedido = pedido_form.save(commit=False)
            pedido.usuario = request.user  
            pedido.save()
            
            # Crear detalles del pedido
            detalles = detalle_form.cleaned_data['detalles'] 
            for detalle in detalles:
                DetallePedido.objects.create(
                    pedido=pedido,
                    item=detalle['item'],
                    cantidad=detalle['cantidad'],
                    comentario=detalle['comentario']
                )
            
            return redirect('area_cocina')  
    else:
        pedido_form = PedidoForm()
        detalle_form = DetallePedidoForm()

    # Obtener todas las mesas y usuarios para pasarlas al contexto
    mesas = Mesa.objects.all()  
    usuarios = request.user  # Asegúrate de tener un modelo Usuario

    context = {
        'pedido_form': pedido_form,
        'detalle_form': detalle_form,
        'mesas': mesas,  # Incluir mesas en el contexto
        'usuarios': usuarios,  # Incluir usuarios en el contexto
    }

    return render(request, 'crear_pedido.html', context)


@login_required
def waiterHome(request):
  username = request.user
  tables= Mesa.objects.all()
  context={
    'user': username,
    'title': 'Tables',
    'tables': tables

  }
  user = User.objects.get(username=username)
  if user.has_perm("auth.mesero"):
    estado =  EstadoPedido.objects.all()
    context["pedidos"]= Pedido.objects.filter(estado__in=estado, pagado = False) 
    return render(request,'waiter_home.html', context=context)
  else:
    return render(request,'403.html')

@login_required
def eliminarPedido(request,id):
  pedido = Pedido.objects.get(id=id)
  if str(pedido.estado)=="PENDIENTE":
    pedido.delete()
    mesa = Mesa.objects.get(id = pedido.mesa.id)
    mesa.ocupada = False
    mesa.save()
    return JsonResponse({'status': 'success'}, safe=False)
  else:
   return JsonResponse({'status': 'error', 'message':'no es posible eliminar este pedido'}, safe=False)

@login_required
def buscarPedido(request):
  cedula = request.POST.get('cedula', '').strip('"')
  print(cedula)
  pedidos = Pedido.objects.filter(cedula=cedula)
  pedidos = [
            {
                'id': pedido.id,
                'cedula': pedido.cedula,
                'fecha': pedido.fecha, 
                'total': str(pedido.total_pedido), 
                'nombre': str(pedido.nombre), 
                'mesa': str(pedido.mesa.id), 
            }
            for pedido in pedidos
        ]
  return JsonResponse({'status': 'success','pedido':pedidos}, safe=False)




@login_required
def newOrder(request):
  user = request.user
  tables= Mesa.objects.all()
  context={
    'user': user,
    'title': 'Tables',
    'tables': tables

  }
  if request.method=="POST":
     mesa_id=request.POST.get('mesa_id', '').strip('"')
     mesa = get_object_or_404(Mesa, id=mesa_id)
     mesa.ocupada=True
     mesa.save()
     estado = get_object_or_404(EstadoPedido,id="1")
     pedido = Pedido.objects.create(
            mesa=mesa,
            usuario=request.user,
            estado=estado,
        )
     return JsonResponse({'status': 'success','detalle_id':pedido.id}, safe=False)
  return render(request,'new_order.html', context=context)
   

@login_required
def addItems(request, id):
  user = request.user
  categories= Categoria.objects.all()
  context={
    'user': user,
    'title': 'Camarero',
    'categories': categories

  }

  if request.method == 'POST':
    category_id = request.POST.get('category_id', '').strip('"')
    if category_id:
      try:
          # Filtra los ítems por la categoría usando category_id
          items = Item.objects.filter(categoria_id=int(category_id)).values('id', 'nombre', 'descripcion', 'precio')
          items_list = list(items)
          return JsonResponse({'status': 'success', 'items': items_list}, safe=False)
      except Categoria.DoesNotExist:
          return JsonResponse({'status': 'error', 'message': 'Categoría no encontrada'}, status=404)
    pedido_id = request.POST.get('pedido_id', '').strip('"')
    if pedido_id:
      pedido = Pedido.objects.get(id=pedido_id)
      if pedido.pagado == True:
        return JsonResponse({'status': 'not_exist'}, safe=False)
      pedido = {
        "nombre":pedido.nombre,
        "cedula":pedido.cedula,
        "total":pedido.total_pedido,
        "estado":pedido.estado.nombre
      }
      items = DetallePedido.objects.filter(pedido_id = int(pedido_id))
      items_list = format_item(items)
      return JsonResponse({'status': 'success', 'items': items_list, 'pedido':pedido}, safe=False)
  return render(request,'load_items.html', context=context)


@login_required
def kitchenHome(request):
  username = request.user
  lista_estado = EstadoPedido.objects.all()
  context={
    'user': username,
    'title': 'Cocina',
    'lista_estado': lista_estado
  }
  user = User.objects.get(username=username)
  if user.has_perm("auth.cocina"):
   
    estado =  EstadoPedido.objects.exclude(nombre="LISTO")  
    context["pedidos"]= Pedido.objects.filter(estado__in=estado,es_confirmada=True)  
    return render(request,'kitchen_home.html', context=context)
  else:
   render(request,'403.html')


@login_required
def cashHome(request):
  username = request.user
  context={
    'user': username,
    'title': 'Caja',
  }
  user = User.objects.get(username=username)
  if user.has_perm("auth.caja"):
    estado =  EstadoPedido.objects.all()
    context["pedidos"]= Pedido.objects.filter(estado__in=estado,es_confirmada=True, pagado=False)
    return render(request,'cash_home.html', context=context)
  else:
   return render(request,'403.html')

  
def guardarDetalles(request):
  user = request.user
  if request.method == 'POST':
    cedula = request.POST.get('cedula', '').strip('"')
    nombre = request.POST.get('nombre', '').strip('"')
    total = request.POST.get('total', '').strip('"')
    detalles = request.POST.get('details', '').strip('"')
    pedido = request.POST.get('pedido', '').strip('"')
    pedido_cargado = Pedido.objects.get(id=pedido)
    pedido_cargado.cedula = cedula
    pedido_cargado.nombre = nombre
    pedido_cargado.total_pedido = float(total)
    pedido_cargado.save()
    nuevosDatos = json.loads(detalles)# datos enviados
    detalles = DetallePedido.objects.filter(pedido__id=pedido)
    lista = get_object_format(detalles)
    conversion = get_data_to_update(nuevosDatos, lista)
    # Actualizamos los modificados
    actualizados = conversion['updated']
    item_ids = [dato["id"] for dato in actualizados['values']]
    order_items = DetallePedido.objects.filter(pedido_id=pedido, item_id__in=item_ids)
    for item in order_items:
      item.cantidad = actualizados['dict'][item.item.id]['cantidad']
      item.comentario = actualizados['dict'][item.item.id]['comentario']
    DetallePedido.objects.bulk_update(order_items, ["cantidad", "comentario"])
    #Eliminamos los removidos
    order_items = DetallePedido.objects.filter(pedido_id=pedido, item_id__in=conversion['deleted']['ids']).delete()
    #Agregamos los nuevos
    nuevos_objetos = []
    # Creamos nuevos objetos OrderItem para la base de datos
    for dato in conversion['added']['values']:
        nuevos_objetos.append(DetallePedido(
            pedido_id=pedido,
            item_id=dato["id"],
            cantidad=dato["cantidad"],
            comentario=dato["comentario"]
        ))
  # Guardamos los nuevos objetos de forma masiva
    if nuevos_objetos:
      DetallePedido.objects.bulk_create(nuevos_objetos)
    order_items = DetallePedido.objects.filter(pedido_id=pedido)
    total_items = len(order_items)
    if total_items ==0:
      pedido_cargado.es_confirmada=False
    else:
      pedido_cargado.es_confirmada=True
    pedido_cargado.save()
    return JsonResponse({'status': 'success', 'confirmada' : pedido_cargado.es_confirmada} )
    


@login_required
def getDetails(request, id):
  user = request.user
  pedido = Pedido.objects.get(id=id)
  items = DetallePedido.objects.filter(pedido_id=int(id)).values("id","item","item__nombre","cantidad","comentario","pedido","pedido__mesa__numero","item__precio")
  items_list = list(items)
  print(items_list)
  #datos = serialize('json', items)
  #datos = json.loads(datos)
  return JsonResponse({'status': 'success','items':items_list,"mesa":pedido.mesa.numero}, safe=False)
          

@login_required
def actualizarEstado(request, pedidoId,estadoId):
  user = request.user
  pedido = Pedido.objects.get(id=pedidoId)
  estado = EstadoPedido.objects.get(id=estadoId)
  pedido.estado = estado
  pedido.save()
  print(pedido, estado)
  return JsonResponse({'status': 'success'}, safe=False)



def getData(request):

  nuevosDatos = [
    {"id": 1, "cantidad": 9, 'comentario': 'mi mama me ama'}, # Cambió la cantidad
    {"id": 2, "cantidad": 7, 'comentario': 'si funciona'}, # Cambió la cantidad
    #{"id": 3, "cantidad": 19, 'comentario': 'Se cambió'}, # Cambió la cantidad
    {"id": 6, "cantidad": 7, 'comentario': 'que este fresco'}, # Cambió la cantidad
  ]
  '''
  pedido = 7
  detalles = DetallePedido.objects.filter(pedido__id=pedido)
  lista = get_object_format(detalles)
  conversion = get_data_to_update(nuevosDatos, lista)
  # Actualizamos los modificados
  actualizados = conversion['updated']
  item_ids = [dato["id"] for dato in actualizados['values']]
  order_items = DetallePedido.objects.filter(pedido_id=pedido, item_id__in=item_ids)
  for item in order_items:
    item.cantidad = actualizados['dict'][item.item.id]['cantidad']
    item.comentario = actualizados['dict'][item.item.id]['comentario']
  DetallePedido.objects.bulk_update(order_items, ["cantidad", "comentario"])
  #Eliminamos los removidos
  order_items = DetallePedido.objects.filter(pedido_id=pedido, item_id__in=conversion['deleted']['ids']).delete()
  #Agregamos los nuevos
  nuevos_objetos = []
  # Creamos nuevos objetos OrderItem para la base de datos
  for dato in conversion['added']['values']:
      nuevos_objetos.append(DetallePedido(
          pedido_id=pedido,
          item_id=dato["id"],
          cantidad=dato["cantidad"],
          comentario=dato["comentario"]
      ))
# Guardamos los nuevos objetos de forma masiva
  if nuevos_objetos:
    DetallePedido.objects.bulk_create(nuevos_objetos)'''
  return render(request,'403.html')
  
@login_required
def cobrar(request) : 
  pedido_id = request.POST.get('pedido_id', '').strip('"')
  pedido = Pedido.objects.get(id = pedido_id)
  pedido.pagado = True 
  pedido.save()
  mesa = Mesa.objects.get( id = pedido.mesa.id)
  mesa.ocupada = False
  mesa.save()
  return JsonResponse({'status': 'success'}, safe=False)

@login_required
def obtenerPedido(request, id) : 
  pedido = Pedido.objects.get(id = id)
  pedido = {
    'id' : pedido.id,
    'mesa' : pedido.mesa.numero,
    'fecha' : pedido.fecha,
    'estado' : pedido.estado.nombre
  }
  return JsonResponse({'status': 'success', 'pedido' : pedido}, safe=False)
  
