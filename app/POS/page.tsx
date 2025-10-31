"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, LogOutIcon } from "lucide-react";
// API types and service
interface InventoryItem {
  id: number;
  itemName: string;
  category: string;
  description: string;
  price: number; // buying price
  stockQuantity: number;
  sellingPrice: number;
  supplier: string;
  sellingUnit: string;
  lengthType?: string;
  piecesPerBox?: number;
  imageUrls: string[];
  variants: { [key: string]: string };
}

interface CartItem {
  variant: any;
  discountAmount: number;
  id: number;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  total: number;
  stock: number;
  buyingPrice: number;
  sellingPrice: number;
  variants: { [key: string]: string };
}

const API_BASE_URL = "http://localhost:8080/api";

const posApi = {
  // Search items
  searchItems: async (keyword: string): Promise<InventoryItem[]> => {
    const response = await fetch(
      `${API_BASE_URL}/items/search?keyword=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) throw new Error("Failed to search items");
    return response.json();
  },
  searchItemsByCategory: async (category: string): Promise<InventoryItem[]> => {
    const response = await fetch(
      `${API_BASE_URL}/items/category/${encodeURIComponent(category)}`
    );
    if (!response.ok) throw new Error("Failed to search items by category");
    return response.json();
  },
  saveSale: async (saleData: any) => {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to save sale");
    return response.json();
  },
  // Get all items
  getItems: async (): Promise<InventoryItem[]> => {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) throw new Error("Failed to fetch items");
    return response.json();
  },
  // Update item stock
  updateItemStock: async (id: number, newStock: number): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/items/${id}/stock?stockQuantity=${newStock}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) throw new Error("Failed to update stock");
  },
};

export default function POSComponent() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "bank">(
    "cash"
  );
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [activeCat, setActiveCat] = useState(0);
  const [cartNote, setCartNote] = useState("");
  const [lastSale, setLastSale] = useState<any>(null); // for reprint

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const hardwareCategories = [
    "All",
    "Building Materials",
    "Tools & Equipment",
    "Plumbing Supplies",
    "Electrical Supplies",
    "Paints & Coatings",
    "Welding Materials",
  ];

  // Load initial products
  useEffect(() => {
    loadInitialProducts();
  }, []);
const validatePhoneNumber = (phone: string) => {
  const regex = /^(07|01)\d{8}$/; // starts with 07 or 01, then 8 digits
  return regex.test(phone);
};
  const loadInitialProducts = async () => {
    try {
      const items = await posApi.getItems();
      setProducts(items);
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Failed to load products");
    }
  };

  // Auto-search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      loadInitialProducts();
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await posApi.searchItems(searchTerm);
        setProducts(results);
      } catch (error) {
        console.error("Error searching products:", error);
        alert("Failed to search products");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  const addToCart = (product: InventoryItem) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stockQuantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  total:
                    item.price * (item.quantity + 1) -
                    ((item.price * (item.quantity + 1)) * item.discount) / 100,
                }
              : item
          )
        );
      } else {
        alert(`Only ${product.stockQuantity} items available in stock`);
      }
    } else {
      if (product.stockQuantity > 0) {
        setCart([
          ...cart,
          {
            id: product.id,
            name: product.itemName,
            price: product.sellingPrice,
            quantity: 1,
            discount: 0,
            total: product.sellingPrice,
            stock: product.stockQuantity,
            discountAmount: 0,
            buyingPrice: product.price,
            sellingPrice: product.sellingPrice,
            variant: product.variants || {},
            variants: {}
          },
        ]);
      } else {
        alert("This product is out of stock");
      }
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    if (newQuantity > item.stock) {
      alert(`Only ${item.stock} items available in stock`);
      return;
    }
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    setCart(
      cart.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity: newQuantity,
              total:
                i.price * newQuantity -
                ((i.price * newQuantity) * i.discount) / 100,
            }
          : i
      )
    );
  };

  const updateDiscount = (id: number, discountAmount: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          // cap discount to profit margin
          const maxDiscount = item.sellingPrice - item.buyingPrice;
          const appliedDiscount = Math.min(discountAmount, maxDiscount);
          const discountedTotal =
            (item.sellingPrice - appliedDiscount) * item.quantity;

          return {
            ...item,
            discountAmount: appliedDiscount,
            total: discountedTotal,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const totalAmount = calculateTotal();
  const changeAmount = amountPaid - totalAmount;

  const handleCategoryClick = async (index: number, category: string) => {
    setActiveCat(index);
    if (category === "All") {
      loadInitialProducts();
      return;
    }
    try {
      const data = await posApi.searchItemsByCategory(category);
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Robust helpers for printing (handles different backend field names)
  const getSaleValues = (sale: any) => {
    const saleDate =
      sale?.saleDate || sale?.createdAt || sale?.timestamp || new Date().toISOString();
    const items = sale?.items || sale?.saleItems || [];
    const total =
      sale?.totalAmount ?? sale?.total ?? sale?.grandTotal ?? totalAmount;
    const paid =
      sale?.paidAmount ?? sale?.amountPaid ?? (total + (sale?.change ?? sale?.changeAmount ?? 0));
    const change = sale?.change ?? sale?.changeAmount ?? (paid - total);
    const note = sale?.note ?? cartNote ?? "";

    return { saleDate, items, total, paid, change, note };
  };

  const printReceipt = (sale: any) => {
    const receiptWindow = window.open("", "PRINT", "height=600,width=400");
    if (!receiptWindow) return;

    const { saleDate, items, total, paid, change, note } = getSaleValues(sale);
    const createdAt = new Date(saleDate).toLocaleString();

    receiptWindow.document.write(
      '<html><head><title>Receipt</title></head><body>'
    );

    // Header (kept your original style)
    receiptWindow.document.write(
      `<h1 style="text-align:center;">Munyaka HardWare</h1>
       <h3 style="text-align:center;">Bei niya Hussler</h3>
       <p style="text-align:center;">phone: 07xxxxxxx</p>`
    );

    receiptWindow.document.write(`<h2 style="text-align:center;">Sales Receipt</h2>`);
    receiptWindow.document.write(`<p><b>Date/Time:</b> ${createdAt}</p>`);
    if (sale?.customerName) receiptWindow.document.write(`<p><b>Customer:</b> ${sale.customerName}</p>`);
    if (note) receiptWindow.document.write(`<p><b>Note:</b> ${note}</p>`);

    receiptWindow.document.write("<hr/>");
    receiptWindow.document.write(
      '<table border="1" cellspacing="0" cellpadding="4" width="100%">'
    );
    receiptWindow.document.write(
      "<tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>"
    );
items.forEach((item: any) => {
  const name = item.productName || item.name || item.itemName || "-";
  const qty = item.quantity ?? 1;
  const unit = item.unitPrice ?? item.price ?? 0;
  const line = item.lineTotal ?? item.total ?? unit * qty;

  // Support both "variant" and "variants"
  const v = item.variant || item.variants;
  const variant =
    v && (v.Size || v.Gauge) ? ` (${v.Size || ""}${v.Size && v.Gauge ? "/" : ""}${v.Gauge || ""})` : "";

  receiptWindow.document.write(
    `<tr>
      <td>${name}${variant}</td>
      <td>${qty}</td>
      <td>KES ${Number(unit).toFixed(2)}</td>
      <td>KES ${Number(line).toFixed(2)}</td>
    </tr>`
  );
});


    receiptWindow.document.write("</table>");
    receiptWindow.document.write(`<p><b>Total:</b> KES ${Number(total).toFixed(2)}</p>`);
    receiptWindow.document.write(`<p><b>Paid:</b> KES ${Number(paid).toFixed(2)}</p>`);
    receiptWindow.document.write(`<p><b>Change:</b> KES ${Number(change).toFixed(2)}</p>`);
    receiptWindow.document.write(`<p><b>VAT:</b> KES hakuna</p>`);
    receiptWindow.document.write(
      `<p style="text-align:center;margin-top:20px;">Thank you for shopping with us!</p>
       <p style="text-align:center;margin-top:0px;">Disclaimer: This is a computer-generated receipt and does not require a signature.</p>
       <p style="text-align:center;margin-top:0px;">Goods sold cannot be returned.</p>
       <p style="text-align:center;margin-top:0px;">VAT registered: No</p>
       <p style="text-align:center;margin-top:0px;">Developed by one and only bwanamaina2010@gmail.com</p>`
    );

    receiptWindow.document.write("</body></html>");
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  const printInvoice = (sale: any) => {
    const win = window.open("", "PRINT", "height=600,width=400");
    if (!win) return;

    const { saleDate, items, total, paid, change, note } = getSaleValues(sale);
    const createdAt = new Date(saleDate).toLocaleString();

    win.document.write('<html><head><title>Invoice</title></head><body>');
    // Header (kept consistent)
    win.document.write(
      `<h1 style="text-align:center;">Munyaka HardWare</h1>
       <h3 style="text-align:center;">Bei niya Hussler</h3>
       <p style="text-align:center;">phone: 07xxxxxxx</p>`
    );
    win.document.write("<h2 style='text-align:center;'>INVOICE</h2>");
    win.document.write(`<p><b>Date/Time:</b> ${createdAt}</p>`);
    if (sale?.customerName) win.document.write(`<p><b>Customer:</b> ${sale.customerName}</p>`);
    if (sale?.customerPhone) win.document.write(`<p><b>Phone:</b> ${sale.customerPhone}</p>`);
    if (note) win.document.write(`<p><b>Note:</b> ${note}</p>`);

    win.document.write("<hr/>");
    win.document.write('<table border="1" cellspacing="0" cellpadding="4" width="100%">');
    win.document.write("<tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>");

    items.forEach((item: any) => {
      const name = item.productName || item.name || item.itemName || "-";
      const qty = item.quantity ?? 1;
      const unit = item.unitPrice ?? item.price ?? 0;
      const line = item.lineTotal ?? item.total ?? unit * qty;

      win.document.write(
        `<tr>
          <td>${name}</td>
          <td>${qty}</td>
          <td>KES ${Number(unit).toFixed(2)}</td>
          <td>KES ${Number(line).toFixed(2)}</td>
        </tr>`
      );
    });

    win.document.write("</table>");
    win.document.write(`<p><b>Total:</b> KES ${Number(total).toFixed(2)}</p>`);
    win.document.write(`<p><b>Paid:</b> KES ${Number(paid).toFixed(2)}</p>`);
    win.document.write(`<p><b>Balance Due:</b> KES ${Number(-change).toFixed(2)}</p>`);
    win.document.write("</body></html>");

    win.document.close();
    win.focus();
    win.print();
  };

 // Helper: phone validator

const processPayment = async () => {
  const total = calculateTotal();
  const paid = amountPaid || 0;
  const change = paid - total; // negative => balance due

  // ===== VALIDATIONS =====
  if (paymentMethod === "mpesa" && !mpesaNumber.trim()) {
    alert("Please enter M-Pesa phone number");
    return;
  }

  if (paymentMethod === "bank" && !bankReference.trim()) {
    alert("Please enter bank reference number");
    return;
  }

  // Require customer info only if underpaid (change < 0)
  if (change < 0) {
    if (!customerName.trim()) {
      alert("Customer name is required if balance is due");
      return;
    }
    if (!validatePhoneNumber(customerPhone)) {
      alert(
        "Please enter a valid customer phone number (must start with 07 or 01 and be 10 digits)"
      );
      return;
    }
  }

  // ===== PROCESSING =====
  setIsProcessing(true);

  try {
    for (const item of cart) {
      const newStock = item.stock - item.quantity;
      await posApi.updateItemStock(item.id, newStock);
    }

    // Save sale to backend
    const saleData = {
      customerName,
      customerPhone,
      paymentMethod,
      totalAmount: total,
      amountPaid: paid,
      changeAmount: change,
      note: cartNote,
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discountAmount: item.discountAmount || 0,
        total: item.price * item.quantity - (item.discountAmount || 0),
      })),
    };

    const savedSale = await posApi.saveSale(saleData);
    setLastSale(savedSale);

    // Print invoice if balance due, else receipt
    if (change < 0) {
      printInvoice(savedSale);
    } else {
      printReceipt(savedSale);
    }

    alert(
      `Payment processed successfully!${
        change > 0 ? ` Change: KES ${change.toFixed(2)}` : ""
      }`
    );

    // Reset UI (keep lastSale so reprint works)
    setCart([]);
    setMpesaNumber("");
    setBankReference("");
    setCustomerName("");
    setCustomerPhone("");
    setAmountPaid(0);
    setCartNote("");
  } catch (error) {
    console.error("Error processing payment:", error);
    alert("Failed to process payment");
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <div className=" lg:p-2">
        <div className="mb-4 w-full justify-between flex">
           <Link
      href="/dashboard"
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition underline"
    >
      <ArrowLeft className="w-5 h-5" />
      <span>Go back to Dashboard</span>
    </Link>
        <span>   <div>
      <Link href="/" className="flex text-indigo-600 items-center gap-2  font-medium hover:text-blue-600 transition">
        <LogOutIcon className="w-5 h-5" />
        <span>Logout</span>
      </Link>
    </div></span>
        </div>
      {/* Outer container */}
      <div className="bg-white  rounded-2xl   grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Left side: Products */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Search + Categories */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {hardwareCategories.map((c, index) => (
                <button
                  key={index}
                  onClick={() => handleCategoryClick(index, c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCat === index
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1">
            {isSearching ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 max-h-[28rem] overflow-y-auto pr-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-xl p-3 cursor-pointer hover:shadow-md transition bg-gray-50"
                    onClick={() => addToCart(product)}
                  >
                    <div className="h-20 bg-white rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {product.imageUrls.length > 0 ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.itemName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {product.itemName} {product.variants?.Size}/
                      {product.variants?.Gauge}
                    </p>
                    <p className="text-xs text-gray-600">
                      KES {product.sellingPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Stock: {product.stockQuantity}
                    </p>
                  </div>
                ))}

                {products.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No products found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Cart */}
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart</h2>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto max-h-[20rem] border rounded-lg bg-white">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-2 py-2 text-left text-xs text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-2 py-2 text-left text-xs text-gray-500 uppercase">
                      Disc
                    </th>
                    <th className="px-2 py-2 text-left text-xs text-gray-500 uppercase">
                      Total
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cart.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1">{item.name}{item.variant?.Size}/{item.variant?.Gauge}</td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-14 px-1 py-0.5 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          max={item.price * item.quantity}
                          value={item.discountAmount || 0}
                          onChange={(e) =>
                            updateDiscount(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16 px-1 py-0.5 border rounded text-xs"
                        />
                      </td>
                      <td className="px-2 py-1 font-medium text-gray-700">
                        KES{" "}
                        {(
                          item.price * item.quantity -
                          (item.discountAmount || 0)
                        ).toFixed(2)}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cart note */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={cartNote}
              onChange={(e) => setCartNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="Add a note about this sale..."
            />
          </div>

          {/* Totals + payment */}
          {cart.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-base font-semibold">
                <span>Total:</span>
                <span>KES {totalAmount.toFixed(2)}</span>
              </div>

              {/* Customer Info */}        
{/* Show Customer Info ONLY if balance is due */}
{changeAmount < 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <input
      type="text"
      placeholder="Customer Name"
      value={customerName}
      onChange={(e) => setCustomerName(e.target.value)}
      className={`px-3 py-2 border rounded-md text-sm ${
        !customerName.trim() ? "border-red-500" : "border-gray-300"
      }`}
    />

   <input
  type="tel"
  placeholder="07XX XXX XXX"
  value={customerPhone}
  onChange={(e) => {
    // only allow digits and cut at 10 characters
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setCustomerPhone(val);
  }}
  maxLength={10}
  className={`px-3 py-2 border rounded-md text-sm ${
    !validatePhoneNumber(customerPhone)
      ? "border-red-500"
      : "border-gray-300"
  }`}
/>
  </div>
)}



              {/* Payment Method */}
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "cash" | "mpesa" | "bank")
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
              </select>

              {/* Amount Paid */}
              <div>
                <input
                  type="number"
                  placeholder="Amount Paid (KES)"
                  value={amountPaid}
                  onChange={(e) =>
                    setAmountPaid(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                {changeAmount > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Change: KES {changeAmount.toFixed(2)}
                  </p>
                )}
                {changeAmount < 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Balance: KES {(-changeAmount).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Extra fields */}
              {paymentMethod === "mpesa" && (
                <input
                  type="tel"
                  placeholder="M-Pesa Phone Number"
                  value={mpesaNumber}
                  onChange={(e) => setMpesaNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              )}
              {paymentMethod === "bank" && (
                <input
                  type="text"
                  placeholder="Bank Reference Number"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              )}

              {/* Process Payment */}
              <button
                onClick={processPayment}
                disabled={
                  isProcessing ||
                  cart.length === 0 ||
                  (changeAmount < 0 &&
                    (!customerName.trim() || !customerPhone.trim()))
                }
                className={`w-full py-3 rounded-lg text-white font-semibold transition ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : `Process Payment (KES ${totalAmount.toFixed(2)})`}
              </button>

              {/* Reprint */}
              {lastSale && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => printReceipt(lastSale)}
                    className="py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    Reprint Receipt
                  </button>
                  <button
                    onClick={() => printInvoice(lastSale)}
                    className="py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Reprint Invoice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
