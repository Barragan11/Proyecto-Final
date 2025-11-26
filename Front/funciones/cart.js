// funciones/cart.js

const COUNTRY_CONFIG = {
  MX: { nombre: "México", tasaImpuesto: 0.16, envio: 250 },
  US: { nombre: "Estados Unidos", tasaImpuesto: 0.1, envio: 500 },
  ES: { nombre: "España", tasaImpuesto: 0.21, envio: 600 },
  OTRO: { nombre: "Otro", tasaImpuesto: 0.0, envio: 300 },
};

let cartState = {
  items: [],
  subtotal: 0,
  totalProductos: 0,
};

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function getSelectedCountryCode() {
  const sel = document.getElementById("cart-country");
  return sel ? sel.value : "MX";
}

function getCountryConfig(code) {
  return COUNTRY_CONFIG[code] || COUNTRY_CONFIG.OTRO;
}

function calculateTotalsFront() {
  const code = getSelectedCountryCode();
  const conf = getCountryConfig(code);
  const subtotal = cartState.subtotal;

  const impuestos = subtotal * conf.tasaImpuesto;
  const envio = conf.envio;

  const couponInput = document.getElementById("cart-coupon");
  const couponCode = couponInput ? couponInput.value.trim().toUpperCase() : "";
  let descuento = 0;

  if (couponCode === "ASTRO10") {
    descuento = subtotal * 0.1;
  }

  const total = subtotal + impuestos + envio - descuento;

  return { subtotal, impuestos, envio, descuento, total, pais: code };
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  badge.textContent = cartState.totalProductos || 0;
}

// 🔹 referencia aleatoria para OXXO
function generateOxxoReference() {
  const parte1 = Date.now().toString().slice(-8);
  const parte2 = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `OXXO-${parte1}-${parte2}`;
}

// Render de los totales
function renderTotals() {
  const totals = calculateTotalsFront();

  const subEl = document.getElementById("cart-subtotal");
  const impEl = document.getElementById("cart-tax");
  const envEl = document.getElementById("cart-shipping");
  const descEl = document.getElementById("cart-discount");
  const totEl = document.getElementById("cart-total");

  if (subEl) subEl.textContent = formatCurrency(totals.subtotal);
  if (impEl) impEl.textContent = formatCurrency(totals.impuestos);
  if (envEl) envEl.textContent = formatCurrency(totals.envio);
  if (descEl) descEl.textContent = formatCurrency(totals.descuento);
  if (totEl) totEl.textContent = formatCurrency(totals.total);
}

