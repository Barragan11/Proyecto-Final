// funciones/register.js

document.addEventListener("DOMContentLoaded", () => {
  if (window.Auth && Auth.updateHeaderUser) {
    Auth.updateHeaderUser();
  }

  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass1 = document.getElementById("reg-password").value;
    const pass2 = document.getElementById("reg-password2").value;

    // 1) campos requeridos
    if (!name || !email || !pass1 || !pass2) {
      Swal.fire(
        "Campos requeridos",
        "Todos los campos del formulario son obligatorios.",
        "warning"
      );
      return;
    }

    // 2) validación doble contraseña
    if (pass1 !== pass2) {
      Swal.fire(
        "Contraseñas diferentes",
        "La contraseña y su confirmación no coinciden.",
        "error"
      );
      return;
    }

    if (pass1.length < 6) {
      Swal.fire(
        "Contraseña muy corta",
        "La contraseña debe tener al menos 6 caracteres.",
        "info"
      );
      return;
    }

    try {
      const data = await API.apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password: pass1,
        }),
      });

      Swal.fire(
        "Cuenta creada",
        "Te has registrado correctamente. Ahora puedes iniciar sesión.",
        "success"
      ).then(() => {
        window.location.href = "login.html";
      });
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error al registrar",
        err.message || "No se pudo crear la cuenta.",
        "error"
      );
    }
  });
});
