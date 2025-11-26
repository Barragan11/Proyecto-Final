// funciones/products.js

let allProducts = [];

// 🔹 Formatear precio a moneda MXN
function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

// 🔹 Ir a la página de detalle de producto
function openProductDetail(productId) {
  // producto-detalle.html debe existir en el FRONT
  window.location.href = `producto-detalle.html?id=${productId}`;
}

// 🔹 Construir tarjeta de producto
function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.id = product.id;

  // --- Imagen ---
  const imgWrapper = document.createElement("div");
  imgWrapper.className = "product-image-wrapper";

  const img = document.createElement("img");
  img.src = product.imageUrl;
  img.alt = product.name;
  imgWrapper.appendChild(img);

  // clic en la imagen abre detalle
  imgWrapper.addEventListener("click", () => openProductDetail(product.id));

  // badge Oferta
  if (product.isOffer) {
    const badgeOffer = document.createElement("span");
    badgeOffer.className = "badge badge-offer";
    badgeOffer.textContent = "Oferta";
    imgWrapper.appendChild(badgeOffer);
  }

  // badge Agotado
  if (!product.available) {
    const badgeSoldout = document.createElement("span");
    badgeSoldout.className = "badge badge-soldout";
    badgeSoldout.textContent = "Agotado";
    imgWrapper.appendChild(badgeSoldout);
  }

  // --- Info ---
  const info = document.createElement("div");
  info.className = "product-info";

  const title = document.createElement("h3");
  title.textContent = product.name;
  title.classList.add("product-title-clickable");
  // clic en el título también abre detalle
  title.addEventListener("click", () => openProductDetail(product.id));

  const priceP = document.createElement("p");
  priceP.className = "product-price";

  const current = document.createElement("span");
  current.className = "current-price";
  current.textContent = formatCurrency(product.price);
  priceP.appendChild(current);

  if (product.oldPrice && product.oldPrice > product.price) {
    const old = document.createElement("span");
    old.className = "old-price";
    old.textContent = formatCurrency(product.oldPrice);
    priceP.appendChild(old);
  }

  // --- Botón agregar al carrito ---
  const btn = document.createElement("button");
  btn.className = "btn-add-cart";

  // Detectar si el usuario actual es admin
  const user =
    window.Auth && typeof Auth.getCurrentUser === "function"
      ? Auth.getCurrentUser()
      : null;
  const isAdmin = user && user.role === "admin";

  if (isAdmin) {
    // Admin solo visualiza, no compra
    btn.textContent = "Solo vista admin";
    btn.disabled = true;
    btn.classList.add("btn-add-cart-admin");
  } else if (product.available) {
    btn.textContent = "Agregar al carrito";
    btn.disabled = false;
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // evitar que el click dispare el detalle
      handleAddToCart(product.id);
    });
  } else {
    btn.textContent = "Sin existencias";
    btn.disabled = true;
  }

  info.appendChild(title);
  info.appendChild(priceP);
  info.appendChild(btn);

  article.appendChild(imgWrapper);
  article.appendChild(info);

  return article;
}

// 🔹 Pintar lista de productos
function renderProducts(products, gridElement, countElement) {
  gridElement.innerHTML = "";

  if (!products.length) {
    gridElement.innerHTML = "<p>No hay productos para mostrar.</p>";
    if (countElement) countElement.textContent = "0 artículos";
    return;
  }

  const fragment = document.createDocumentFragment();

  products.forEach((p) => {
    const card = createProductCard(p);
    fragment.appendChild(card);
  });

  gridElement.appendChild(fragment);

  if (countElement) {
    const label = products.length === 1 ? "artículo" : "artículos";
    countElement.textContent = `${products.length} ${label}`;
  }
}

// 🔹 Filtros en el front
function applyFilters() {
  const availabilitySelect = document.getElementById("filter-availability");
  const priceOrderSelect = document.getElementById("filter-price");
  const itemsCount = document.getElementById("products-count");
  const grid =
    document.getElementById("products-grid") ||
    document.getElementById("offers-grid");

  if (!grid) return;

  let filtered = [...allProducts];

  // disponibilidad
  if (availabilitySelect && availabilitySelect.value) {
    const value = availabilitySelect.value;
    if (value === "available") {
      filtered = filtered.filter((p) => p.available);
    } else if (value === "soldout") {
      filtered = filtered.filter((p) => !p.available);
    }
  }

  // orden por precio
  if (priceOrderSelect && priceOrderSelect.value) {
    const order = priceOrderSelect.value;
    if (order === "asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (order === "desc") {
      filtered.sort((a, b) => b.price - a.price);
    }
  }

  renderProducts(filtered, grid, itemsCount);
}

// 🔹 Cargar productos según la página
async function loadProductsForPage() {
  const grid =
    document.getElementById("products-grid") ||
    document.getElementById("offers-grid");
  if (!grid) return;

  const mainProducts = document.querySelector("main.products-page");
  const mainOffers = document.querySelector("main.offers-page");
  const defaultCategory =
    mainProducts && mainProducts.dataset.categoryDefault
      ? mainProducts.dataset.categoryDefault
      : "";

  let endpoint = "/products";

  if (
    mainOffers ||
    document.body.classList.contains("offers-body") ||
    grid.id === "offers-grid"
  ) {
    endpoint = "/products/offers";
  } else if (defaultCategory) {
    endpoint = `/products?category=${encodeURIComponent(defaultCategory)}`;
  }

  try {
    const data = await API.apiFetch(endpoint);
    allProducts = Array.isArray(data) ? data : data.products || [];
    applyFilters();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p>Error al cargar productos: ${err.message}</p>`;
  }
}

// 🔹 Listeners de filtros
function initProductFilters() {
  const availabilitySelect = document.getElementById("filter-availability");
  const priceOrderSelect = document.getElementById("filter-price");

  if (availabilitySelect) {
    availabilitySelect.addEventListener("change", applyFilters);
  }
  if (priceOrderSelect) {
    priceOrderSelect.addEventListener("change", applyFilters);
  }
}

// 🔹 Agregar al carrito
async function handleAddToCart(productId) {
  // Bloquear acciones si es admin (por seguridad extra)
  const user =
    window.Auth && typeof Auth.getCurrentUser === "function"
      ? Auth.getCurrentUser()
      : null;
  if (user && user.role === "admin") {
    if (window.Swal) {
      await Swal.fire(
        "Solo administrador",
        "El administrador solo puede gestionar productos, no comprar.",
        "info"
      );
    } else {
      alert("El administrador solo puede gestionar productos, no comprar.");
    }
    return;
  }

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
          : data.items
          ? data.items.reduce(
              (acc, it) => acc + Number(it.cantidad || 0),
              0
            )
          : 0;
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

// 🔹 Inicialización
document.addEventListener("DOMContentLoaded", () => {
  const grid =
    document.getElementById("products-grid") ||
    document.getElementById("offers-grid");
  if (!grid) return;

  initProductFilters();
  loadProductsForPage();
});

// Exponer en window por si lo necesitas
window.Products = {
  loadProductsForPage,
  applyFilters,
};
