// funciones/contacto.js

document.addEventListener("DOMContentLoaded", () => {
  // Actualizar header y carrito si existen las funciones
  if (window.Auth && Auth.updateHeaderUser) {
    Auth.updateHeaderUser();
  }
  if (window.Auth && Auth.updateCartCountFromServer) {
    Auth.updateCartCountFromServer();
  }

  initFAQAccordion();
  initContactForm();
});

// ===== FAQ: abrir / cerrar respuestas =====
function initFAQAccordion() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const btn = item.querySelector(".faq-question");
    btn.addEventListener("click", () => {
      items.forEach((it) => {
        if (it !== item) it.classList.remove("open");
      });
      item.classList.toggle("open");
    });
  });
}

// ===== Formulario de contacto =====
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("contact-name").value.trim();
    const correo = document.getElementById("contact-email").value.trim();
    const asunto = document.getElementById("contact-subject").value.trim();
    const mensaje = document.getElementById("contact-message").value.trim();

    if (!nombre || !correo || !asunto || !mensaje) {
      Swal.fire(
        "Campos incompletos",
        "Por favor completa todos los campos del formulario.",
        "warning"
      );
      return;
    }

    try {
      // 👇 Aquí mandamos al backend /api/contact
      await API.apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify({ nombre, correo, asunto, mensaje }),
      });

      Swal.fire(
        "Mensaje enviado",
        "En breve será atendido. Revisa tu correo electrónico.",
        "success"
      );
      form.reset();
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.message || "No se pudo enviar el mensaje.",
        "error"
      );
    }
  });
}
