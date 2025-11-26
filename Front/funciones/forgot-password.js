// funciones/forgot-password.js

document.addEventListener("DOMContentLoaded", () => {
  if (window.Auth && Auth.updateHeaderUser) {
    Auth.updateHeaderUser();
  }

  const form = document.getElementById("forgot-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("forgot-email").value.trim();

    if (!email) {
      Swal.fire(
        "Campo requerido",
        "Por favor escribe tu correo electrónico.",
        "warning"
      );
      return;
    }

    try {
      const data = await API.apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      Swal.fire(
        "Revisa tu correo",
        data.message ||
          "Si el correo existe en Astro Motors, te enviamos un enlace para restablecer la contraseña.",
        "success"
      ).then(() => {
        window.location.href = "login.html";
      });
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.message || "No se pudo enviar el enlace.",
        "error"
      );
    }
  });
});
