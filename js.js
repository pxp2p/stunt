// Variable global para el carrito (ahora maneja objetos con propiedad 'cantidad')
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ==========================================
// NOTIFICACIÓN TEMPORAL (Toast de Éxito)
// ==========================================
// ==========================================================================
// FUNCIÓN PARA NOTIFICACIÓN TEMPORAL (Toast - CONECTADO CON TU CSS)
// ==========================================================================
function mostrarNotificacion(mensaje) {
  // 1. Creamos el contenedor del cartelito
  const notificacion = document.createElement("div");
  notificacion.textContent = mensaje;
  notificacion.classList.add("toast-notificacion");
  document.body.appendChild(notificacion);

  // 2. Le damos un milisegundo de respiro para que el navegador aplique el cambio
  setTimeout(() => {
    // Agrega la clase '.mostrar' de tu CSS definitivo para que suba fluidamente
    notificacion.classList.add("mostrar"); 
  }, 10);

  // 3. A los 2.5 segundos le quita la clase para que baje, y a los 3 segundos lo elimina por completo del HTML
  setTimeout(() => {
    notificacion.classList.remove("mostrar");
    setTimeout(() => notificacion.remove(), 350); // Borrado físico definitivo
  }, 2500);
}

// ==========================================
// CONTROL DEL BOTÓN FLOTANTE FIJO
// ==========================================
function actualizarBotonFlotante() {
    let botonFlotante = document.getElementById("btn-flotante-carrito");

    // No mostrar el botón en fin.html para evitar bucles visuales
    if (window.location.pathname.includes("fin.html")) {
        if (botonFlotante) botonFlotante.remove();
        return;
    }

    if (carrito.length === 0) {
        if (botonFlotante) botonFlotante.remove();
        return;
    }

    if (!botonFlotante) {
        botonFlotante = document.createElement("button");
        botonFlotante.id = "btn-flotante-carrito";
        botonFlotante.onclick = () => { window.location.href = "fin.html"; };
        document.body.appendChild(botonFlotante);
    }

    // Sumamos las cantidades totales reales de ítems
    const totalItems = carrito.reduce((acumulador, item) => acumulador + item.cantidad, 0);

    botonFlotante.innerHTML = `
    Finalizar Compra 
    <span class="contador-burbuja">${totalItems}</span>
  `;
}

// ==========================================
// PANTALLA 1: CATÁLOGO GENERAL (prod.html)
// ==========================================
const seccionCatalogo = document.querySelector(".prod-list");

if (seccionCatalogo) {
    fetch("prod.json")
        .then(response => response.json())
        .then(productos => {
            productos.forEach(producto => {
                seccionCatalogo.innerHTML += `
          <article class="producto-card" onclick="window.location.href='prodcard.html?id=${producto.id}'">
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <h2>${producto.nombre}</h2>
            <p class="descripcion">${producto.descripcion}</p>
            <p><strong>$${producto.precio}</strong></p>
            <span class="btn-ver-mas">Ver Opciones</span>
          </article>
        `;
            });
            actualizarBotonFlotante();
        })
        .catch(error => console.error("Error al cargar el catálogo:", error));
}

// ==========================================
// PANTALLA 2: VISTA DE DETALLE (prodcard.html)
// ==========================================
const contenedorDetalle = document.getElementById("detalle-producto-container");

