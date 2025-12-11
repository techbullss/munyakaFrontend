import { useState, useEffect } from "react";

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  profit: number;
  buyingPrice: number;
}

interface Sale {
  id: number;
  customerName: string;
  customerPhone: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  profit: number;
  paymentStatus: string;
  paymentMethod: string;
  items: SaleItem[];
  isDeleted?: boolean;
  deletedAt?: string | null;
}

interface Product {
  id: number;
  itemName: string;
  sellingPrice: number;
  price: number;
  category?: string;
  description?: string;
  stockQuantity?: number;
  supplier?: string;
  sellingUnit?: string;
}

interface EditSaleModalProps {
  sale: Sale | null;
  onClose: () => void;
  onSave: (updatedSale: Sale) => void;
  availableProducts: Product[];
}

export default function EditSaleModal({ sale, onClose, onSave, availableProducts }: EditSaleModalProps) {
  const [formData, setFormData] = useState<Sale | null>(null);
  const [newPayment, setNewPayment] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [availableStocks, setAvailableStocks] = useState<Map<number, number>>(new Map());

  const productsArray = Array.isArray(availableProducts) ? availableProducts : [];

  useEffect(() => {
    if (sale) {
      // Initialize available stocks from current products
      const stockMap = new Map<number, number>();
      
      productsArray.forEach(product => {
        stockMap.set(product.id, product.stockQuantity || 0);
      });

      // Add back original quantities to available stock
      sale.items.forEach(item => {
        if (item.productId && stockMap.has(item.productId)) {
          const currentStock = stockMap.get(item.productId) || 0;
          stockMap.set(item.productId, currentStock + item.quantity);
        }
      });

      setAvailableStocks(stockMap);

      // Set form data from sale
      setFormData({ 
        ...sale,
        paymentMethod: sale.paymentMethod || "cash"
      });
    }
  }, [sale, productsArray]);

  if (!formData) return null;

  // Get available stock for a product
  const getAvailableStock = (productId: number): number => {
    return availableStocks.get(productId) || 0;
  };

  // Recalculate totals based on items
  const recalcTotals = (data: Sale): Sale => {
    const totalAmount = data.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const paidAmount = data.paidAmount || 0;
    const balance = totalAmount - paidAmount;

    let paymentStatus: string;
    if (paidAmount >= totalAmount) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    } else {
      paymentStatus = "PENDING";
    }

    const profit = data.items.reduce((sum, item) => {
      const unitProfit = item.unitPrice - item.buyingPrice;
      return sum + (unitProfit * item.quantity - item.discount);
    }, 0);

    return { 
      ...data, 
      totalAmount, 
      balance, 
      paymentStatus,
      profit 
    };
  };

  const handleChange = (field: keyof Sale, value: string | number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      return recalcTotals(updated);
    });
  };

  const handleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updatedItems = [...prev.items];
      const item = updatedItems[index];
      
      // For quantity changes, check stock availability
      if (field === 'quantity') {
        const requestedQuantity = Number(value);
        const originalQuantity = item.quantity;
        const availableStock = getAvailableStock(item.productId);
        
        // Calculate net change in quantity
        const quantityChange = requestedQuantity - originalQuantity;
        
        if (quantityChange > 0 && quantityChange > availableStock) {
          setErrors([`Insufficient stock for ${item.productName}. Available: ${availableStock}, Additional needed: ${quantityChange}`]);
          return prev;
        }
      }

      const updatedItem = {
        ...item,
        [field]: field === 'quantity' || field === 'discount' || field === 'unitPrice' 
          ? Number(value) 
          : value,
      };

      // Recalculate lineTotal if quantity, unitPrice, or discount changes
      if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
        const quantity = field === 'quantity' ? Number(value) : updatedItem.quantity;
        const unitPrice = field === 'unitPrice' ? Number(value) : updatedItem.unitPrice;
        const discount = field === 'discount' ? Number(value) : updatedItem.discount;
        
        // Calculate new line total
        const lineTotal = (unitPrice * quantity) - discount;
        const profit = (unitPrice - item.buyingPrice) * quantity - discount;
        
        updatedItem.quantity = quantity;
        updatedItem.unitPrice = unitPrice;
        updatedItem.discount = discount;
        updatedItem.lineTotal = lineTotal;
        updatedItem.profit = profit;
      }

      updatedItems[index] = updatedItem;
      const updatedSale = { ...prev, items: updatedItems };
      setErrors([]);
      return recalcTotals(updatedSale);
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const itemToRemove = prev.items[index];
      
      // Update available stock when removing item
      if (itemToRemove.productId) {
        const currentStock = availableStocks.get(itemToRemove.productId) || 0;
        availableStocks.set(itemToRemove.productId, currentStock + itemToRemove.quantity);
      }
      
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const updatedSale = { ...prev, items: updatedItems };
      return recalcTotals(updatedSale);
    });
  };

  const applyNewPayment = () => {
    if (!formData) return;
    if (newPayment <= 0) {
      setErrors(["Payment amount must be greater than 0"]);
      return;
    }

    const updated = {
      ...formData,
      paidAmount: formData.paidAmount + newPayment,
    };

    setFormData(recalcTotals(updated));
    setNewPayment(0);
    setErrors([]);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // Only require customer info if balance is due (paid amount < total)
    const hasBalanceDue = formData.balance > 0;
    
    if (hasBalanceDue) {
      if (!formData.customerName?.trim()) {
        newErrors.push("Customer name is required when balance is due");
      }
      if (!formData.customerPhone?.trim()) {
        newErrors.push("Customer phone is required when balance is due");
      }
      
      // Phone validation for Kenyan numbers (only if required)
      const phoneRegex = /^(07|01)\d{8}$/;
      if (formData.customerPhone && !phoneRegex.test(formData.customerPhone.replace(/\s/g, ''))) {
        newErrors.push("Phone must start with 07 or 01 and be 10 digits");
      }
    }
    
    if (!formData.saleDate) {
      newErrors.push("Sale date is required");
    }
    if (formData.items.length === 0) {
      newErrors.push("At least one item is required");
    }
    if (formData.paidAmount < 0) {
      newErrors.push("Paid amount cannot be negative");
    }
    if (!formData.paymentMethod) {
      newErrors.push("Payment method is required");
    }
    
    // Check stock for all items
    formData.items.forEach(item => {
      if (item.productId > 0) {
        const availableStock = getAvailableStock(item.productId);
        if (item.quantity > availableStock) {
          newErrors.push(`Insufficient stock for ${item.productName}. Available: ${availableStock}, Requested: ${item.quantity}`);
        }
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSaveWithItems = async () => {
    if (!formData) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Transform items for backend - matching your API structure
      const itemsForBackend = formData.items.map(item => ({
        productId: item.productId,
        name: item.productName,        // Changed from productName to name
        price: item.unitPrice,         // Changed from unitPrice to price
        quantity: item.quantity,
        discountAmount: item.discount, // Changed from discount to discountAmount
        total: item.lineTotal,         // Changed from lineTotal to total
        // Remove buyingPrice - backend doesn't need it
      }));

      const response = await fetch(`http://localhost:8080/api/sales/${formData.id}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          paymentMethod: formData.paymentMethod,
          saleDate: formData.saleDate,
          paidAmount: formData.paidAmount,
          items: itemsForBackend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update sale with items");
      }

      const updatedSale = await response.json();
      onSave({ ...formData, ...updatedSale });
      onClose();
      window.showToast("Sale updated successfully!", "success");
    } catch (err: any) {
      console.error("Error updating sale:", err);
      window.showToast(err.message || "Failed to update sale", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Sale #{formData.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer Name {formData.balance > 0 ? "*" : ""}
            </label>
            <input
              type="text"
              value={formData.customerName || ""}
              onChange={(e) => handleChange("customerName", e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
              placeholder="Customer Name"
            />
            {formData.balance > 0 && (
              <p className="text-xs text-gray-500 mt-1">Required when balance is due</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone {formData.balance > 0 ? "*" : ""}
            </label>
            <input
              type="tel"
              value={formData.customerPhone || ""}
              onChange={(e) => handleChange("customerPhone", e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
              placeholder="07XXXXXXXX"
            />
            {formData.balance > 0 && (
              <p className="text-xs text-gray-500 mt-1">Required when balance is due</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sale Date *</label>
            <input
              type="datetime-local"
              value={formData.saleDate.slice(0, 16)}
              onChange={(e) => handleChange("saleDate", e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method *</label>
            <select
              value={formData.paymentMethod || ""}
              onChange={(e) => handleChange("paymentMethod", e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
            >
              <option value="">Select Payment Method</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
            </select>
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Items</h3>
          
          {/* Items Table */}
          <table className="w-full text-sm border mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-center">Quantity</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Discount</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-gray-500">
                      Available: {getAvailableStock(item.productId)}
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="border px-2 py-1 rounded w-full text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="border px-2 py-1 rounded w-full text-right"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount || 0}
                      onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                      className="border px-2 py-1 rounded w-full text-right"
                    />
                  </td>
                  <td className="p-2 text-right font-medium">
                    Ksh{item.lineTotal?.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-3">Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">Ksh{formData.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                <span className="font-medium">Ksh{formData.paidAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance:</span>
                <span className={`font-medium ${formData.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Ksh{Math.abs(formData.balance).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profit:</span>
                <span className="font-medium text-green-600">Ksh{(formData.profit || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className={`font-bold ${
                  formData.paymentStatus === 'PAID' ? 'text-green-600' :
                  formData.paymentStatus === 'PARTIAL' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {formData.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-3">Payment</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Add Payment (Ksh)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPayment}
                    onChange={(e) => setNewPayment(Number(e.target.value))}
                    className="border px-3 py-2 rounded-md w-full"
                    placeholder="Enter amount"
                  />
                  <button
                    onClick={applyNewPayment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                    disabled={newPayment <= 0}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Current Payment: <strong>Ksh{formData.paidAmount?.toFixed(2)}</strong></p>
                <p>Remaining Balance: <strong>Ksh{formData.balance?.toFixed(2)}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <button
              onClick={handleSaveWithItems}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Info Text */}
        <div className="mt-4 text-sm text-gray-500">
          <p><strong>Note:</strong></p>
          <ul className="list-disc pl-5 mt-1">
            <li>You can adjust quantity, price, and discount for existing items</li>
            <li>When you change price or quantity, the total updates automatically</li>
            <li>Customer name and phone are only required if balance is due</li>
            <li>Stock is automatically checked - cannot exceed available stock</li>
            <li>When removing items, stock is automatically returned</li>
            <li>Profit is automatically calculated based on item cost prices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}