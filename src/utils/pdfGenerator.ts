import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CartItem } from "../types";

export function generateBillPDF(cartItems: CartItem[], username: string) {

  const doc = new jsPDF();

 
  doc
    .setFontSize(22)
    .setFont("helvetica", "bold")
    .text("Offline Bookstore", 14, 22);
  doc.setFontSize(12).setFont("helvetica", "normal");
  doc.text("Invoice", 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
  doc.text(`Customer: ${username}`, 14, 42);

  
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
    headStyles: { fillColor: [22, 160, 133] }, 
  });


  const grandTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const finalY = (doc as any).lastAutoTable.finalY; 

  doc
    .setFontSize(14)
    .setFont("helvetica", "bold")
    .text(`Grand Total: $${grandTotal.toFixed(2)}`, 14, finalY + 15);


  doc.save(`bill-${Date.now()}.pdf`);
}
