// funciones/admin.js

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

// solo admins pueden ver esta página
function ensureAdmin() {
  const user = Auth.getCurrentUser();
  if (!user || user.role !== "admin") {
    Swal.fire(
      "Acceso restringido",
      "Esta sección es solo para administradores.",
      "warning"
    ).then(() => {
      window.location.href = "index.html";
    });
    return false;
  }
  return true;
}

/* ===================== TABS ===================== */

function initAdminTabs() {
  const buttons = document.querySelectorAll(".admin-tab-btn");
  const sections = document.querySelectorAll(".admin-section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach((sec) => {
        sec.classList.remove("active");
      });
      const activeSection = document.getElementById(`admin-section-${target}`);
      if (activeSection) activeSection.classList.add("active");

      // cargar datos según sección
      if (target === "products") loadAdminProducts();
      if (target === "orders") loadAdminOrders();
      if (target === "users") loadAdminUsers();
      if (target === "dashboard") {
        loadSalesByCategoryChart();
        loadStockReportTable();
      }
    });
  });
}

/* ===================== PRODUCTOS ===================== */

// render de productos en modo editable
function renderAdminProducts(products) {
  const container = document.getElementById("admin-products-list");
  if (!container) return;

  if (!products.length) {
    container.innerHTML = "<p>No hay productos registrados.</p>";
    return;
  }

  const rowsHtml = products
    .map((p) => {
      const name = p.name || p.nombre || "";
      const description = p.description || p.descripcion || "";
      const price = p.price ?? p.precio ?? 0;
      const stock =
        p.stock ??
        p.existencias ??
        p.existencia ??
        0;
      const category = p.category || p.categoria || "clasicos";
      const imageUrl = p.imageUrl || p.imagen_url || "";
      const isOffer = !!(p.isOffer ?? p.es_oferta);

      return `
      <div class="admin-product-row" data-id="${p.id}">
        <div class="form-field">
          <label>Nombre</label>
          <input type="text" class="adm-name" value="${name}">
        </div>

        <div class="form-field">
          <label>Categoría</label>
          <select class="adm-category">
            <option value="clasicos" ${
              category === "clasicos" ? "selected" : ""
            }>Clásicos</option>
            <option value="deportivos" ${
              category === "deportivos" ? "selected" : ""
            }>Deportivos</option>
            <option value="lujosos" ${
              category === "lujosos" ? "selected" : ""
            }>Lujosos</option>
          </select>
        </div>

        <div class="form-field">
          <label>Precio</label>
          <input type="number" class="adm-price" min="0" step="0.01" value="${price}">
        </div>

        <div class="form-field">
          <label>Existencia</label>
          <input type="number" class="adm-stock" min="0" step="1" value="${stock}">
        </div>

        <div class="form-field form-field-wide">
          <label>Descripción</label>
          <textarea class="adm-desc" rows="2">${description}</textarea>
        </div>

        <div class="form-field form-field-wide">
          <label>URL de imagen</label>
          <input type="text" class="adm-image" value="${imageUrl}">
        </div>

        <div class="form-field">
          <label>Oferta</label>
          <input type="checkbox" class="adm-offer" ${
            isOffer ? "checked" : ""
          }>
        </div>

        <div class="form-field admin-actions">
          <button class="btn-small primary btn-save-product">Guardar</button>
          <button class="btn-small danger btn-delete-product">Eliminar</button>
        </div>
      </div>
      <hr>
    `;
    })
    .join("");

  container.innerHTML = rowsHtml;

  container.querySelectorAll(".btn-save-product").forEach((btn) => {
    btn.addEventListener("click", onSaveProductRow);
  });

  container.querySelectorAll(".btn-delete-product").forEach((btn) => {
    btn.addEventListener("click", onDeleteProductRow);
  });
}

