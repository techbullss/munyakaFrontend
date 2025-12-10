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
  price: number; // buying price
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
  const [showAddItem, setShowAddItem] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<Partial<SaleItem>>({
    productId: 0,
    quantity: 1,
    discount: 0,
  });
  const [availableStocks, setAvailableStocks] = useState<Map<number, number>>(new Map());
  const [itemQuantitiesHistory, setItemQuantitiesHistory] = useState<Map<number, number>>(new Map()); // productId -> original quantity

  const productsArray = Array.isArray(availableProducts) ? availableProducts : [];

  useEffect(() => {
    if (sale) {
      // Initialize available stocks from current products
      const stockMap = new Map<number, number>();
      const quantitiesMap = new Map<number, number>(); // Track original quantities
      
      productsArray.forEach(product => {
        stockMap.set(product.id, product.stockQuantity || 0);
      });

      // Add back original quantities to available stock and track them
      sale.items.forEach(item => {
        if (item.productId && stockMap.has(item.productId)) {
          const currentStock = stockMap.get(item.productId) || 0;
          stockMap.set(item.productId, currentStock + item.quantity);
          quantitiesMap.set(item.productId, item.quantity);
        }
      });

      setAvailableStocks(stockMap);
      setItemQuantitiesHistory(quantitiesMap);

      // Set form data from sale
      setFormData({ 
        ...sale,
        paymentMethod: sale.paymentMethod || "cash"
      });
    }
  }, [sale, productsArray]);

  if (!formData) return null;

  // Check if a product has sufficient stock
  const hasSufficientStock = (productId: number, requestedQuantity: number): boolean => {
    const availableStock = availableStocks.get(productId) || 0;
    return availableStock >= requestedQuantity;
  };

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
      if (field === 'quantity' && item.productId > 0) {
        const requestedQuantity = Number(value);
        if (!hasSufficientStock(item.productId, requestedQuantity)) {
          setErrors([`Insufficient stock for ${item.productName}. Available: ${getAvailableStock(item.productId)}`]);
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
      if (field === 'quantity' || field === 'unitPrice' || field === 'discount' || field === 'productId') {
        const product = field === 'productId' 
          ? productsArray.find(p => p.id === value)
          : productsArray.find(p => p.id === item.productId);
        
        if (product) {
          const quantity = field === 'quantity' ? Number(value) : item.quantity;
          const unitPrice = product.sellingPrice;
          const discount = field === 'discount' ? Number(value) : item.discount;
          const productId = field === 'productId' ? Number(value) : item.productId;
          const productName = field === 'productId' ? product.itemName : item.productName;
          const buyingPrice = product.price;
          
          const lineTotal = (unitPrice * quantity) - discount;
          const profit = (unitPrice - buyingPrice) * quantity - discount;
          
          updatedItem.productId = productId;
          updatedItem.productName = productName;
          updatedItem.unitPrice = unitPrice;
          updatedItem.lineTotal = lineTotal;
          updatedItem.buyingPrice = buyingPrice;
          updatedItem.profit = profit;
        }
      }

      updatedItems[index] = updatedItem;
      const updatedSale = { ...prev, items: updatedItems };
      return recalcTotals(updatedSale);
    });
  };

  const addNewItem = () => {
    if (!newItem.productId || (newItem.quantity ?? 0) <= 0) {
      setErrors(["Please select a product and enter valid quantity"]);
      return;
    }

    const product = productsArray.find(p => p.id === newItem.productId);
    if (!product) {
      setErrors(["Selected product not found"]);
      return;
    }

    // Check stock availability
    if (!hasSufficientStock(newItem.productId, newItem.quantity || 1)) {
      setErrors([`Insufficient stock for ${product.itemName}. Available: ${getAvailableStock(newItem.productId)}`]);
      return;
    }

    setFormData((prev) => {
      if (!prev) return prev;
      
      const lineTotal = (product.sellingPrice * (newItem.quantity || 1)) - (newItem.discount || 0);
      const profit = (product.sellingPrice - product.price) * (newItem.quantity || 1) - (newItem.discount || 0);
      
      const item: SaleItem = {
        productId: newItem.productId!,
        productName: product.itemName,
        quantity: newItem.quantity || 1,
        unitPrice: product.sellingPrice,
        lineTotal: lineTotal,
        discount: newItem.discount || 0,
        profit: profit,
        buyingPrice: product.price,
      };

      const updatedItems = [...prev.items, item];
      const updatedSale = { ...prev, items: updatedItems };
      setShowAddItem(false);
      setNewItem({ productId: 0, quantity: 1, discount: 0 });
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
    if (!formData.customerName?.trim()) newErrors.push("Customer name is required");
    if (!formData.customerPhone?.trim()) newErrors.push("Customer phone is required");
    if (!formData.saleDate) newErrors.push("Sale date is required");
    if (formData.items.length === 0) newErrors.push("At least one item is required");
    if (formData.paidAmount < 0) newErrors.push("Paid amount cannot be negative");
    if (!formData.paymentMethod) newErrors.push("Payment method is required");
    
    // Check stock for all items
    formData.items.forEach(item => {
      if (item.productId > 0) {
        const availableStock = getAvailableStock(item.productId);
        if (item.quantity > availableStock) {
          newErrors.push(`Insufficient stock for ${item.productName}. Available: ${availableStock}, Requested: ${item.quantity}`);
        }
      }
    });

    // Phone validation for Kenyan numbers
    const phoneRegex = /^(07|01)\d{8}$/;
    if (formData.customerPhone && !phoneRegex.test(formData.customerPhone.replace(/\s/g, ''))) {
      newErrors.push("Phone must start with 07 or 01 and be 10 digits");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSaveBasic = async () => {
    if (!formData) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/sales/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          paymentMethod: formData.paymentMethod,
          saleDate: formData.saleDate,
          paidAmount: formData.paidAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update sale");
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

  const handleSaveWithItems = async () => {
    if (!formData) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Transform items for backend - matching your API structure
      const itemsForBackend = formData.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        discount: item.discount,
        buyingPrice: item.buyingPrice,
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
      window.showToast("Sale updated successfully with items!", "success");
    } catch (err: any) {
      console.error("Error updating sale with items:", err);
      window.showToast(err.message || "Failed to update sale with items", "error");
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
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <input
              type="text"
              value={formData.customerName || ""}
              onChange={(e) => handleChange("customerName", e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
              placeholder="Customer Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              type="tel"
              value={formData.customerPhone || ""}
              onChange={(e) => handleChange("customerPhone", e.target.value)}
              className="border px-3 py-2 rounded-md w-full"
              placeholder="07XXXXXXXX"
            />
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Items</h3>
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              disabled={productsArray.length === 0}
            >
              {showAddItem ? "Cancel" : "+ Add Item"}
              {productsArray.length === 0 && " (No products available)"}
            </button>
          </div>

          {/* Add New Item Form */}
          {showAddItem && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Product *</label>
                  <select
                    value={newItem.productId}
                    onChange={(e) => setNewItem({...newItem, productId: Number(e.target.value)})}
                    className="border px-3 py-2 rounded-md w-full"
                    disabled={productsArray.length === 0}
                  >
                    <option value={0}>Select Product</option>
                    {productsArray.length > 0 ? (
                      productsArray.map(product => (
                        <option 
                          key={product.id} 
                          value={product.id}
                          disabled={!hasSufficientStock(product.id, newItem.quantity || 1)}
                        >
                          {product.itemName} (Ksh{product.sellingPrice})
                        </option>
                      ))
                    ) : (
                      <option value={0} disabled>No products available</option>
                    )}
                  </select>
                  {newItem.productId && newItem.productId > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {getAvailableStock(newItem.productId)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={newItem.productId ? getAvailableStock(newItem.productId) : 0}
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    className="border px-3 py-2 rounded-md w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount (Ksh)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.discount || 0}
                    onChange={(e) => setNewItem({...newItem, discount: Number(e.target.value)})}
                    className="border px-3 py-2 rounded-md w-full"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addNewItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
                    disabled={productsArray.length === 0 || !newItem.productId}
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}

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
                      max={item.productId ? getAvailableStock(item.productId) : 0}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="border px-2 py-1 rounded w-full text-right"
                    />
                  </td>
                  <td className="p-2 text-right">
                    Ksh{item.unitPrice?.toFixed(2)}
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
              onClick={handleSaveBasic}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Basic Info"}
            </button>
            <button
              onClick={handleSaveWithItems}
              disabled={loading || productsArray.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save with Items"}
              {productsArray.length === 0 && " (No products)"}
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
            <li>"Save Basic Info" updates only customer info and payment details</li>
            <li>"Save with Items" updates everything including items (replaces all items)</li>
            <li>Stock is automatically checked - cannot exceed available stock</li>
            <li>When removing items, stock is automatically returned</li>
            <li>Profit is automatically calculated based on item cost prices</li>
            {productsArray.length === 0 && (
              <li className="text-red-500">Warning: No products available. Cannot edit items.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}