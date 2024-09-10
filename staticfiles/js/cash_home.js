let body = document.querySelector("body")
let modal = document.querySelector(".detalle_modal")
let cobrar = document.querySelector(".cobrar")
let tbodyPrincipal = document.querySelector("#tbody_principal")
let tbodyModal = document.querySelector("#tbody_modal")
let numeroMesa = document.querySelector("#numero_mesa")
let cerrar = document.querySelector("#cerrar")
let buscar = document.querySelector("#buscar")
let total = document.querySelector("#total")
const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const socket = new WebSocket(wsScheme + window.location.host + '/ws/orders/');
socket.onclose = function (e) {
    console.error('WebSocket cerrado:', e);
};

socket.onerror = function (e) {
    console.error('Error en WebSocket:', e);
};

body.onclick = (e) => {
    let element = e.target
    if (element.classList.contains("detalle")) {
        modal.classList.remove("ocultar")
        let pedidoId = element.getAttribute("pedido")
        modal.setAttribute('pedido', pedidoId)
        cargarDetalle(pedidoId)
    }
    if (element.classList.contains("cobrar")) {
        let pedidoId = modal.getAttribute("pedido")
        cobrarPedido(pedidoId)
    }
    if (element.classList.contains("btn_buscar")) {
        let busqueda = buscar.value
        console.log(busqueda);

        buscarPedido(busqueda)
    }
} 
cerrar.onclick = (e) => {
    modal.classList.add("ocultar")
    cobrar.classList.add("ocultar")

}

function buscarPedido(cedula) {
    let formData = new FormData()
    formData.append("cedula", JSON.stringify(cedula))
    fetch(`/cash/search/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    }).then(response => response.json()).then(data => {
        if (data.status === 'success') {
            console.log(data);
            mostrarItems(data)

        } else {
            console.error(data.message);
        }
    }).catch(error => console.error('Error fetching items:', error));
}
function cobrarPedido(pedidoId) {
    let formData = new FormData()
    formData.append("pedido_id", JSON.stringify(pedidoId))
    fetch(`/cash/pay/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    }).then(response => response.json()).then(data => {
        if (data.status === 'success') {
            socket.send(JSON.stringify({'order_number': pedidoId}));
            let fila = document.getElementById('tr-' + pedidoId)
            modal.classList.add('ocultar')
            fila.remove()

             
        } else {
            console.error(data.message);
        }
    }).catch(error => console.error('Error fetching items:', error));
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
    }).then(response => response.json()).then(data => {
        if (data.status === 'success') {
            mostrarItems(data)
        } else {
            console.error(data.message);
        }
    }).catch(error => console.error('Error fetching items:', error));
}


function cargarDetalle(pedidoId) {
    let formData = new FormData()
    formData.append("pedido_id", JSON.stringify(pedidoId))
    fetch(`../waiter/new-order/${pedidoId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    }).then(response => response.json()).then(data => {
        if (data.status === 'success') {
            mostrarDetalle(data)
        } else {
            console.error(data.message);
        }
    }).catch(error => console.error('Error fetching items:', error));
}

function mostrarItems(data) {
    tbodyPrincipal.innerHTML = ""
    data.pedido.forEach((item, i) => {
        let tr = document.createElement("tr")
        let tds = `
     <tr>
            <td>${
            i + 1
        }</td>
            <td>${
            item.nombre
        }</td>
            <td>${
            item.mesa
        }</td>
            <td>${
            item.total
        }</td>
            <td>${
            item.fecha
        }</td>
            <td>
              <div>
                <div class="btn-table detalle" pedido="{{pedido.id}}">
                  <i class="fa-solid fa-eye detalle" pedido="{{pedido.id}}"></i>
                </div>
                <div class="btn-table">
                  <i class="fa-solid fa-pen-to-square"></i>
                </div>
              </div>
            </td>
          </tr>
        `
        tr.innerHTML = tds

        tbodyPrincipal.appendChild(tr)
    });
}


function mostrarDetalle(data) {
    total.innerHTML = ""
    tbodyModal.innerHTML = ""
    data.items.forEach((item, i) => {
        let tr = document.createElement("tr")
        let tds = `
     <tr>
        <td>${
            i + 1
        }</td>
        <td>${
            item.nombre
        }</td>
        <td>${
            item.cantidad
        }</td>
        <td>${
            item.precio.toFixed(2)
        }</td>
        <td>${
            (item.cantidad * item.precio).toFixed(2)
        }</td>
      </tr>
        `
        tr.innerHTML = tds
        total.innerHTML = `
      <span><strong>TOTAL: </strong></span>
      <span>${
            data.pedido.total
        }</span>
    `
        tbodyModal.appendChild(tr)
        if (data.pedido.estado === "LISTO") {
            cobrar.classList.remove("ocultar")
        }
    });
}