async function loadAdminProducts() {
  const container = document.getElementById("admin-products-list");
  if (!container) return;
  container.innerHTML = "<p>Cargando productos...</p>";

  try {
    const data = await API.apiFetch("/products");
    const products = Array.isArray(data) ? data : data.products || [];
    renderAdminProducts(products);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error al cargar productos: ${err.message}</p>`;
  }
}

// guardar cambios de un producto
async function onSaveProductRow(e) {
  const row = e.target.closest(".admin-product-row");
  const id = row.dataset.id;

  const name = row.querySelector(".adm-name").value.trim();
  const description = row.querySelector(".adm-desc").value.trim();
  const category = row.querySelector(".adm-category").value;
  const imageUrl = row.querySelector(".adm-image").value.trim();
  const price = Number(row.querySelector(".adm-price").value);
  const stock = Number(row.querySelector(".adm-stock").value);
  const offer = row.querySelector(".adm-offer").checked;

  if (!name || Number.isNaN(price) || Number.isNaN(stock)) {
    Swal.fire(
      "Datos inválidos",
      "Nombre, precio y existencia son obligatorios.",
      "warning"
    );
    return;
  }

  try {
    await API.apiFetch(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
        price,
        oldPrice: null, // si quieres manejar precio anterior luego lo cambias
        imageUrl,
        category,
        stock,
        isOffer: offer,
      }),
    });

    Swal.fire("Guardado", "Producto actualizado correctamente.", "success");
    loadAdminProducts();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

// eliminar producto
async function onDeleteProductRow(e) {
  const row = e.target.closest(".admin-product-row");
  const id = row.dataset.id;

  const result = await Swal.fire({
    title: "¿Eliminar producto?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    await API.apiFetch(`/products/${id}`, {
      method: "DELETE",
    });
    Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
    loadAdminProducts();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

// crear nuevo producto
async function onCreateProduct() {
  const name = document.getElementById("prod-name").value.trim();
  const description = document.getElementById("prod-desc").value.trim();
  const price = Number(document.getElementById("prod-price").value);
  const stock = Number(document.getElementById("prod-stock").value);
  const category = document.getElementById("prod-category").value;
  const imageUrl = document.getElementById("prod-image").value.trim();
  const isOffer = document.getElementById("prod-offer").checked;

  if (!name || !description || Number.isNaN(price) || Number.isNaN(stock) || !category) {
    Swal.fire(
      "Datos incompletos",
      "Llena todos los campos obligatorios.",
      "warning"
    );
    return;
  }

  try {
    await API.apiFetch("/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        price,
        oldPrice: null,
        imageUrl,
        category,
        stock,
        isOffer,
      }),
    });

    Swal.fire("Producto creado", "Se agregó el nuevo producto.", "success");

    // limpiar formulario
    document.getElementById("prod-name").value = "";
    document.getElementById("prod-desc").value = "";
    document.getElementById("prod-price").value = "";
    document.getElementById("prod-stock").value = "";
    document.getElementById("prod-image").value = "";
    document.getElementById("prod-offer").checked = false;

    loadAdminProducts();
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  }
}

/* ===================== PEDIDOS ===================== */

function renderAdminOrders(orders) {
  const container = document.getElementById("admin-orders-list");
  if (!container) return;

  if (!orders.length) {
    container.innerHTML = "<p>No hay pedidos registrados.</p>";
    return;
  }

  const rowsHtml = orders
    .map(
      (o) => `
      <div class="admin-order-row">
        <div><strong>#${o.id}</strong></div>
        <div>Cliente: ${o.cliente || o.cliente_nombre || o.usuario_nombre || "N/A"}</div>
        <div>Total: ${formatCurrency(o.total_general || o.total || 0)}</div>
        <div>Pago: ${o.metodo_pago || "-"}</div>
        <div>Fecha: ${
          o.creado_en ? new Date(o.creado_en).toLocaleString() : "-"
        }</div>
      </div>
      <hr>
    `
    )
    .join("");

  container.innerHTML = rowsHtml;
}

async function loadAdminOrders() {
  const container = document.getElementById("admin-orders-list");
  if (!container) return;
  container.innerHTML = "<p>Cargando pedidos...</p>";

  try {
    const data = await API.apiFetch("/orders"); // GET /orders (admin)
    const orders = Array.isArray(data) ? data : data.orders || [];
    renderAdminOrders(orders);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error al cargar pedidos: ${err.message}</p>`;
  }
}

/* ===================== USUARIOS ===================== */

