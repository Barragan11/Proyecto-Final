// funciones/auth.js

const LS_TOKEN_KEY = "astro_token";
const LS_USER_KEY = "astro_user";

let currentCaptchaId = null;

// ===== Sesión =====
function saveSession(token, user) {
  localStorage.setItem(LS_TOKEN_KEY, token);
  localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
}

function getCurrentUser() {
  const raw = localStorage.getItem(LS_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem(LS_TOKEN_KEY);
  localStorage.removeItem(LS_USER_KEY);
  // recarga al inicio
  window.location.href = "index.html";
}

function updateHeaderUser() {
  const user = getCurrentUser();

  const nameSpan  = document.getElementById("user-name");
  const loginLink = document.getElementById("login-link");
  const logoutBtn = document.getElementById("logout-btn");
  const cartLink  = document.getElementById("cart-link");
  const adminLink = document.getElementById("admin-link");

  if (user) {
    // Texto de saludo
    if (nameSpan) {
      const prefix = user.role === "admin" ? "Admin" : "Hola";
      nameSpan.textContent = `${prefix}, ${user.name}`;
      nameSpan.style.display = "inline";
    }

    // login se oculta, logout se muestra
    if (loginLink) loginLink.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    // 🔹 Si es ADMIN: mostrar ajustes, ocultar carrito
    if (user.role === "admin") {
      if (adminLink) adminLink.style.display = "inline-flex";
      if (cartLink)  cartLink.style.display  = "none";
    } else {
      // 🔹 Si es CLIENTE: mostrar carrito, ocultar ajustes
      if (adminLink) adminLink.style.display = "none";
      if (cartLink)  cartLink.style.display  = "inline-flex";
    }
  } else {
    // No hay sesión
    if (nameSpan) {
      nameSpan.textContent = "";
      nameSpan.style.display = "none";
    }
    if (loginLink) loginLink.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (cartLink)  cartLink.style.display  = "none";
    if (adminLink) adminLink.style.display = "none";
  }
}


// ===== Actualizar el numerito del carrito desde el servidor =====
async function updateCartCountFromServer() {
  const badge = document.getElementById("cart-count");
  if (!badge) return; // por si hay alguna página sin carrito

  const token = localStorage.getItem(LS_TOKEN_KEY);
  if (!token) {
    badge.textContent = "0";
    return;
  }

  try {
    const data = await API.apiFetch("/cart");
    const total =
      typeof data.totalProductos !== "undefined"
        ? data.totalProductos
        : (data.items || []).reduce(
            (acc, item) => acc + Number(item.cantidad || 0),
            0
          );
    badge.textContent = total;
  } catch (err) {
    // si el token ya no sirve o hay error, lo dejamos en 0
    console.error("Error cargando carrito:", err.message);
    badge.textContent = "0";
  }
}


// ===== Captcha =====
async function loadCaptcha() {
  const captchaTextEl = document.getElementById("captcha-text");
  if (!captchaTextEl) return;

  try {
    const data = await API.apiFetch("/auth/captcha");
    currentCaptchaId = data.id;
    captchaTextEl.textContent = data.text;
  } catch (err) {
    console.error(err);
    captchaTextEl.textContent = "Error al cargar captcha";
  }

  const input = document.getElementById("login-captcha");
  if (input) input.value = "";
}

// ===== Login =====
async function handleLoginSubmit(event) {
  event.preventDefault();

  const emailInput   = document.getElementById("login-email");
  const passInput    = document.getElementById("login-password");
  const captchaInput = document.getElementById("login-captcha");

  const email       = emailInput.value.trim();
  const password    = passInput.value.trim();
  const captchaText = captchaInput.value.trim();

  if (!email || !password || !captchaText) {
    Swal.fire("Campos incompletos", "Llena todos los campos.", "warning");
    return;
  }

  if (!currentCaptchaId) {
    Swal.fire("Captcha", "Actualiza el captcha e inténtalo de nuevo.", "warning");
    await loadCaptcha();
    return;
  }

  try {
    const data = await API.apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        captchaId: currentCaptchaId,
        captchaText,
      }),
    });

    saveSession(data.token, data.user);

    Swal.fire("Bienvenido", `Hola, ${data.user.name}`, "success").then(() => {
      window.location.href = "productos.html";
    });
  } catch (err) {
    Swal.fire("Error al iniciar sesión", err.message, "error");
    if (err.message.toLowerCase().includes("captcha")) {
      loadCaptcha();
    }
  }
}

// ===== Inicialización =====
document.addEventListener("DOMContentLoaded", () => {
  // siempre que cargue una página actualizamos header y carrito
  updateHeaderUser();
  if (window.Auth && Auth.updateCartCountFromServer) {
    Auth.updateCartCountFromServer();
  }

  // login.html
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);

    const refreshBtn = document.getElementById("refresh-captcha");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", (e) => {
        e.preventDefault();
        loadCaptcha();
      });
    }
    loadCaptcha();
  }

  // logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});


// exportar por si lo necesitas
window.Auth = {
  saveSession,
  getCurrentUser,
  logout,
  updateHeaderUser,
  updateCartCountFromServer,
};