// Render general del carrito
function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  // 🔹 Carrito vacío con mensaje bonito
  if (!cartState.items.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h2>Tu carrito está vacío</h2>
        <p>Explora nuestros vehículos y agrega tus favoritos.</p>
        <a href="productos.html" class="btn-primary">Ver productos</a>
      </div>
    `;
    cartState.totalProductos = 0;
    updateCartBadge();
    return;
  }

  const rowsHtml = cartState.items
    .map(
      (item) => `
      <tr>
        <td>
          <div class="cart-product">
            <img src="${item.imagen_url}" alt="${item.nombre}">
            <span>${item.nombre}</span>
          </div>
        </td>
        <td>${formatCurrency(item.precio_unitario)}</td>
        <td>
          <input type="number" min="1" class="cart-qty-input" 
                 data-item-id="${item.id}" value="${item.cantidad}">
        </td>
        <td>${formatCurrency(item.precio_unitario * item.cantidad)}</td>
        <td>
          <button class="btn-link" data-remove-id="${item.id}">Eliminar</button>
        </td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-card">
        <h2>Productos</h2>
        <table class="cart-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="cart-actions">
          <button id="btn-clear-cart" class="btn-link">Vaciar carrito</button>
        </div>
      </div>

      <div class="cart-card">
        <h2>Resumen de compra</h2>

        <div class="form-field">
          <label for="cart-country">País</label>
          <select id="cart-country">
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
            <option value="ES">España</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div class="form-field">
          <label for="cart-coupon">Cupón de descuento</label>
          <input type="text" id="cart-coupon" placeholder="Ejemplo: ASTRO10">
        </div>

        <hr>

        <div class="cart-summary-row">
          <span>Subtotal</span>
          <span id="cart-subtotal"></span>
        </div>
        <div class="cart-summary-row">
          <span>Impuestos</span>
          <span id="cart-tax"></span>
        </div>
        <div class="cart-summary-row">
          <span>Envío</span>
          <span id="cart-shipping"></span>
        </div>
        <div class="cart-summary-row">
          <span>Descuento</span>
          <span id="cart-discount"></span>
        </div>
        <div class="cart-summary-total">
          Total: <span id="cart-total"></span>
        </div>

        <hr>

        <h2>Datos de envío</h2>

        <div class="form-field">
          <label for="ship-name">Nombre completo</label>
          <input type="text" id="ship-name">
        </div>
        <div class="form-field">
          <label for="ship-address">Dirección</label>
          <input type="text" id="ship-address">
        </div>
        <div class="form-field">
          <label for="ship-city">Ciudad</label>
          <input type="text" id="ship-city">
        </div>
        <div class="form-field">
          <label for="ship-zip">Código postal</label>
          <input type="text" id="ship-zip">
        </div>
        <div class="form-field">
          <label for="ship-phone">Teléfono</label>
          <input type="text" id="ship-phone">
        </div>

        <h2>Método de pago</h2>
        <div class="form-field">
          <select id="payment-method">
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="oxxo">OXXO</option>
          </select>
        </div>

        <div class="form-actions">
          <button id="btn-checkout">Finalizar compra</button>
        </div>
      </div>
    </div>
  `;

  // listeners después de pintar
  container.querySelectorAll(".cart-qty-input").forEach((input) => {
    input.addEventListener("change", onQuantityChange);
  });

  container.querySelectorAll("[data-remove-id]").forEach((btn) => {
    btn.addEventListener("click", onRemoveItem);
  });

  const clearBtn = document.getElementById("btn-clear-cart");
  if (clearBtn) {
    clearBtn.addEventListener("click", onClearCart);
  }

  const countrySelect = document.getElementById("cart-country");
  const couponInput = document.getElementById("cart-coupon");
  if (countrySelect) {
    countrySelect.addEventListener("change", renderTotals);
  }
  if (couponInput) {
    couponInput.addEventListener("input", renderTotals);
  }

  const checkoutBtn = document.getElementById("btn-checkout");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", onCheckout);
  }

  updateCartBadge();
  renderTotals();
}

// ==== Eventos ====

async function onQuantityChange(e) {
  const input = e.target;
  const itemId = input.dataset.itemId;
  const qty = Number(input.value);

  if (qty <= 0 || Number.isNaN(qty)) {
    Swal.fire("Cantidad inválida", "Usa un número mayor a cero", "warning");
    return;
  }

  try {
    const data = await API.apiFetch(`/cart/item/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: qty }),
    });
    cartState.items = data.items;
    cartState.subtotal = data.subtotal;
    cartState.totalProductos = data.totalProductos;
    renderCart();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