function renderAdminUsers(users) {
  const container = document.getElementById("admin-users-list");
  if (!container) return;

  if (!users.length) {
    container.innerHTML = "<p>No hay usuarios registrados.</p>";
    return;
  }

  const rowsHtml = users
    .map(
      (u) => `
      <div class="admin-user-row">
        <div><strong>${u.nombre}</strong></div>
        <div>${u.correo}</div>
        <div>Rol: ${u.rol}</div>
        <div>Verificado: ${u.verificado ? "Sí" : "No"}</div>
      </div>
      <hr>
    `
    )
    .join("");

  container.innerHTML = rowsHtml;
}

async function loadAdminUsers() {
  const container = document.getElementById("admin-users-list");
  if (!container) return;
  container.innerHTML = "<p>Cargando usuarios...</p>";

  try {
    const data = await API.apiFetch("/users"); // GET /users (admin)
    const users = Array.isArray(data) ? data : data.users || [];
    renderAdminUsers(users);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error al cargar usuarios: ${err.message}</p>`;
  }
}

/* ===================== DASHBOARD / ESTADÍSTICAS ===================== */

// guardamos la instancia de la gráfica para actualizarla
let salesByCategoryChart = null;

async function loadSalesByCategoryChart() {
  const canvas = document.getElementById("sales-by-category-chart");
  if (!canvas) return;
  if (typeof Chart === "undefined") {
    console.warn("Chart.js no está cargado");
    return;
  }

  try {
    const data = await API.apiFetch("/admin/stats/ventas-categoria");
    const rows = Array.isArray(data)
      ? data
      : data.data || data.ventas || [];

    if (!rows.length) {
      if (salesByCategoryChart) {
        salesByCategoryChart.destroy();
        salesByCategoryChart = null;
      }
      return;
    }

    const labels = rows.map(
      (r) => r.categoria || r.category || "Sin categoría"
    );
    const totals = rows.map(
      (r) => Number(r.total_ventas ?? r.total ?? r.cantidad ?? 0)
    );

    const totalProductos = totals.reduce((acc, n) => acc + n, 0);

    const ctx = canvas.getContext("2d");

    if (salesByCategoryChart) {
      salesByCategoryChart.destroy();
    }

    salesByCategoryChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            label: "Ventas por categoría",
            data: totals,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: `Total de ventas: ${totalProductos}`,
          },
        },
      },
    });
  } catch (err) {
    console.error(err);
    Swal.fire(
      "Error",
      "No se pudo cargar la gráfica de ventas por categoría.",
      "error"
    );
  }
}

function renderStockReportTable(products) {
  const container = document.getElementById("stock-report-table");
  if (!container) return;

  if (!products.length) {
    container.innerHTML = "<p>No hay productos para mostrar existencias.</p>";
    return;
  }

  const rowsHtml = products
    .map((p) => {
      const nombre = p.nombre || p.name || "Sin nombre";
      const categoria = p.categoria || p.category || "-";
      const existencias =
        p.existencias ??
        p.stock ??
        p.existencia ??
        0;

      return `
        <tr>
          <td>${nombre}</td>
          <td>${categoria}</td>
          <td>${existencias}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    <table class="cart-table admin-stock-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Existencias</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

async function loadStockReportTable() {
  const container = document.getElementById("stock-report-table");
  if (!container) return;

  container.innerHTML = "<p>Cargando existencias...</p>";

  try {
    const data = await API.apiFetch("/admin/stats/reporte-existencias");
    const productos = Array.isArray(data)
      ? data
      : data.productos || data.products || [];
    renderStockReportTable(productos);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error al cargar existencias: ${err.message}</p>`;
  }
}

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureAdmin()) return;

  initAdminTabs();

  const btnCreate = document.getElementById("btn-create-product");
  if (btnCreate) {
    btnCreate.addEventListener("click", (e) => {
      e.preventDefault();
      onCreateProduct();
    });
  }

  const btnRefreshSales = document.getElementById("btn-refresh-sales");
  if (btnRefreshSales) {
    btnRefreshSales.addEventListener("click", (e) => {
      e.preventDefault();
      loadSalesByCategoryChart();
    });
  }

  const btnRefreshStock = document.getElementById("btn-refresh-stock");
  if (btnRefreshStock) {
    btnRefreshStock.addEventListener("click", (e) => {
      e.preventDefault();
      loadStockReportTable();
    });
  }

  // por defecto, cargar productos (tab Productos)
  loadAdminProducts();
});
