// funciones/producto-detalle.js

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

// leer ?id= de la URL
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProductDetail() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const id = getProductIdFromUrl();
  if (!id) {
    container.innerHTML = "<p>Producto no encontrado.</p>";
    return;
  }

  container.innerHTML = "<p>Cargando producto...</p>";

  try {
    const product = await API.apiFetch(`/products/${id}`);

    const ofertaBadge = product.isOffer
      ? '<span class="badge badge-offer">Oferta</span>'
      : "";

    const disponible = product.available
      ? `<span class="badge-availability available">Disponible</span>`
      : `<span class="badge-availability soldout">Agotado</span>`;

    // 🔹 pintamos el detalle (SIN disabled en el botón, lo controlamos por JS)
    container.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-detail-image">
          <img src="${product.imageUrl}" alt="${product.name}">
          ${ofertaBadge}
        </div>
        <div class="product-detail-info">
          <h2>${product.name}</h2>
          <p class="product-detail-category">${product.category}</p>
          <p class="product-detail-price">
            <span class="current-price">${formatCurrency(product.price)}</span>
            ${
              product.oldPrice && product.oldPrice > product.price
                ? `<span class="old-price">${formatCurrency(
                    product.oldPrice
                  )}</span>`
                : ""
            }
          </p>
          <p class="product-detail-stock">${disponible}</p>
          <p class="product-detail-description">
            ${product.description || "Sin descripción."}
          </p>

          <button id="btn-detail-add" class="btn-primary-detail">
            Agregar al carrito
          </button>
          <div class="product-detail-back">
            <a href="productos.html" class="btn-link">← Volver a productos</a>
          </div>
        </div>
      </div>
    `;

    // 🔹 Lógica de habilitar / deshabilitar botón según:
    //    - disponibilidad
    //    - rol del usuario (admin no puede comprar)
    const btnAdd = document.getElementById("btn-detail-add");
    if (!btnAdd) return;

    const user = window.Auth ? Auth.getCurrentUser() : null;
    const isAdmin = user && user.role === "admin";

    if (!product.available) {
      // sin existencias
      btnAdd.disabled = true;
      btnAdd.textContent = "Sin existencias";
    } else if (isAdmin) {
      // admin logueado: no puede comprar
      btnAdd.disabled = true;
      btnAdd.textContent = "Solo clientes pueden comprar";
    } else {
      // cliente normal: puede agregar al carrito
      btnAdd.disabled = false;
      btnAdd.textContent = "Agregar al carrito";
      btnAdd.addEventListener("click", () =>
        handleAddToCartDetail(product.id)
      );
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error al cargar el producto: ${err.message}</p>`;
  }
}

async function handleAddToCartDetail(productId) {
  try {
    const data = await API.apiFetch("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    // actualizar badge del carrito
    const badge = document.getElementById("cart-count");
    if (badge) {
      const total =
        typeof data.totalProductos !== "undefined"
          ? data.totalProductos
          : (data.items || []).reduce(
              (acc, it) => acc + Number(it.cantidad || 0),
              0
            );
      badge.textContent = total;
    }

    if (window.Swal) {
      Swal.fire("Listo", "Producto agregado al carrito", "success");
    } else {
      alert("Producto agregado al carrito");
    }
  } catch (err) {
    console.error(err);
    const msg = err.message || "Error al agregar al carrito";
    if (
      msg.toLowerCase().includes("token") ||
      msg.toLowerCase().includes("login")
    ) {
      Swal.fire(
        "Inicia sesión",
        "Debes iniciar sesión para agregar productos al carrito.",
        "info"
      ).then(() => {
        window.location.href = "login.html";
      });
    } else {
      Swal.fire("Error", msg, "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // mostrar nombre de usuario / logout en header
  if (window.Auth && Auth.updateHeaderUser) {
    Auth.updateHeaderUser();
  }
  loadProductDetail();
});