if (contenedorDetalle) {
    const urlParams = new URLSearchParams(window.location.search);
    const idProductoBuscado = urlParams.get("id");

    fetch("prod.json")
        .then(response => response.json())
        .then(productos => {
            const producto = productos.find(p => p.id === idProductoBuscado);

            if (!producto) {
                contenedorDetalle.innerHTML = "<h2>Producto no encontrado</h2>";
                return;
            }

            // Evitamos el 'undefined' tomando el primer color del array si existe
            const colorInicial = (producto.colores && producto.colores.length > 0) ? producto.colores[0] : "estándar";

            let botonesColoresHTML = "";
            if (producto.colores) {
                producto.colores.forEach((color, index) => {
  const claseActivo = index === 0 ? "activo" : "";
  // Reemplaza los espacios por guiones para las clases de CSS
  const claseColorLimpia = color.replace(" ", "-"); 
  
  botonesColoresHTML += `
    <span class="circulo-color color-${claseColorLimpia} ${claseActivo}" 
          data-color="${color}" 
          onclick="cambiarColorSeleccionado(this)">
    </span>
  `;
});
            }

            contenedorDetalle.innerHTML = `
        <article class="producto-card-detalle" id="card-${producto.id}">
          <img src="${producto.imagen}" alt="${producto.nombre}">
          <h2>${producto.nombre}</h2>
          <p class="descripcion">${producto.descripcion}</p>
          
          <div class="contenedor-selectores">
            ${botonesColoresHTML}
          </div>

          <p class="color-indicador">
            Color elegido: <span class="color-text color-text-${colorInicial}" id="txt-color">${colorInicial}</span>
          </p>
          
          <p class="precio-detalle"><strong>$${producto.precio}</strong></p>
          
          <button class="btn-comprar" 
                  onclick="agregarAlCarritoInteligente('${producto.id}', '${producto.nombre}', ${producto.precio})">
            Agregar al Carrito
          </button>
          
          <a href="prod.html" class="btn-volver">← Volver al catálogo</a>
        </article>
      `;
            actualizarBotonFlotante();
        })
        .catch(error => console.error("Error al cargar el producto:", error));
}

function cambiarColorSeleccionado(elementoClickado) {
    const contenedor = elementoClickado.parentElement;
    contenedor.querySelectorAll(".circulo-color").forEach(circulo => circulo.classList.remove("activo"));
    elementoClickado.classList.add("activo");

    const nuevoColor = elementoClickado.getAttribute("data-color");
    const spanTexto = document.getElementById("txt-color");
    spanTexto.textContent = nuevoColor;
    spanTexto.className = `color-text color-text-${nuevoColor}`;
}

