const body = document.querySelector('body')
const tbody = document.querySelector('tbody')
const cantidadTotal = document.querySelector('#total')
const itemsContainer = document.querySelector('#items')
let modalEstado = document.querySelector("#modal_estado")
let cerrarEstado = document.querySelector("#cerrar_estado")
const guardarDetalle = document.querySelector('#guardar_detalle')
const comentario = document.querySelector('#comentario')
const guardarComentario = document.querySelector('#guardar_comentario')
const cedula = document.querySelector('#cedula')
const nombre = document.querySelector('#nombre')
cantidadTotal.innerHTML = "$" + "0.00"
let totalEnviar = 0
let loadedItems = []
let details = []
let path = window.location.pathname.split('/')
const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const socket = new WebSocket(wsScheme + window.location.host + '/ws/orders/');
socket.onclose = function (e) {
    console.error('WebSocket cerrado:', e);
};

socket.onerror = function (e) {
    console.error('Error en WebSocket:', e);
};

socket.onmessage = function(e) {
  const data = JSON.parse(e.data);
  const orderNumber = data.order_number;
  if (orderNumber){
    window.location.href = '../../'
  }
};

// Eliminamos la ultima posición del path  
path.pop()
// Guardamos el id de la orden a la que vamos a añadirle los items
let order_number = path[path.length - 1]

cargarDetalles(order_number)

guardarDetalle.onclick = (e) => {
  editarDetalle()
}

cerrarEstado.onclick = (e) => {
  modalEstado.classList.add("ocultar")
}
guardarComentario.onclick = (e) => {
  const id = parseInt(e.target.getAttribute('item'))
  details.map(item => {
    if (item.id === id) {
      item.comentario = comentario.value
    }
  })

  cerrarEstado.onclick()
}

body.onclick = (e) => {
  e.preventDefault()
  element = e.target
  categoryId = element.getAttribute('category')
  if (categoryId) {
    loadItems(categoryId)
  }

  if (e.target.classList.contains('comentar')) {
    modalEstado.classList.remove("ocultar")
    const id = parseInt(element.getAttribute('item'))
    guardarComentario.setAttribute("item", id)
    let filtered = details.filter(item => item.id === id)
    comentario.value = filtered[0].comentario
  }


  if (e.target.classList.contains('item')) {
    const id = parseInt(element.getAttribute('item'))
    let filtered = loadedItems.filter(item => item.id === id)
    if (details.filter(item => item.id === id).length === 0) {
      filtered[0].cantidad = 1
      filtered[0].pedido = parseInt(order_number)
      details.push(filtered[0])
    } else {
      details.map(item => {
        if (item.id === id) {
          item.cantidad++
        }
      })
    }

    renderizeDetails()
  }
  if (e.target.classList.contains('restar')) {
    const id = parseInt(element.getAttribute('item'))
    disminuir(id)
    renderizeDetails()
  }

  if (e.target.classList.contains('aumentar')) {
    const id = parseInt(element.getAttribute('item'))
    aumentar(id)
    renderizeDetails()
  }

  if (e.target.classList.contains('eliminar')) {
    const id = parseInt(element.getAttribute('item'))
    eliminar(id)
    renderizeDetails()
  }
}

function renderizeDetails() {
  tbody.innerHTML = ''
  details.forEach((item, i) => {
    tbody.innerHTML += `
    <tr>
     <td>${i + 1}</td>
     <td>${item.nombre}</td>
     <td>$${item.precio}</td>
     <td>${item.cantidad}</td>
     <td>
      <div class>
        <button class="btn-td restar" item="${item.id}">-</button>
        <button class="btn-td aumentar" item="${item.id}">+</button>
        <button class="btn-td eliminar" item="${item.id}">x</button>
        <button class="btn-td comentar" item="${item.id}"><i class="fa-solid fa-file comentar" item="${item.id}"></i></button>
      </div>
     </td>
    </tr>
    `
  })
  obtenerTotal()
}

function getCSRFToken() {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, 10) === 'csrftoken=') {
        cookieValue = decodeURIComponent(cookie.substring(10));
        break;
      }
    }
  }
  return cookieValue;
}

function loadItems(categoryId) {
  const formData = new FormData()
  formData.append('category_id', JSON.stringify(categoryId))
  fetch(`/waiter/new-order/${order_number}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        let items = data.items.map((item) => {
          item.comentario = ""
          return item
        })
        displayItems(items);
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error fetching items:', error));
}


function cargarDetalles(pedidoId) {
  const formData = new FormData()
  formData.append('pedido_id', JSON.stringify(pedidoId))
  fetch(`/waiter/new-order/${order_number}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        nombre.value = data.pedido.nombre
        cedula.value = data.pedido.cedula
        details = data.items
        renderizeDetails()
      } 
      if (data.status === 'not_exist'){
        window.location.href = '../../'

      }
      
    })
    .catch(error => console.error('Error fetching items:', error));
}

function displayItems(items) {
  loadedItems = items
  itemsContainer.innerHTML = ""
  items.forEach(item => {
    itemsContainer.innerHTML += `
      <div class="item" item="${item.id}">
        ${item.nombre}
      </div>
    `
  })

}

function disminuir(id) {
  details.map(item => {
    if (item.id === id) {
      if (item.cantidad > 1) {
        item.cantidad--
      }

    }
  })
}

function aumentar(id) {
  details.map(item => {
    if (item.id === id) {
      item.cantidad++
    }
  })
}

function eliminar(id) {
  let filter = details.filter(item => item.id !== id)
  details = filter
}

function obtenerTotal() {
  let total = 0
  details.forEach(item => {
    total += parseFloat(item.precio) * item.cantidad
  })
  totalEnviar = total
  cantidadTotal.innerHTML = ""
  cantidadTotal.innerHTML = "$" + total.toFixed(2)
}

function validarDatos(){
  if(cedula.value === ""){
    alert("debe llenar cedula")
    return false
  }
  if(nombre.value === ""){
    alert("debe llenar el nombre")
    return false
  }
  return true
}

function editarDetalle() {  
  if(!validarDatos()){
    return
  }
  let copia = details.map((item) => {
    delete item.nombre
    delete item.descripcion
    delete item.precio
    return item
  })
  const formData = new FormData()
  formData.append('details', JSON.stringify(copia))
  formData.append('pedido', JSON.stringify(order_number))
  formData.append('cedula', JSON.stringify(cedula.value))
  formData.append('nombre', JSON.stringify(nombre.value))
  formData.append('total', JSON.stringify(totalEnviar))
  fetch(`/waiter/save-details`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        socket.send(JSON.stringify({'order_number': order_number, 'confirmada' : data.confirmada}));
        window.location = "/waiter"

      }
    })
    .catch(error => console.error('Error fetching items:', error));
}