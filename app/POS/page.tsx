"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, LogOutIcon } from "lucide-react";

// API types and service
interface VariantDetails {
  Size?: string;
  Gauge?: string;
}
interface Item {
   variant?: VariantDetails;
  variants?: VariantDetails;
  productName?: string;
  name?: string;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  lineTotal?: number;
  total?: number;
}
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
  variant: { Size?: string; Gauge?: string; [key: string]: string | undefined };
  discountAmount: number;
  id: number;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  soldAs: string;
  total: number;
  stock: number;
  buyingPrice: number;
  sellingPrice: number;
  variants: { [key: string]: string };
}

interface PaginatedResponse {
  content: InventoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
  saveSale: async (saleData: unknown) => {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    if (!response.ok) throw new Error("Failed to save sale");
    return response.json();
  },
  // Get all items with pagination
  getItems: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }
    
    const url = `${API_BASE_URL}/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
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
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [activeCat, setActiveCat] = useState(0);
  const [cartNote, setCartNote] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null); // for reprint

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  useEffect(() => {
    loadInitialProducts();
  }, [itemsPerPage, currentPage]);

  const loadInitialProducts = async () => {
    try {
      const response = await posApi.getItems({
        page: currentPage - 1,
        size: itemsPerPage
      });
      setProducts(response.content);
      setTotalItems(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  // Load products when page changes
  useEffect(() => {
    if (searchTerm.trim() === "" && activeCat === 0) {
      loadProducts();
    }
  }, [currentPage, itemsPerPage]);

  const loadProducts = async () => {
    try {
      const response = await posApi.getItems({
        page: currentPage - 1,
        size: itemsPerPage
      });
      setProducts(response.content);
      setTotalItems(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

const validatePhoneNumber = (phone: string) => {
  const regex = /^(07|01)\d{8}$/; // starts with 07 or 01, then 8 digits
  return regex.test(phone);
};

  // Auto-search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      if (activeCat === 0) {
        loadProducts();
      }
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await posApi.searchItems(searchTerm);
        setProducts(results);
        // Reset pagination for search results
        setCurrentPage(1);
        setTotalPages(0);
      } catch (err) {
        window.showToast("Failed to search products", "error");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, activeCat, loadProducts]);

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
        window.showToast(`Only ${product.stockQuantity} items available in stock`, "error");
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
            soldAs: product.sellingUnit,
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
        window.showToast("This product is out of stock", "error");
      }
    }
  };

 const updateQuantity = (id: number, newQuantity: number) => {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  // prevent exceeding stock
  if (newQuantity > item.stock) {
    window.showToast(`Only ${item.stock} items available in stock`, "error");
    return;
  }

  // if quantity is 0 or below, remove item
  if (newQuantity <= 0) {
    removeFromCart(id);
    return;
  }

  // update item
  setCart(
    cart.map((i) =>
      i.id === id
        ? {
            ...i,
            quantity: parseFloat(newQuantity.toFixed(2)), // keep decimals neat
            total:
              parseFloat(
                (i.price * newQuantity -
                  ((i.price * newQuantity) * i.discount) / 100).toFixed(2)
              ),
          }
        : i
    )
  );
};


  const updateDiscount = (id: number, discountAmount: number) => {
  setCart(
    cart.map((item) => {
      if (item.id === id) {
        // Maximum discount = 5% of selling price per unit
        const maxAllowedDiscount = item.sellingPrice * 0.05;

        if (discountAmount > maxAllowedDiscount * item.quantity) {
          window.showToast(`Discount cannot exceed 5% of the selling price (KES ${maxAllowedDiscount.toFixed(2)} per item)`, "error");
          discountAmount = maxAllowedDiscount * item.quantity;
        }

        const discountedTotal =
          (item.sellingPrice * item.quantity) - discountAmount;

        return {
          ...item,
          discountAmount,
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
    setCurrentPage(1); // Reset to first page when changing category
    
    if (category === "All") {
      loadProducts();
      return;
    }
    try {
      const data = await posApi.searchItemsByCategory(category);
      setProducts(data);
      setTotalPages(0); // No pagination for category searches
    } catch (err) {
      console.error(err);
    }
  };

  interface Sale {
      customerName?: string;
      saleItems?: string[];
      saleDate?: string;
      createdAt?: string;
      timestamp?: string;
      items?: Item[];
      totalAmount?: number;
      total?: number;
      grandTotal?: number;
      paidAmount?: number;
      amountPaid?: number;
      change?: number;
      changeAmount?: number;
      note?: string;
  }

  // Robust helpers for printing (handles different backend field names)
  const getSaleValues = (sale: Sale) => {
    const saleDate =
      sale?.saleDate || sale?.createdAt || sale?.timestamp || new Date().toISOString();
    const items = (sale)?.items || (sale)?.saleItems || [];
    const total =
      (sale)?.totalAmount ?? (sale )?.total ?? (sale )?.grandTotal ?? totalAmount;
    const paid =
      (sale)?.paidAmount ?? (sale)?.amountPaid ?? (total + ((sale)?.change ?? (sale)?.changeAmount ?? 0));
    const change = (sale)?.change ?? (sale)?.changeAmount ?? (paid - total);
    const note = (sale)?.note ?? cartNote ?? "";

    return { saleDate, items, total, paid, change, note };
  };

  const printReceipt = (sale: Sale) => {
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
       <h3 style="text-align:center;"></h3>
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
items.forEach((item: Item) => {
  const name = item.productName || item.name || item.itemName || "-";
  const qty = item.quantity ?? 1;
  const unit = item.unitPrice ?? item.price ?? 0;
  const line = item.lineTotal ?? item.total ?? unit * qty;

  // Support both "variant" and "variants"
  const v = item.variant || item.variants ;

const variant =
  v && (v.Size || v.Gauge)
    ? ` (${v.Size ?? ""}${v.Size && v.Gauge ? "/" : ""}${v.Gauge ?? ""})`
    : "";

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

  const printInvoice = (sale: {
    customerName?: string;
    customerPhone?: string;
    saleDate?: string;
    createdAt?: string;
    timestamp?: string;
    items?: Item[];
    totalAmount?: number;
    total?: number;
    grandTotal?: number;
    paidAmount?: number;
    amountPaid?: number;
    change?: number;
    changeAmount?: number;
    note?: string;
  }) => {
    const win = window.open("", "PRINT", "height=600,width=400");
    if (!win) return;

    const { saleDate, items, total, paid, change, note } = getSaleValues(sale);
    const createdAt = new Date(saleDate).toLocaleString();

    win.document.write('<html><head><title>Invoice</title></head><body>');
    // Header (kept consistent)
    win.document.write(
      `<h1 style="text-align:center;">Munyaka HardWare</h1>
       
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

    items.forEach((item: { 
      productName?: string;
      name?: string;
      itemName?: string;
      quantity?: number;
      unitPrice?: number;
      price?: number;
      lineTotal?: number;
      total?: number;
    }) => {
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
  const change = paid - total; 
  
  // ===== VALIDATIONS =====
  
  // Require customer info only if underpaid (change < 0)
  if (change < 0) {
    
    if (!customerName.trim()) {
      window.showToast("Customer name is required if balance is due", "error");
      return;
    }
    if (!validatePhoneNumber(customerPhone)) {
      window.showToast("Valid customer phone number is required if balance is due", "error");
      return;
    }
  }

  // ===== PROCESSING =====
  setIsProcessing(true);

  try {
    let balanceDue = 0;
    if (change < 0) {
       balanceDue = -change;
    }
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
      changeAmount: balanceDue,
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

    window.showToast(`Payment processed successfully!${change > 0 ? ` Change: KES ${change.toFixed(2)}` : ""}`, "success");

    // Reset UI (keep lastSale so reprint works)
    setCart([]);
    
    setCustomerName("");
    setCustomerPhone("");
    setAmountPaid(0);
    setCartNote("");
  } catch (error) {
    console.error("Error processing payment:", error);

    window.showToast(`Payment failed!${change > 0 ? ` Change: KES ${change.toFixed(2)}` : ""}`, "error");
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3 max-h-[28rem] overflow-y-auto pr-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="flex justify-between items-center bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                    >
                      {/* Left Section */}
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-[0.95rem] font-semibold text-gray-900">
                          {product.itemName}  
                        </p>
       <div className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
    Bei ni ya: {product.sellingUnit.toUpperCase()}
</div>
                        <p className="text-xs text-gray-500 italic">
                          {product.category || 'Uncategorized'}
                        </p>

                        {(product.variants?.Size || product.variants?.Gauge) && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium text-gray-700">Variant:</span>{' '}
                            {product.variants?.Size && `Size ${product.variants.Size}`}{' '}
                            {product.variants?.Gauge && `| Gauge ${product.variants.Gauge}`}
                          </p>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-700">
                          KES {product.sellingPrice.toFixed(2)}
                        </p>
                        
                        <p
                          className={`text-xs font-semibold ${
                            product.stockQuantity <= 5
                              ? 'text-red-500'
                              : product.stockQuantity <= 15
                              ? 'text-yellow-500'
                              : 'text-green-600'
                          }`}
                        >
                          {product.stockQuantity <= 5
                            ? ` Reorder  ${product.stockQuantity}`
                            : `Stock: ${product.stockQuantity}`}
                        </p>
                      </div>
                    </div>
                  ))}

                  {products.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                      No products found
                    </div>
                  )}
                </div>

                {/* Pagination Controls - Only show for "All" category */}
                {totalPages > 1 && activeCat === 0 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700">
                          Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${
                          currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                          </span> of{' '}
                          <span className="font-medium">{totalItems}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>

                          {/* Page numbers - show limited pages */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right side: Cart */}
        <div className="bg-gray-50 rounded-2xl  flex flex-col">
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
                                               <div className="flex "> 
                                                <input
                                                          type="number"
                                                          step="0.25"
                                                          min="0.25"
                                                          value={item.quantity}
                                                          onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value))}
                                                          className="w-20 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring focus:ring-blue-300"
                                                        />
                                                        <p>{item.soldAs}</p>

                        </div>


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
                    Balance: KES {"-" + (changeAmount).toFixed(2)}
                  </p>
                )}
              </div>

           

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