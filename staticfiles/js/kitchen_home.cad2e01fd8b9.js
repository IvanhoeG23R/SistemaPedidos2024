let body = document.querySelector("body")
let modal = document.querySelector("#detalle_modal")
let modalEstado = document.querySelector("#modal_estado")
let detalle = document.querySelector("#detalle")
let numeroMesa = document.querySelector("#numero_mesa")
let cerrar = document.querySelector("#cerrar")
let cerrarEstado = document.querySelector("#cerrar_estado")
let cambiarEstado = document.querySelector("#cambiar_estado")
let listaEstados = document.querySelector("#lista_estados")
const btnBack = document.querySelector('#btn-back')
const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const socket = new WebSocket(wsScheme + window.location.host + '/ws/orders/');
socket.onclose = function(e) {
console.error('WebSocket cerrado:', e);
};

socket.onerror = function(e) {
  console.error('Error en WebSocket:', e);
};

socket.onmessage = function(e) {
  const data = JSON.parse(e.data);
  const orderNumber = data.order_number;
  if (orderNumber && data.confirmada == false){
    document.getElementById('tr-' + orderNumber).remove()
  }
  if (orderNumber && data.confirmada == true){

    cargarPedido(orderNumber)


  }
};

function dibujarFila(pedido){
  let tbody = document.getElementById('tbody')
  let filas = tbody.querySelectorAll('tr')
  let indice = 0
  if (filas.length === 0) {
    indice = 1
  } else {
    let fila = filas [filas.length -1]
    let tds = fila.querySelectorAll('td')
    indice = tds[0].text 
  }
  let tr = `
    <tr id = 'tr-${pedido.id}'>
            <td>${indice}</td>
            <td>${pedido.mesa}</td>
            <td>${pedido.id}</td>
            <td>${pedido.estado}</td>
            <td>${pedido.fecha}</td>
            <td>
              <div>
                <div class="btn-table detalle" pedido="${pedido.id}">
                  <i class="fa-solid fa-eye detalle" pedido="${pedido.id}"></i>
                </div>
                <div class="btn-table editar" pedido="${pedido.id}">
                  <i class="fa-solid fa-pen-to-square editar" pedido="${pedido.id}"></i>
                </div>
              </div>
            </td>
          </tr>

    `
  tbody.innerHTML += tr

}

function cargarPedido(pedidoId) {
  fetch(`/kitchen/pedido/${pedidoId}/`, {
    method: 'GET',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        console.log(data.pedido)
        dibujarFila(data.pedido)
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error fetching items:', error));
}

body.onclick = (e) => {
  let element = e.target
  if (element.classList.contains("detalle")) {
    modal.classList.remove("ocultar")
    let pedidoId = element.getAttribute("pedido")
    loadItems(pedidoId)
  }
  if (element.classList.contains("editar")) {
    modalEstado.classList.remove("ocultar")
    let pedidoId = element.getAttribute("pedido")
    modalEstado.setAttribute("pedido",pedidoId)
  }
}

cambiarEstado.onclick = (e) => {
  let pedidoId = modalEstado.getAttribute("pedido")
  let estadoId = listaEstados.value
  let estado = listaEstados.options[listaEstados.selectedIndex]
  actualizarEstado(pedidoId,estadoId, estado)
  
}

cerrar.onclick = (e) => {
  modal.classList.add("ocultar")
}

cerrarEstado.onclick = (e) => {
  modalEstado.classList.add("ocultar")
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

function loadItems(pedidoId) {
  fetch(`/kitchen/get-details/${pedidoId}/`, {
    method: 'GET',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        mostrarItems(data)
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error fetching items:', error));
}


function actualizarEstado(pedidoId,estadoId, estado) {
  fetch(`/pedidos/${pedidoId}/${estadoId}`, {
    method: 'PUT',
    headers: {
      'X-CSRFToken': getCSRFToken()
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
      socket.send(JSON.stringify({'order_number': pedidoId, 'estado' : estado.text}));
      window.location =""  
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error fetching items:', error));
}


function mostrarItems(data) {
  detalle.innerHTML = ""
  numeroMesa.innerHTML = "MESA: " + data.mesa
  data.items.forEach((item, i) => {
    let tr = document.createElement("tr")
    let tds = `
        <td>${i + 1}</td>
        <td>${item.item__nombre}</td>
        <td>${item.cantidad}</td>
        <td>${item.comentario}</td>
        `
    tr.innerHTML = tds

    detalle.appendChild(tr)
  });
}