// =======================
// ACCESIBILIDAD COMPLETA
// =======================

// --- Obtener usuario actual (del mismo storage de auth) ---
function getCurrentUserIdForAccessibility() {
  const raw = localStorage.getItem("astro_user");
  if (!raw) return "guest";
  try {
    const user = JSON.parse(raw);
    return user?.id ? user.id : "guest";
  } catch {
    return "guest";
  }
}

// Claves personalizadas por usuario
function getAccessibilityKeys() {
  const id = getCurrentUserIdForAccessibility();
  return {
    themeKey: `astro_theme_${id}`,
    fontKey: `astro_font_${id}`,
  };
}

// Aplicar preferencias guardadas
function applyAccessibilityFromStorage() {
  const html = document.documentElement;
  const { themeKey, fontKey } = getAccessibilityKeys();

  const theme = localStorage.getItem(themeKey) || "dark";
  const font = localStorage.getItem(fontKey) || "normal";

  html.setAttribute("data-theme", theme);
  html.setAttribute("data-font-scale", font);

  // actualizar selección visual
  document.querySelectorAll(".accessibility-chip").forEach(chip => {
    chip.classList.remove("is-active");
    if (chip.dataset.theme === theme) chip.classList.add("is-active");
    if (chip.dataset.font === font) chip.classList.add("is-active");
  });
}

// Guardar preferencias
function saveAccessibilityToStorage({ theme, font }) {
  const { themeKey, fontKey } = getAccessibilityKeys();
  if (theme) localStorage.setItem(themeKey, theme);
  if (font) localStorage.setItem(fontKey, font);
}

// Panel flotante
function initAccessibilityPanel() {
  const btn = document.getElementById("accessibility-btn");
  const panel = document.getElementById("accessibility-panel");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    panel.classList.toggle("open");
    panel.setAttribute("aria-hidden", panel.classList.contains("open") ? "false" : "true");
  });

  panel.addEventListener("click", (e) => {
    const chip = e.target.closest(".accessibility-chip");
    if (!chip) return;

    const theme = chip.dataset.theme;
    const font = chip.dataset.font;

    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      saveAccessibilityToStorage({ theme });
    }
    if (font) {
      document.documentElement.setAttribute("data-font-scale", font);
      saveAccessibilityToStorage({ font });
    }

    // actualizar chips activos
    applyAccessibilityFromStorage();
  });
}

// ===================
// APORTACIÓN EXTRA ↓
// ===================

function initExtraMusic() {
  const btn = document.getElementById("music-toggle");
  const audio = document.getElementById("bg-music");
  if (!btn || !audio) return;

  const KEY = "astro_music_enabled";
  let enabled = localStorage.getItem(KEY) === "1";

  function updateBtn() {
    btn.textContent = enabled ? "⏸ Pausar" : "▶ Reproducir";
  }

  if (enabled) {
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  updateBtn();

  btn.addEventListener("click", () => {
    enabled = !enabled;
    localStorage.setItem(KEY, enabled ? "1" : "0");

    if (enabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    updateBtn();
  });
}

// ===================
// Inicialización
// ===================
document.addEventListener("DOMContentLoaded", () => {
  applyAccessibilityFromStorage(); // aplica el del usuario actual
  initAccessibilityPanel();        // activa panel
  initExtraMusic();                // música
});