// LÓGICA DE AGREGADO CON VERIFICACIÓN DE CANTIDADES
function agregarAlCarritoInteligente(productoId, nombre, precio) {
    const circuloActivo = document.querySelector(".circulo-color.activo");
    // Si no hay círculos de color activos, dejamos uno por defecto para prevenir fallos
    const colorElegido = circuloActivo ? circuloActivo.getAttribute("data-color") : "estándar";

    // Buscamos si ya existe el mismo artículo con el mismo color exacto en el carrito
    const productoExistente = carrito.find(item => item.id === productoId && item.color === colorElegido);

    if (productoExistente) {
        productoExistente.cantidad += 1; // Si ya estaba, sumamos uno a su cantidad
    } else {
        // Si es nuevo, lo creamos con cantidad inicial en 1
        carrito.push({ id: productoId, nombre: nombre, color: colorElegido, precio: precio, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarNotificacion(`¡${nombre} (${colorElegido}) sumado al carrito!`);
    actualizarBotonFlotante();
}

// ==========================================
// PANTALLA 3: FORMULARIO Y CHECKOUT (fin.html)
// ==========================================
const resumenDiv = document.getElementById("resumen-pedido");
const formulario = document.getElementById("formulario-pedido");

// Renderiza la lista prolija con selectores de cantidad y tachito
function renderizarResumenCheckout() {
    if (!resumenDiv) return;

    if (carrito.length === 0) {
        resumenDiv.innerHTML = "<p class='carrito-vacio-txt'>Tu carrito está vacío. ¡Volvé al catálogo a buscar tus cubre rayos!</p>";
        return;
    }

    let total = 0;
    let HTMLResumen = "<div class='lista-checkout-premium'>";

    carrito.forEach((item, index) => {
        const subtotalItem = item.precio * item.cantidad;
        total += subtotalItem;

  // Aseguramos que el color vaya siempre en minúsculas para el CSS
const colorMinuscula = item.color.toLowerCase().replace(" ", "-");

HTMLResumen += `
  <div class="item-checkout-card">
    <button type="button" class="btn-eliminar-item" onclick="eliminarItemDelCarrito(${index})">🗑️</button>
    
    <div class="item-info">
      <span class="item-titulo">${item.nombre}</span>
      <!-- CAMBIO AQUÍ: Usamos colorMinuscula para la clase -->
      <span class="item-tag-color color-text-${colorMinuscula}">${item.color}</span>
    </div>
    
    <div class="item-controles-precio">
      <div class="item-controles">
        <button type="button" class="btn-cant" onclick="modificarCantidadItem(${index}, -1)">-</button>
        <span class="item-cantidad-num">${item.cantidad}</span>
        <button type="button" class="btn-cant" onclick="modificarCantidadItem(${index}, 1)">+</button>
      </div>
      
      <div class="item-precio-bloque">
        <span class="item-subtotal">$${subtotalItem}</span>
      </div>
    </div>
  </div>
`;



    });

    HTMLResumen += `</div><p class="total-pago">Total a pagar: <strong>$${total}</strong></p>`;
    resumenDiv.innerHTML = HTMLResumen;
}

// Sumar o restar desde los botones + y -
window.modificarCantidadItem = function (index, cambio) {
    carrito[index].cantidad += cambio;

    // Si la cantidad llega a cero, borramos el ítem directamente
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderizarResumenCheckout();
};

// Eliminar un ítem completo tocando el tachito de basura
window.eliminarItemDelCarrito = function (index) {
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderizarResumenCheckout();
};

if (resumenDiv && formulario) {
    renderizarResumenCheckout();

    formulario.addEventListener("submit", (e) => {
        e.preventDefault();

        if (carrito.length === 0) {
            mostrarNotificacion("No tenés productos en el carrito.");
            return;
        }

        const nombreCliente = document.getElementById("nombre-cliente").value;
        const direccionCliente = document.getElementById("direccion-cliente").value;

        const numeroTelefono = "1128884710"; // Tu número acá

        // MENSAJE DE WHATSAPP ULTRA COMPACTO CON CANTIDADES AGRUPADAS
        let mensaje = `Hola! *Quiero esto* para mi:\n\n`;
        mensaje += `👤 *Cliente:* ${nombreCliente}\n`;
        mensaje += `📍 *Dirección:* ${direccionCliente}\n\n`;
        mensaje += `🛒 *Detalle de mi pedido:*\n`;

        let total = 0;
        carrito.forEach((item) => {
            const subtotal = item.precio * item.cantidad;
            mensaje += `- *x${item.cantidad}* ${item.nombre} (Color: ${item.color.toUpperCase()}) -> $${subtotal}\n`;
            total += subtotal;
        });

        mensaje += `\n💰 *Total Neto:* $${total}`;

        localStorage.removeItem("carrito");
        window.location.href = `https://wa.me/54${numeroTelefono}?text=${encodeURIComponent(mensaje)}`;
    });
}
// ==========================================================================
// SECCIÓN EXTRA: MINIATURAS DESTACADAS EN LA HOME
// ==========================================================================
const contenedorMiniaturas = document.getElementById("grid-miniaturas-destacadas");

if (contenedorMiniaturas) {
  fetch("prod.json")
    .then(response => response.json())
    .then(productos => {
      // Recorremos los productos y creamos una grilla compacta de fotos
     productos.forEach(producto => {
  contenedorMiniaturas.innerHTML += `
    <div class="miniatura-item-home" onclick="window.location.href='prodcard.html?id=${producto.id}'">
      <img src="${producto.imagen}" alt="${producto.nombre}">
     
    </div>
  `;
});

    })
    .catch(error => console.error("Error al cargar las miniaturas:", error));
}
