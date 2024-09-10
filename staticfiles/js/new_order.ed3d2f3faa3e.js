const body = document.querySelector('body')
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
  console.log(data)
  const orderNumber = data.order_number;
  if (orderNumber){
    location.reload()
  }
  if (orderNumber && data.eliminado){
    location.reload()
  }
};

body.onclick = (e) => {
  element = e.target

  if(element.classList.contains('number-table')) {
    let ocupada=element.getAttribute("ocupada")
    console.log(ocupada)
    if (ocupada==="false"){
     const mesaId = element.getAttribute('table')
     generarOrden(mesaId)
    }else{
      alert("mesa esta ocupada")
    }
    
  }
}

btnBack.onclick = (e) =>{ 
  window.location = '/waiter'
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

function generarOrden(mesaId) {
  const formData = new FormData()
  formData.append('mesa_id', JSON.stringify(mesaId))
  fetch(`/waiter/new-order`, {
    method: 'POST',
    headers: {
        'X-CSRFToken': getCSRFToken()
    },
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
       window.location = `/waiter/new-order/${data.detalle_id}/`
        
    } else {
        console.error(data.message);
    }
  })
  .catch(error => console.error('Error fetching items:', error));  
}
