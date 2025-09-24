"use client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Sale {
 customerPhone: string;
  balance: number;
  id: number;
  customerName: string;
  saleDate: string;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  profit?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items: SaleItem[];
}

interface ViewSaleModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export default function ViewSaleModal({ sale, onClose }: ViewSaleModalProps) {
  if (!sale) return null;

  // 📌 Helper to build invoice/receipt
  const generateSalePDF = (type: "invoice" | "receipt") => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("My Shop Ltd.", 14, 15);
    doc.setFontSize(10);
    doc.text("123 Business Street, Nairobi, Kenya", 14, 21);
    doc.text("Phone: +254 700 000 000 | Email: info@myshop.com", 14, 26);

    doc.setFontSize(14);
    doc.text(type.toUpperCase(), 150, 15);

    // Sale info
    doc.setFontSize(10);
    doc.text(`Invoice #: ${sale.id}`, 150, 25);
    doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, 150, 30);

    // Customer info
    doc.text(`Customer: ${sale.customerName}`, 14, 40);
    if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`, 14, 45);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [["Product", "Qty", "Unit Price", "Line Total"]],
      body: sale.items.map((item) => [
        item.productName,
        item.quantity,
        `KES ${(item.unitPrice || 0).toFixed(2)}`,
        `KES ${(item.lineTotal || 0).toFixed(2)}`,
      ]),
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Totals
    doc.setFontSize(11);
    doc.text(`Total: KES ${(sale.totalAmount || 0).toFixed(2)}`, 14, finalY + 10);
    doc.text(`Paid: KES ${(sale.paidAmount || 0).toFixed(2)}`, 14, finalY + 16);

    const balance = sale.balance || 0;
    doc.text(
      `Balance: KES ${balance.toFixed(2)} ${
        balance > 0 ? "(Overpaid)" : balance < 0 ? "(Pending)" : "(Cleared)"
      }`,
      14,
      finalY + 22
    );

    if (sale.paymentMethod) {
      doc.text(`Payment Method: ${sale.paymentMethod}`, 14, finalY + 28);
    }

    doc.save(`${type}_${sale.id}.pdf`);
    return doc;
  };

  // 📌 Share using Web Share API
  const shareSale = async (type: "invoice" | "receipt") => {
    const doc = generateSalePDF(type);
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], `${type}_${sale.id}.pdf`, {
      type: "application/pdf",
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${type.toUpperCase()} for ${sale.customerName}`,
          text: `Here is your ${type}`,
          files: [file],
        });
      } catch (err) {
        console.error("Share canceled or failed:", err);
      }
    } else {
      alert("Sharing not supported on this browser. Please download the PDF instead.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Sale #{sale.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Customer Info */}
        <div className="mb-4 text-gray-700 space-y-1">
          <p><strong>Customer:</strong> {sale.customerName}</p>
          {sale.customerPhone && <p><strong>Phone:</strong> {sale.customerPhone}</p>}
          <p><strong>Date:</strong> {new Date(sale.saleDate).toLocaleDateString()}</p>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Unit Price</th>
                <th className="p-2 border">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{item.productName}</td>
                  <td className="p-2 border">{item.quantity}</td>
                  <td className="p-2 border">KES {(item.unitPrice || 0).toFixed(2)}</td>
                  <td className="p-2 border">KES {(item.lineTotal || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="text-gray-800 space-y-1 mb-6">
          <p><strong>Total:</strong> KES {(sale.totalAmount || 0).toFixed(2)}</p>
          <p><strong>Paid:</strong> KES {(sale.paidAmount || 0).toFixed(2)}</p>
          <p>
            <strong>Balance:</strong>{" "}
            KES {(sale.balance || 0).toFixed(2)}{" "}
            {sale.balance > 0
              ? "(Overpaid)"
              : sale.balance < 0
              ? "(Pending)"
              : "(Cleared)"}
          </p>
          {sale.paymentMethod && (
            <p><strong>Payment Method:</strong> {sale.paymentMethod}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generateSalePDF("invoice")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Download Invoice
          </button>
          <button
            onClick={() => generateSalePDF("receipt")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Download Receipt
          </button>
          <button
            onClick={() => shareSale("invoice")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Share Invoice
          </button>
          <button
            onClick={() => shareSale("receipt")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Share Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
