"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, EyeIcon, PencilIcon, TrashIcon, CalendarIcon, UserIcon, CurrencyDollarIcon, CreditCardIcon, ChartBarIcon } from "@heroicons/react/24/outline";

//  Purchase Type
type Purchase = {
  id: number;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  creditor: boolean;
  items: {
    id: number;
    productName: string;
    price: number;
    quantity: number;
    total: number;
  }[];
};

//  Product Type
type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

//  Supplier Type
type Supplier = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
};

const API_BASE_URL = "http://localhost:8080/api/purchases";
const SUPPLIERS_API_URL = "http://localhost:8080/api/suppliers";

export default function Purchases() {
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);

  //  Form state for editing
  const [editSupplier, setEditSupplier] = useState("");
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [editStatus, setEditStatus] = useState("Pending");

  //  Form state for new purchase
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{product: Product, quantity: number}[]>([]);
  const [newAmountPaid, setNewAmountPaid] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Add this function to handle price changes
  const handlePriceChange = (index: number, price: number) => {
    if (price < 0.01) return;
    
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].product.price = price;
    setSelectedProducts(updatedProducts);
  };

  const handleAddProduct = (product: Product, quantity: number = 1) => {
    // Check if product is already added
    const existingIndex = selectedProducts.findIndex(p => p.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += quantity;
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts([...selectedProducts, { product, quantity }]);
    }
    
    setShowProductDropdown(false);
    setProductSearch("");
  };

  //  Fetch purchases
  useEffect(() => {
    fetchPurchases();
  }, [search, status, startDate, endDate, currentPage]);

  //  Fetch suppliers and products for new purchase form
  useEffect(() => {
    if (isNewOpen) {
      fetchSuppliers();
      
    }
  }, [isNewOpen]);

  const fetchPurchases = async () => {
    try {
      let url = `${API_BASE_URL}/filter?page=${currentPage}&size=10`;
      if (search) url += `&supplier=${encodeURIComponent(search)}`;
      if (status !== "All") url += `&status=${status}`;
      if (startDate) url += `&start=${startDate}`;
      if (endDate) url += `&end=${endDate}`;

      const res = await fetch(url);
      const data = await res.json();

      setPurchases(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Error fetching purchases:", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(SUPPLIERS_API_URL);
      const data = await res.json();
      setSuppliers(data.content ?? []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };



  //  View Handler
  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsViewOpen(true);
  };

  //  Edit Handler
  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditSupplier(purchase.supplierName);
    setEditAmountPaid(purchase.amountPaid);
    setEditStatus(purchase.status);
    setIsEditOpen(true);
  };

  //  Delete Handler
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
      fetchPurchases(); // refresh after delete
    } catch (err) {
      console.error("Error deleting purchase:", err);
    }
  };

  //  Save Edited Purchase

  //  Remove Product from New Purchase
  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  //  Update Product Quantity
  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = quantity;
    setSelectedProducts(updatedProducts);
  };

  //  Calculate Total Amount
  const calculateTotalAmount = () => {
    return selectedProducts.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  //  Calculate Balance Due
  const calculateBalanceDue = () => {
    return calculateTotalAmount() - newAmountPaid;
  };

  const determineStatus = () => {
    const total = calculateTotalAmount();
    if (newAmountPaid === 0) return "Pending";
    if (newAmountPaid < total) return "Partial";
    return "Completed";
  };

  const handleSaveNewPurchase = async () => {
    if (!selectedSupplier) {
      window.showToast("Please select a supplier", "error");
      return;
    }

    if (selectedProducts.length === 0) {
      window.showToast("Please add at least one product", "error");
      return;
    }

    if (newAmountPaid > calculateTotalAmount()) {
      window.showToast("Paid amount cannot exceed total amount!", "error");
      return;
    }

    const newPurchase = {
  supplierName: selectedSupplier?.name,
  supplierPhone: selectedSupplier?.phone,
  supplierEmail:selectedSupplier?.email,
  purchaseDate: newPurchaseDate,
  totalAmount: calculateTotalAmount(),
  amountPaid: newAmountPaid,
  balanceDue: calculateBalanceDue(),
  status: determineStatus(),
  creditor: calculateBalanceDue() > 0,
  items: selectedProducts.map(item => ({
    productName: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    total: item.product.price * item.quantity
  }))
};
    try {
      await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPurchase),
      });

      setIsNewOpen(false);
      resetNewPurchaseForm();
      fetchPurchases(); // refresh list
    } catch (err) {
      console.error("Error creating purchase:", err);
    }
  };

  const resetNewPurchaseForm = () => {
    setSelectedSupplier(null);
    setSelectedProducts([]);
    setNewAmountPaid(0);
    setNewPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Partial": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-red-100 text-red-800 border-red-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Management</h1>
              <p className="text-gray-600 mt-2">Manage and track all your purchase orders</p>
            </div>
            <button 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              onClick={() => setIsNewOpen(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Purchase
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Purchases</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Search by supplier name..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>All</option>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Partial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purchase</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">#{purchase.id}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {purchase.purchaseDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
  <div className="font-medium text-gray-900">{purchase.supplierName}</div>
</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          Total: <span className="font-semibold ml-1">ksh{purchase.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCardIcon className="h-4 w-4 mr-1" />
                          Paid: <span className="font-semibold ml-1">ksh{purchase.amountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          Balance: <span className="font-semibold ml-1">ksh{purchase.balanceDue.toFixed(2)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleView(purchase)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(purchase)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          title="Edit purchase"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(purchase.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete purchase"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing page {currentPage + 1} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewOpen && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Purchase Details</h2>
                  <p className="text-blue-100 text-sm">Purchase #{selectedPurchase.id}</p>
                </div>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Supplier</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPurchase.supplierName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Date</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedPurchase.purchaseDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">Ksh{selectedPurchase.totalAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">Ksh{selectedPurchase.amountPaid.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Amount Paid</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">Ksh{selectedPurchase.balanceDue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Balance Due</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Purchased</h3>
                <div className="space-y-3">
                  {selectedPurchase.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{item.productName}</span>
                      <span className="text-gray-600">
                        {item.quantity} × kes{(item.total / item.quantity).toFixed(2)} = <strong>Ksh{item.total.toFixed(2)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => setIsViewOpen(false)} 
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
     {isEditOpen && selectedPurchase && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto my-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Edit Purchase #{selectedPurchase.id}</h2>
        <button
          onClick={() => setIsEditOpen(false)}
          className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Supplier & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
            <select
              value={editSupplier}
              onChange={(e) => setEditSupplier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Date</label>
            <input
              type="date"
              defaultValue={selectedPurchase.purchaseDate}
              onChange={(e) =>
                setSelectedPurchase(prev => prev ? {...prev, purchaseDate: e.target.value} : prev)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchased Items</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 font-medium text-sm text-gray-700">
              <div className="col-span-4">Item</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2 text-center">Action</div>
            </div>
            {selectedPurchase.items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border-t">
                <div className="col-span-4">
                  <input
                    value={item.productName}
                    onChange={(e) => {
                      const updated = [...selectedPurchase.items];
                      updated[idx].productName = e.target.value;
                      setSelectedPurchase({...selectedPurchase, items: updated});
                    }}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div className="col-span-2 text-center">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const updated = [...selectedPurchase.items];
                      updated[idx].quantity = qty;
                      updated[idx].total = qty * updated[idx].price;
                      setSelectedPurchase({...selectedPurchase, items: updated});
                    }}
                    className="w-full border rounded px-2 py-1 text-center"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      const updated = [...selectedPurchase.items];
                      updated[idx].price = price;
                      updated[idx].total = price * updated[idx].quantity;
                      setSelectedPurchase({...selectedPurchase, items: updated});
                    }}
                    className="w-full border rounded px-2 py-1 text-right"
                  />
                </div>
                <div className="col-span-2 text-right font-semibold">
                  ksh{(item.price * item.quantity).toFixed(2)}
                </div>
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => {
                      const updated = [...selectedPurchase.items];
                      updated.splice(idx, 1);
                      setSelectedPurchase({...selectedPurchase, items: updated});
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid (ksh)</label>
            <input
              type="number"
              value={editAmountPaid}
              onChange={(e) => setEditAmountPaid(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount</label>
            <p className="px-4 py-3 bg-gray-100 rounded-xl">
              ksh{selectedPurchase.items.reduce((t, i) => t + i.total, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Balance Due</label>
            <p className="px-4 py-3 bg-gray-100 rounded-xl">
              ksh{(
                selectedPurchase.items.reduce((t, i) => t + i.total, 0) - editAmountPaid
              ).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={() => setIsEditOpen(false)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const total = selectedPurchase.items.reduce((t, i) => t + i.total, 0);
              if (editAmountPaid > total) {
                window.showToast("Amount Paid cannot exceed Total", "error");
                return;
              }
              const balance = total - editAmountPaid;
              const status =
                editAmountPaid === 0
                  ? "Pending"
                  : editAmountPaid < total
                  ? "Partial"
                  : "Completed";

              const updatedPurchase = {
                ...selectedPurchase,
                supplierName: editSupplier,
                amountPaid: editAmountPaid,
                totalAmount: total,
                balanceDue: balance,
                status,
              };

              await fetch(`${API_BASE_URL}/${selectedPurchase.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedPurchase),
              });

              setIsEditOpen(false);
              fetchPurchases();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* New Purchase Modal */}
      {isNewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto my-8 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New Purchase</h2>
                  <p className="text-blue-100 text-sm mt-1">Add purchase details and items</p>
                </div>
                <button
                  onClick={() => {
                    setIsNewOpen(false);
                    resetNewPurchaseForm();
                  }}
                  className="text-white hover:bg-blue-500 p-2 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Purchase Date
                        </span>
                      </label>
                      <input
                        type="date"
                        value={newPurchaseDate}
                        onChange={(e) => setNewPurchaseDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        Supplier
                      </span>
                    </label>
                    <select
                      value={selectedSupplier?.id || ""}
                      onChange={(e) => {
                        const supplierId = parseInt(e.target.value);
                        const supplier = suppliers.find(s => s.id === supplierId) || null;
                        setSelectedSupplier(supplier);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add Items Section */}
                <div className="mb-8">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-blue-600" />
                        Add Commodities/Items
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Search for products and add them to your purchase</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-2">
                          Search Commodities
                        </label>
                        <div className="relative">
                          <input
                            id="product-search"
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onFocus={() => setShowProductDropdown(true)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Type to search commodities..."
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            id="quantity"
                            type="number"
                            
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) )}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder=""
                          />
                        </div>

                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                           Unit Price (ksh)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              
                            </div>
                            <input
                              id="price"
                              type="number"
                              
                              value={newItemPrice}
                              onChange={(e) => setNewItemPrice(parseFloat(e.target.value))}
                              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                onClick={() => {
                                  setProductSearch(product.name);
                                  setNewItemPrice(product.price);
                                  setShowProductDropdown(false);
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{product.name}</span>
                                  <span className="text-green-600 font-semibold">KES{product.price.toFixed(2)}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (!productSearch.trim()) {
                            window.showToast("Please enter a commodity name", "error");
                            return;
                          }
                          if (newItemQuantity <= 0) {
                            window.showToast("Please enter a valid quantity", "error");
                            return;
                          }
                          if (newItemPrice <= 0) {
                            window.showToast("Please enter a valid price", "error");
                            return;
                          }
                          
                          const newProduct = {
                            id: Date.now(),
                            name: productSearch,
                            price: newItemPrice,
                            stock: 0
                          };
                          
                          handleAddProduct(newProduct, newItemQuantity);
                          setProductSearch("");
                          setNewItemQuantity(1);
                          setNewItemPrice(0);
                        }}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <PlusIcon className="w-5 h-5" />
                          Add Item to Purchase
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Items Table */}
                {selectedProducts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-green-600" />
                      Purchased Items ({selectedProducts.length})
                    </h3>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-semibold text-sm text-gray-700">
                        <div className="col-span-5">Item</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-right">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                        <div className="col-span-1 text-center">Action</div>
                      </div>
                      
                      <div className="divide-y divide-gray-200">
                        {selectedProducts.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                            <div className="col-span-5 font-medium text-gray-900">{item.product.name}</div>
                            
                            <div className="col-span-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="col-span-2">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">ksh</span>
                                </div>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.product.price}
                                  onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            
                            <div className="col-span-2 text-right font-semibold text-green-600">
                              Ksh{(item.product.price * item.quantity).toFixed(2)}
                            </div>
                            
                            <div className="col-span-1 text-center">
                              <button
                                onClick={() => handleRemoveProduct(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">Ksh{calculateTotalAmount().toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Total Amount</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">Ksh{newAmountPaid.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Amount Paid</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${
                            calculateBalanceDue() > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            Ksh{calculateBalanceDue().toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Balance Due</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount Paid (ksh)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newAmountPaid}
                        onChange={(e) => setNewAmountPaid(parseFloat(e.target.value) )}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                        determineStatus() === 'Completed' ? 'bg-green-100 text-green-800' :
                        determineStatus() === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                        Status: {determineStatus()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button 
                    onClick={() => {
                      setIsNewOpen(false);
                      resetNewPurchaseForm();
                    }} 
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveNewPurchase} 
                    disabled={selectedProducts.length === 0 || !selectedSupplier}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Purchase
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}