async function onRemoveItem(e) {
  const id = e.target.dataset.removeId;
  try {
    const data = await API.apiFetch(`/cart/item/${id}`, {
      method: "DELETE",
    });
    cartState.items = data.items;
    cartState.subtotal = data.subtotal;
    cartState.totalProductos = data.totalProductos;
    renderCart();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

async function onClearCart() {
  const result = await Swal.fire({
    title: "Vaciar carrito",
    text: "¿Seguro que quieres vaciar el carrito?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, vaciar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const data = await API.apiFetch("/cart/clear", {
      method: "DELETE",
    });
    cartState.items = data.items;
    cartState.subtotal = data.subtotal;
    cartState.totalProductos = data.totalProductos;
    renderCart();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

// 🔹 Simulación de pago (tarjeta / transferencia / OXXO)
async function simulatePaymentFlow(metodoPago, total) {
  let datosPago = {};

  if (metodoPago === "tarjeta") {
    const { value, isConfirmed } = await Swal.fire({
      title: "Pago con tarjeta",
      html: `
        <input id="card-holder" class="swal2-input" placeholder="Nombre del titular">
        <input id="card-number" class="swal2-input" placeholder="Número de tarjeta (ficticio)">
        <input id="card-exp" class="swal2-input" placeholder="MM/AA">
        <input id="card-cvv" class="swal2-input" placeholder="CVV">
        <p style="font-size:12px;opacity:.7;">
          ⚠️ Simulación de pago para proyecto académico. No uses datos reales.
        </p>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Pagar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const holder = document.getElementById("card-holder").value.trim();
        const number = document.getElementById("card-number").value.trim();
        const exp = document.getElementById("card-exp").value.trim();
        const cvv = document.getElementById("card-cvv").value.trim();

        if (!holder || !number || number.length < 12 || !exp || !cvv) {
          Swal.showValidationMessage("Completa todos los datos de la tarjeta (ficticia)");
          return false;
        }

        return { holder, number, exp, cvv };
      },
    });

    if (!isConfirmed || !value) return null;

    datosPago = {
      tipo: "tarjeta",
      titular: value.holder,
      ultimos4: value.number.slice(-4),
      estado: "aprobado",
      monto: total,
    };
  } else if (metodoPago === "transferencia") {
    const referencia = `TR-${Date.now().toString().slice(-8)}`;
    const { isConfirmed } = await Swal.fire({
      title: "Transferencia bancaria",
      html: `
        <p>Realiza una transferencia a la siguiente cuenta (simulada):</p>
        <p><strong>Banco:</strong> Banco Astro Motors</p>
        <p><strong>CLABE:</strong> 012345678901234567</p>
        <p><strong>Referencia:</strong> <code>${referencia}</code></p>
        <p style="font-size:12px;opacity:.7;">
          Después de realizar la transferencia, da clic en "Ya realicé la transferencia".
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Ya realicé la transferencia",
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return null;

    datosPago = {
      tipo: "transferencia",
      referencia,
      estado: "pendiente",
      monto: total,
    };
  } else if (metodoPago === "oxxo") {
    const refOxxo = generateOxxoReference();
    const { isConfirmed } = await Swal.fire({
      title: "Pago en OXXO",
      html: `
        <p>Acude a cualquier tienda OXXO y proporciona este código (simulado):</p>
        <h2 style="margin-top:10px;">${refOxxo}</h2>
        <p style="font-size:12px;opacity:.7;">
          Tu pedido quedará como <strong>pendiente de pago</strong> hasta que se confirme.
        </p>
      `,
      confirmButtonText: "Guardar referencia",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return null;

    datosPago = {
      tipo: "oxxo",
      referencia: refOxxo,
      estado: "pendiente",
      monto: total,
    };
  }

  return datosPago;
}

async function onCheckout() {
  const totals = calculateTotalsFront();

  const nombre = document.getElementById("ship-name").value.trim();
  const direccion = document.getElementById("ship-address").value.trim();
  const ciudad = document.getElementById("ship-city").value.trim();
  const cp = document.getElementById("ship-zip").value.trim();
  const tel = document.getElementById("ship-phone").value.trim();
  const metodoPago = document
    .getElementById("payment-method")
    .value.trim();
  const cupon = document.getElementById("cart-coupon").value.trim();

  if (!nombre || !direccion || !ciudad || !cp || !tel) {
    Swal.fire("Datos incompletos", "Llena todos los datos de envío.", "warning");
    return;
  }

  // 🔹 Simular el flujo de pago según el método
  const datosPago = await simulatePaymentFlow(metodoPago, totals.total);

  // Si el usuario canceló el flujo de pago
  if (!datosPago) {
    return;
  }

  try {
    const data = await API.apiFetch("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        pais: totals.pais,
        cupon,
        datosEnvio: {
          nombre,
          direccion,
          ciudad,
          codigoPostal: cp,
          telefono: tel,
        },
        metodoPago,
        datosPago, // 👈 se envía al back para usarlo en el recibo por correo
      }),
    });

    Swal.fire(
      "Compra finalizada",
      "Tu compra se registró correctamente. Se ha generado la nota de compra y se enviará un recibo a tu correo.",
      "success"
    ).then(() => {
      window.location.href = "productos.html";
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error en la compra", err.message, "error");
  }
}

// ==== Carga inicial ====

async function loadCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  try {
    const data = await API.apiFetch("/cart");
    cartState.items = data.items || [];
    cartState.subtotal = data.subtotal || 0;
    cartState.totalProductos = data.totalProductos || 0;
    renderCart();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error al cargar tu carrito: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cart-content");
  if (container) {
    loadCart();
  }
});
