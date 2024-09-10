def get_object_format(detalles):
  in_db = []
  for detalle in detalles:
    in_db.append({
      'id': detalle.item.id,
      'cantidad': detalle.cantidad,
      'comentario': detalle.comentario
    })
  return in_db

def get_data_to_update(news, olds):
  # Convertimos ambos arreglos en diccionarios usando 'id' como clave
  dict1 = {item["id"]: item for item in news}
  dict2 = {item["id"]: item for item in olds}

  added = {k: v for k, v in dict1.items() if k not in dict2}
  deleted = {k: v for k, v in dict2.items() if k not in dict1}
  updated = {
      k: dict1[k] 
      for k in dict1 
      if k in dict2 and dict1[k] != dict2[k]
  }
  
  return {
    'deleted': {
      'ids': deleted.keys(),
      'values': deleted.values(),
      'dict': deleted
    },
    'added':{
      'ids': added.keys(),
      'values': added.values(),
      'dict': added
    },
    'updated': {
       'ids': updated.keys(),
       'values': updated.values(),
       'dict': updated
    }
  }   

def format_item(detalles):
  items = []
  for detalle in detalles:
    items.append({
      'id': detalle.item.id,
      'cantidad': detalle.cantidad,
      'nombre': detalle.item.nombre,
      'descripcion': detalle.item.descripcion,
      'precio': float(detalle.item.precio),
      'comentario': detalle.comentario
    })
  return items
