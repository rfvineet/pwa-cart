import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CartItem } from "../types";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function generateBillPDF(cartItems: CartItem[]) {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Book Cart", 14, 22);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Invoice", 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

  const tableHead = [
    ["Item Name", "Author", "Qty", "Unit Price ($)", "Subtotal ($)"],
  ];
  const tableBody = cartItems.map((item) => [
    item.name,
    item.author,
    item.quantity,
    item.price.toFixed(2),
    (item.price * item.quantity).toFixed(2),
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 50,
    theme: "striped",
    headStyles: {
      fillColor: [22, 160, 133],
    },
  });

  const grandTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const finalY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: $${grandTotal.toFixed(2)}`, 14, finalY + 15);

  doc.save(`bill-${Date.now()}.pdf`);
}
