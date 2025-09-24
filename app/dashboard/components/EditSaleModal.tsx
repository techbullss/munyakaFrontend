import { useState } from "react";

interface SaleItem {
  id?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount?: number;
}

interface Sale {
  id: number;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number; // total paid so far
  balance: number;
  profit?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items: SaleItem[];
}

interface EditSaleModalProps {
  sale: Sale | null;
  onClose: () => void;
  onSave: (updatedSale: Sale) => void;
}

export default function EditSaleModal({ sale, onClose, onSave }: EditSaleModalProps) {
  const [formData, setFormData] = useState<Sale | null>(sale);
  const [newPayment, setNewPayment] = useState<number>(0); // 🆕 field for extra payment
  const [errors, setErrors] = useState<string[]>([]);

  if (!formData) return null;

  // --- Helper to recalc totals & status
  const recalcTotals = (data: Sale): Sale => {
    const totalAmount = data.items.reduce((sum, i) => sum + i.lineTotal, 0);
    const balance = totalAmount - (data.paidAmount || 0);

    let paymentStatus: string;
    if (data.paidAmount >= totalAmount) {
      paymentStatus = data.paidAmount > totalAmount ? "OVERPAID" : "PAID";
    } else if (data.paidAmount > 0) {
      paymentStatus = "PARTIAL";
    } else {
      paymentStatus = "PENDING";
    }

    return { ...data, totalAmount, balance, paymentStatus };
  };

  const handleChange = (field: keyof Sale, value: any) => {
    setFormData((prev) => (prev ? recalcTotals({ ...prev, [field]: value }) : prev));
  };

  const applyNewPayment = () => {
    if (!formData) return;
    if (newPayment <= 0) return;

    const updated = {
      ...formData,
      paidAmount: formData.paidAmount + newPayment, // add instead of overwrite
    };

    setFormData(recalcTotals(updated));
    setNewPayment(0); // reset input
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    if (!formData.customerName.trim()) newErrors.push("Customer name is required");
    if (!formData.customerPhone?.match(/^(01|07)\d{8}$/))
      newErrors.push("Phone must start with 01 or 07 and be 10 digits");
    if (!formData.saleDate) newErrors.push("Sale date is required");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!formData) return;
    if (!validateForm()) return;

    try {
      const response = await fetch(`http://localhost:8080/api/sales/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update sale");

      const updatedSale = await response.json();
      onSave(updatedSale);
      onClose();
    } catch (err) {
      console.error("Error updating sale:", err);
      alert("Failed to update sale. Check console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold mb-4">Edit Sale #{formData.id}</h2>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            <ul className="list-disc pl-5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Customer + Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => handleChange("customerName", e.target.value)}
            className="border px-3 py-2 rounded-md"
            placeholder="Customer Name"
          />
          <input
            type="tel"
            value={formData.customerPhone || ""}
            onChange={(e) => handleChange("customerPhone", e.target.value)}
            className="border px-3 py-2 rounded-md"
            placeholder="07XXXXXXXX"
          />
          <input
            type="datetime-local"
            value={formData.saleDate.slice(0, 16)}
            onChange={(e) => handleChange("saleDate", e.target.value)}
            className="border px-3 py-2 rounded-md"
          />
          <select
            value={formData.paymentMethod || ""}
            onChange={(e) => handleChange("paymentMethod", e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="card">Card</option>
          </select>
        </div>

        {/* Items (read-only since linked to POS) */}
        <h3 className="font-medium mb-2">Items (read-only)</h3>
        <table className="w-full text-sm border mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Discount</th>
              <th className="p-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{item.productName}</td>
                <td className="p-2 text-right">{item.quantity}</td>
                <td className="p-2 text-right">kes{item.unitPrice.toFixed(2)}</td>
                <td className="p-2 text-right">kes{(item.discount || 0).toFixed(2)}</td>
                <td className="p-2 text-right">kes{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p>
              Total: <span className="font-medium">kes{formData.totalAmount.toFixed(2)}</span>
            </p>
            <p>
              Balance:{" "}
              <span className={formData.balance < 0 ? "text-red-600" : "text-green-600"}>
                kes{formData.balance.toFixed(2)}
              </span>
            </p>
            <p>
              Status: <span className="font-bold">{formData.paymentStatus}</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium">Add Payment</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={newPayment}
                onChange={(e) => setNewPayment(Number(e.target.value))}
                className="border px-3 py-2 rounded-md w-full"
                placeholder="Enter amount"
              />
              <button
                onClick={applyNewPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Already Paid: <strong>kes{formData.paidAmount.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
