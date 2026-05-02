import { jsPDF } from "jspdf";

function fmt(n) {
  return `${Number(n).toFixed(2)} €`;
}

/**
 * @param {object} invoice - respuesta del POST / factura completa
 * @param {{ workshopName: string, cif: string }} issuer
 */
export function buildWorkshopInvoicePdf(invoice, issuer) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFontSize(16);
  doc.text(String(issuer.workshopName ?? "Taller"), 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`CIF: ${issuer.cif || "—"}`, 14, y);
  y += 10;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("FACTURA", 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Nº ${invoice.invoiceNumber}`, 14, y);
  y += 5;
  doc.text(`Fecha: ${invoice.issueDate}`, 14, y);
  y += 8;

  doc.text(`Cliente: ${invoice.ownerName || "—"}`, 14, y);
  y += 5;
  doc.text(
    `Vehículo: ${invoice.brandName || ""} ${invoice.modelName || ""} · ${invoice.vehiclePlate}`,
    14,
    y,
  );
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Concepto", 14, y);
  doc.text("Cant.", 100, y);
  doc.text("P. unit. (s/IVA)", 118, y);
  doc.text("Total (s/IVA)", 155, y);
  doc.setFont("helvetica", "normal");
  y += 6;

  for (const line of invoice.lines || []) {
    if (y > 270) {
      doc.addPage();
      y = 14;
    }
    const label = line.name || "—";
    const short = label.length > 42 ? `${label.slice(0, 39)}…` : label;
    doc.text(short, 14, y);
    doc.text(String(line.quantity ?? 1), 100, y);
    doc.text(fmt(line.unitPriceExVat), 118, y);
    doc.text(fmt(line.lineTotalExVat), 155, y);
    y += 6;
  }

  y += 4;
  doc.line(14, y, pageW - 14, y);
  y += 8;

  const pct = Math.round(Number(invoice.ivaRate ?? 0) * 100);
  doc.text(`Base imponible: ${fmt(invoice.baseTotal)}`, pageW - 14, y, {
    align: "right",
  });
  y += 6;
  doc.text(`IVA (${pct}%): ${fmt(invoice.ivaAmount)}`, pageW - 14, y, {
    align: "right",
  });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${fmt(invoice.totalWithVat)}`, pageW - 14, y, {
    align: "right",
  });

  doc.save(`factura-${invoice.invoiceNumber}.pdf`);
}
