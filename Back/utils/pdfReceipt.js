// back/utils/pdfReceipt.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Helper para formato de dinero
function money(value) {
  const num = Number(value || 0);
  return num.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

/**
 * options = {
 *   order,        // { id, creado_en?, ... }
 *   items,        // array con productos de la orden
 *   totals,       // { subtotal, impuestos, envio, descuento, totalGeneral, cuponCodigo? }
 *   customerName, // nombre del cliente (string)
 * }
 *
 * Devuelve: Promise<Buffer> con el PDF.
 */
function generateOrderPdfBuffer(options) {
  const { order, items = [], totals, customerName } = options;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const accent = "#ff4444";
    const dark = "#111111";

    // ===== HEADER OSCURO CON LOGO =====
    const pageWidth = doc.page.width;
    const headerHeight = 90;

    doc.rect(0, 0, pageWidth, headerHeight).fill(dark);

    // Logo
    try {
      const logoPath = path.join(__dirname, "..", "images", "logo-astro-motors.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 18, { height: 54 });
      }
    } catch (e) {
      console.error("No se pudo cargar el logo en el PDF:", e);
    }

    // Texto del encabezado (Astro Motors)
    doc
      .fillColor("#ffffff")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("ASTRO MOTORS", 120, 24);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#f0f0f0")
      .text('"Conquista la carretera, llega más lejos"', 120, 48);

    // Volvemos a fondo blanco
    doc.fillColor("#000000");
    doc.moveDown(3);

    // Posición inicial del contenido
    doc.y = headerHeight + 20;

    // ===== TÍTULO NOTA DE COMPRA =====
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor(accent)
      .text("Nota de compra", { align: "left" });

    doc.moveDown(0.5);

    // Datos generales (fecha, hora, cliente, orden)
    const createdAt = order.creado_en ? new Date(order.creado_en) : new Date();
    const fecha = createdAt.toLocaleDateString("es-MX");
    const hora = createdAt.toLocaleTimeString("es-MX");

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#222222")
      .text(`Fecha: ${fecha}`)
      .text(`Hora: ${hora}`)
      .text(`Cliente: ${customerName || "N/A"}`)
      .text(`No. de orden: #${order.id}`);

    doc.moveDown(1.2);

    // Línea separadora
    doc
      .strokeColor("#dddddd")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(pageWidth - 50, doc.y)
      .stroke();

    doc.moveDown(1);

    // ===== DETALLE DE LA COMPRA =====
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text("Detalle de la compra");

    doc.moveDown(0.7);

    // Encabezados de la tabla
    const tableTop = doc.y;
    const colX = {
      producto: 50,
      cant: 290,
      unit: 340,
      total: 430,
    };

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#555555")
      .text("Producto", colX.producto, tableTop)
      .text("Cant.", colX.cant, tableTop, { width: 40, align: "right" })
      .text("P. unitario", colX.unit, tableTop, { width: 80, align: "right" })
      .text("Importe", colX.total, tableTop, { width: 100, align: "right" });

    doc
      .strokeColor("#cccccc")
      .lineWidth(0.8)
      .moveTo(50, tableTop + 16)
      .lineTo(pageWidth - 50, tableTop + 16)
      .stroke();

    let y = tableTop + 24;

    // Filas de productos
    doc.font("Helvetica").fontSize(10).fillColor("#222222");

    items.forEach((item, index) => {
      const producto =
        item.nombre_producto ||
        item.nombre ||
        item.producto ||
        "Producto";
      const cantidad = item.cantidad || item.qty || 1;
      const unitario = item.precio_unitario || item.precio || 0;
      const importe = item.subtotal || unitario * cantidad;

      // fondo alternado
      if (index % 2 === 0) {
        doc
          .save()
          .rect(45, y - 4, pageWidth - 90, 18)
          .fill("#f7f7f7")
          .restore();
      }

      doc
        .fillColor("#222222")
        .text(producto, colX.producto, y, { width: 220 })
        .text(String(cantidad), colX.cant, y, { width: 40, align: "right" })
        .text(money(unitario), colX.unit, y, { width: 80, align: "right" })
        .text(money(importe), colX.total, y, { width: 100, align: "right" });

      y += 20;
    });

    doc.moveDown(2);

    // ===== RESUMEN DE COBRO =====
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(accent)
      .text("Resumen de cobro");

    doc.moveDown(0.7);

    const totalsX = 300;

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#222222");

    function totalRow(label, value, bold = false) {
      const font = bold ? "Helvetica-Bold" : "Helvetica";
      doc.font(font).text(label, totalsX, doc.y, { width: 120 });
      doc
        .font(font)
        .text(value, totalsX + 130, doc.y, { width: 120, align: "right" });
      doc.moveDown(0.2);
      doc.y += 2;
    }

    totalRow("Subtotal:", money(totals.subtotal));
    totalRow("Impuestos:", money(totals.impuestos));
    totalRow("Gastos de envío:", money(totals.envio));
    totalRow(
      "Cupón aplicado:",
      totals.cuponCodigo ? totals.cuponCodigo : "N/A"
    );
    totalRow("Descuento:", money(totals.descuento || 0));

    doc.moveDown(0.4);
    doc
      .strokeColor(accent)
      .lineWidth(1)
      .moveTo(totalsX, doc.y)
      .lineTo(pageWidth - 50, doc.y)
      .stroke();

    doc.moveDown(0.4);
    totalRow("Total general:", money(totals.totalGeneral || totals.total), true);

    doc.moveDown(2);

    // ===== PIE DE PÁGINA =====
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555555")
      .text(
        "Esta nota de compra forma parte del proyecto académico Astro Motors.",
        50,
        doc.y,
        { width: pageWidth - 100 }
      )
      .text(
        "Si no reconoces esta operación, contáctanos de inmediato respondiendo este correo.",
        50,
        doc.y + 14,
        { width: pageWidth - 100 }
      );

    doc.end();
  });
}

module.exports = { generateOrderPdfBuffer };
