"use client";
import { useEffect, useState } from "react";

interface ReturnSaleModalProps {
  saleId: number;
  onClose: () => void;
  onReturnSuccess: () => void;
}

interface SaleDTO {
  items: SaleItem[];
  id: number;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
}

interface ReturnItem extends SaleItem {
  returnQty: number;
  reason: string;
  condition: string;
}

export default function ReturnSaleModal({
  saleId,
  onClose,
  onReturnSuccess,
}: ReturnSaleModalProps) {
  const [saleItems, setSaleItems] = useState<ReturnItem[]>([]);
  const [sale, setSale] = useState<SaleDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!saleId) return;

    fetch(`http://localhost:8080/api/sales/${saleId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sale");
        return res.json();
      })
      .then((data: SaleDTO) => {
        const withReturnFields = (data.items || []).map((item) => ({
          ...item,
          returnQty: 0,
          reason: "",
          condition: "GOOD",
        }));

        setSaleItems(withReturnFields);
        setSale(data);
      })
      .catch((err) => console.error("Failed to load sale:", err));
  }, [saleId]);

  const handleItemChange = (
    index: number,
    field: keyof ReturnItem,
    value: string | number
  ) => {
    setSaleItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async () => {
    const itemsToReturn = saleItems
      .filter((i) => i.returnQty > 0)
      .map((i) => ({
        productId: i.productId,
        quantity: i.returnQty,
        reason: i.reason,
        condition: i.condition,
      }));

    if (itemsToReturn.length === 0) {
      window.showToast("No items to return", "error");
      return;
    }

    for (const i of saleItems) {
      if (i.returnQty > i.quantity) {
        window.showToast(
          `Return quantity for ${i.productName} cannot exceed ${i.quantity}`,
          "error"
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/sales/${saleId}/return`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ items: itemsToReturn }),
});
      if (!res.ok) throw new Error("Failed to process return");

      onReturnSuccess();
      onClose();
    } catch (err) {
      window.showToast( "Error processing return", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg p-6 w-[550px] max-h-[80vh] overflow-y-auto shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Return Items (Sale #{saleId})
        </h2>

        {saleItems.length === 0 && (
          <p className="text-gray-500 mb-4">No items found for this sale.</p>
        )}

        {saleItems.map((item, idx) => (
          <div
            key={item.productId}
            className="border-b pb-4 mb-4 last:border-none last:pb-0 last:mb-0"
          >
            <div className="font-medium text-gray-800 mb-1">
              {item.productName} (Sold: {item.quantity})
            </div>

            <input
              type="number"
              min={0}
              max={item.quantity}
              value={item.returnQty}
              onChange={(e) =>
                handleItemChange(idx, "returnQty", Number(e.target.value))
              }
              className="w-full border rounded p-2 mt-1 mb-2"
              placeholder="Return quantity"
            />

            <textarea
              value={item.reason}
              onChange={(e) => handleItemChange(idx, "reason", e.target.value)}
              className="w-full border rounded p-2 mb-2"
              placeholder="Reason for return"
              required
            />

            <select
              value={item.condition}
              onChange={(e) =>
                handleItemChange(idx, "condition", e.target.value)
              }
              className="w-full border rounded p-2"
            >
              <option value="GOOD">Good Condition</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
        ))}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Processing..." : "Confirm Return"}
          </button>
        </div>
      </div>
    </div>
  );
}
