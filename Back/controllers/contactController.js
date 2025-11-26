// back/controllers/contactController.js
const { sendContactAutoReply } = require("../utils/mailer");

async function handleContact(req, res, next) {
  try {
    const { nombre, correo, asunto, mensaje } = req.body;

    if (!nombre || !correo || !mensaje) {
      return res
        .status(400)
        .json({ message: "Nombre, correo y mensaje son obligatorios." });
    }

    // Enviar correo al usuario
    await sendContactAutoReply({
      to: correo,
      nombre,
      mensajeUsuario: mensaje,
    });

    // Podrías guardar el mensaje en BD si quisieras (opcional)

    res.json({
      message: "Mensaje recibido. En breve será atendido.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleContact,
};
