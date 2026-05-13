import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Extend jsPDF with autotable types
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

export const generateInvoicePDF = (invoice: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(33, 33, 33);
  doc.text("INVOICE", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.text("KANTOR NOTARIS DIGITAL", 20, 35);
  doc.text("Jl. Profesional No. 123, Jakarta", 20, 40);
  doc.text("Telp: (021) 12345678", 20, 45);
  
  doc.line(20, 50, 190, 50);
  
  // Client Details
  doc.setFontSize(12);
  doc.text("Tagihan Kepada:", 20, 65);
  doc.setFontSize(10);
  doc.text(invoice.clientName, 20, 72);
  doc.text(invoice.clientAddress, 20, 77);
  
  // Invoice Details
  doc.text(`Nomor Invoice: ${invoice.number}`, 140, 65);
  doc.text(`Tanggal: ${invoice.date}`, 140, 70);
  doc.text(`Jatuh Tempo: ${invoice.dueDate}`, 140, 75);
  
  // Table
  doc.autoTable({
    startY: 90,
    head: [["Deskripsi", "Jumlah"]],
    body: [
      [invoice.jobTitle, `Rp ${invoice.amount.toLocaleString()}`],
      ["Pajak (PPN 11%)", `Rp ${invoice.tax.toLocaleString()}`],
    ],
    theme: "striped",
    headStyles: { fillColor: [33, 33, 33] },
  });
  
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: Rp ${invoice.total.toLocaleString()}`, 190, finalY + 20, { align: "right" });
  
  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Terima kasih atas kepercayaan Anda.", 105, 250, { align: "center" });
  doc.text("Invoice ini dihasilkan secara otomatis oleh sistem.", 105, 255, { align: "center" });
  
  doc.save(`Invoice_${invoice.number}.pdf`);
};
