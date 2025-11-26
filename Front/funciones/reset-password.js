// funciones/reset-password.js

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.Auth && Auth.updateHeaderUser) {
    Auth.updateHeaderUser();
  }

  const form = document.getElementById("reset-form");
  if (!form) return;

  const token = getTokenFromUrl();
  if (!token) {
    Swal.fire(
      "Enlace inválido",
      "El enlace para restablecer contraseña no es válido.",
      "error"
    ).then(() => {
      window.location.href = "login.html";
    });
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const p1 = document.getElementById("reset-password").value;
    const p2 = document.getElementById("reset-password2").value;

    if (!p1 || !p2) {
      Swal.fire(
        "Campos requeridos",
        "Debes escribir y confirmar la nueva contraseña.",
        "warning"
      );
      return;
    }

    if (p1 !== p2) {
      Swal.fire(
        "Contraseñas diferentes",
        "La contraseña y su confirmación no coinciden.",
        "error"
      );
      return;
    }

    try {
      await API.apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: p1 }),
      });

      Swal.fire(
        "Contraseña actualizada",
        "Ya puedes iniciar sesión con tu nueva contraseña.",
        "success"
      ).then(() => {
        window.location.href = "login.html";
      });
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.message || "No se pudo cambiar la contraseña.",
        "error"
      );
    }
  });
});
