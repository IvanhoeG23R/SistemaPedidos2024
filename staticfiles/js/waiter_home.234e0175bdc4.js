const body = document.querySelector('body')
const itemsContainer = document.querySelector('#items')
const tbody = document.querySelector('tbody')
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
  if (orderNumber && !data.estado && !data.eliminado){ 
    document.getElementById('tr-' + orderNumber).remove()
  }
  if (orderNumber && !data.estado && data.eliminado){ 
    document.getElementById('tr-' + orderNumber).remove()
  }
  if (data.estado){
    actualizarFila(orderNumber, data.estado)
  }
};

let loadedItems = []
let details = []

function actualizarFila(pedidoId, estado){
  let fila = document.getElementById('tr-' + pedidoId)
  let tdEstado = fila.querySelector('.estado')
  let tdButtons = fila.querySelector('.botones')
  tdEstado.innerHTML = estado
  if(estado === 'PENDIENTE'){
    tdButtons.innerHTML = `
     <div class="btn-table pedido" pedido="${pedidoId}">
      <i class="fa-solid fa-pen-to-square pedido" pedido="${pedidoId}"></i>
     </div>
     <div class="btn-table eliminar" pedido="${pedidoId}">
       <i class="fa-solid fa-trash eliminar" pedido="${pedidoId}"></i>
     </div>
    `

  } else {
    tdButtons.innerHTML = ''
  }
}

body.onclick = (e) => {
  element = e.target
  if(element.id === 'new-order') {
    window.location = '/waiter/new-order'
  }
  if(element.id === 'show-orders') {
    console.log('show orders')
  }

  if(element.classList.contains("pedido")){
    let pedidoId=element.getAttribute("pedido")
    window.location = '/waiter/new-order/'+pedidoId
  }
  if(element.classList.contains("eliminar")){
    let pedidoId=element.getAttribute("pedido")
    let confirmada=confirm("¿deseas eliminar este pedido?")
    if(confirmada){
      eliminarPedido(pedidoId)
    }
    
   // window.location = '/waiter/new-order/'+pedidoId
  }
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


function eliminarPedido(pedidoId) {
  const formData = new FormData()
  formData.append('pedido_id', JSON.stringify(pedidoId))
  fetch(`/waiter/delete-order/${pedidoId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken()
    },
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        socket.send(JSON.stringify({'order_number': pedidoId, 'eliminado' : true}));
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error fetching items:', error));
}