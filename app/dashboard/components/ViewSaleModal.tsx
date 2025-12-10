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

    const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 10;

    // Totals
    doc.setFontSize(11);
    doc.text(`Total: KES ${(sale.totalAmount || 0).toFixed(2)}`, 14, finalY + 10);
    doc.text(`Paid: KES ${(sale.paidAmount || 0).toFixed(2)}`, 14, finalY + 16);

    const balance = sale.balanceDue || 0;
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
      window.showToast("Sharing not supported on this browser. Please download the PDF instead.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            Sale #{sale.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Customer Info */}
          <div className="mb-6 text-gray-700 space-y-2">
            <p><strong className="text-gray-900">Customer:</strong> {sale.customerName}</p>
            {sale.customerPhone && <p><strong className="text-gray-900">Phone:</strong> {sale.customerPhone}</p>}
            <p><strong className="text-gray-900">Date:</strong> {new Date(sale.saleDate).toLocaleDateString()}</p>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 border border-gray-200 text-left font-semibold text-gray-900">Product</th>
                    <th className="p-3 border border-gray-200 text-left font-semibold text-gray-900">Qty</th>
                    <th className="p-3 border border-gray-200 text-left font-semibold text-gray-900">Unit Price</th>
                    <th className="p-3 border border-gray-200 text-left font-semibold text-gray-900">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-3 border border-gray-200">{item.productName}</td>
                      <td className="p-3 border border-gray-200 text-center">{item.quantity}</td>
                      <td className="p-3 border border-gray-200">KES {(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="p-3 border border-gray-200 font-medium">KES {(item.lineTotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="text-gray-800 space-y-2 mb-6 bg-gray-50 p-4 rounded-lg">
            <p className="flex justify-between">
              <strong className="text-gray-900">Total:</strong>
              <span className="font-bold">KES {(sale.totalAmount || 0).toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <strong className="text-gray-900">Paid:</strong>
              <span className="font-bold">KES {(sale.paidAmount || 0).toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <strong className="text-gray-900">Balance:</strong>
              <span className={`font-bold ${(sale.balanceDue ?? 0) > 0 ? "text-green-600" : (sale.balanceDue ?? 0) < 0 ? "text-red-600" : "text-gray-900"}`}>
                KES {(sale.balanceDue ?? 0).toFixed(2)}{" "}
                <span className="text-sm font-normal">
                  {(sale.balanceDue ?? 0) > 0
                    ? "(Overpaid)"
                    : (sale.balanceDue ?? 0) < 0
                    ? "(Pending)"
                    : "(Cleared)"}
                </span>
              </span>
            </p>
            {sale.paymentMethod && (
              <p className="flex justify-between">
                <strong className="text-gray-900">Payment Method:</strong>
                <span>{sale.paymentMethod}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => generateSalePDF("invoice")}
              className="flex-1 min-w-[150px] bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Download Invoice
            </button>
            <button
              onClick={() => generateSalePDF("receipt")}
              className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Download Receipt
            </button>
            <button
              onClick={() => shareSale("invoice")}
              className="flex-1 min-w-[150px] bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Share Invoice
            </button>
            <button
              onClick={() => shareSale("receipt")}
              className="flex-1 min-w-[150px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Share Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}