"use client";
import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import ViewSaleModal from "../components/ViewSaleModal";
import EditSaleModal from "../components/EditSaleModal";
import ReturnSaleModal from "../components/ReturnSaleModal";

const API_BASE_URL = "http://localhost:8080/api/sales";

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
  paidAmount: number;
  balanceDue?: number;
  profit?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items: SaleItem[];
}

interface Summary {
  totalSales: number;
  totalAmount: number;
  profit: number;
  expenditure: number;
  deviation: number;
}

export default function SalesDashboard() {
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customerFilter, setCustomerFilter] = useState("");
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [activePeriod, setActivePeriod] = useState("");
const [viewSale, setViewSale] = useState<Sale | null>(null);
const [editSale, setEditSale] = useState<Sale | null>(null);
const [returnSaleId, setReturnSaleId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);

  const setPeriod = (period: string) => {
    const now = dayjs();
    let start = now;
    let end = now;

    switch (period) {
      case "today":
        start = now.startOf("day");
        end = now.endOf("day");
        break;
      case "week":
        start = now.startOf("week");
        end = now.endOf("week");
        break;
      case "month":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "year":
        start = now.startOf("year");
        end = now.endOf("year");
        break;
    }

    setStartDate(start.format("YYYY-MM-DD"));
    setEndDate(end.format("YYYY-MM-DD"));
    setActivePeriod(period);
    setCurrentPage(0); // Reset to first page when changing period
  };

// Run once on mount → fetch all data
useEffect(() => {
  fetchAllData();
}, [currentPage]);

// Run when filters/pagination change → fetch filtered data
useEffect(() => {
  if (startDate && endDate) {
    fetchData();
  }
}, [startDate, endDate, currentPage]);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/filter?page=${currentPage}&size=${pageSize}`;
      
      // Only add date filters if dates are selected
      if (startDate && endDate) {
        // Format dates for backend - just use the date part without time
        // Your backend expects dates like "2025-08-28" without time component
        url += `&start=${startDate}&end=${endDate}`;
      }

      console.log("Fetching from URL:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);

      setSalesData(data.sales || []);
      setTotalPages(data.totalPages || 0);

      // Extract unique customer names
      const customers = Array.from(
        new Set(data.sales?.map((sale: Sale) => sale.customerName) || [])
      ) as string[];
      setAllCustomers(customers);

      if (data.summary) {
        setSummary({
          totalSales: data.summary.totalSales || 0,
          totalAmount: data.summary.totalAmount || 0,
          profit: data.summary.totalProfit || 0,
          expenditure: data.summary.totalExpenditure || 0,
          deviation: data.summary.totalDeviation || 0,
        });
      } else {
        setSummary({
          totalSales: data.totalItems || 0,
          totalAmount:
            data.sales?.reduce(
              (sum: number, s: Sale) => sum + (s.totalAmount || 0),
              0
            ) || 0,
          profit: 0,
          expenditure: 0,
          deviation: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
      window.showToast("Failed to fetch sales data", "error");

    } finally {
      setIsLoading(false);
    }
  };
// Fetch ALL sales without filters (on component load)
const fetchAllData = async () => {
  setIsLoading(true);
  try {
    const url = `${API_BASE_URL}?page=${currentPage}&size=${pageSize}&sortBy=id&direction=desc`;

    console.log("Fetching all data from URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API All Data Response:", data);

    setSalesData(data.sales || []);
    setTotalPages(data.totalPages || 0);

    // Unique customers
    const customers = Array.from(
      new Set(data.sales?.map((sale: Sale) => sale.customerName) || [])
    ) as string[];
    setAllCustomers(customers);

    // Build summary
    setSummary({
      totalSales: data.totalItems || 0,
      totalAmount: data.sales?.reduce(
        (sum: number, s: Sale) => sum + (s.totalAmount || 0),
        0
      ) || 0,
      profit: data.totalProfit || 0,
      expenditure: 0,
      deviation: 0,
    });
  } catch (err) {
    console.error("Error fetching all sales:", err);
    window.showToast("Failed to fetch all sales data", "error");
  } finally {
    setIsLoading(false);
  }
};

  const handleEdit = (saleId: number) => {
    console.log("Edit sale:", saleId);
    // Implement edit functionality
    window.showToast(`Edit functionality for sale #${saleId} would open here`, "info");
  };

  const handleView = (saleId: number) => {
    console.log("View sale:", saleId);
    // Implement view functionality
    window.showToast(`View details for sale #${saleId} would appear here`, "info");
  };

  const handleDelete = (saleId: number) => {
    if (confirm("Are you sure you want to delete this sale?")) {
      console.log("Delete sale:", saleId);
      // Implement delete functionality
      window.showToast(`Sale #${saleId} would be deleted now`, "info");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Report", 14, 15);

    if (summary) {
      doc.text(
        `Sales: $${(summary.totalAmount || 0).toFixed(2)} | Profit: $${(
          summary.profit || 0
        ).toFixed(2)} | Expenditure: $${(summary.expenditure || 0).toFixed(2)}`,
        14,
        25
      );
      doc.text(`Deviation: ${(summary.deviation || 0).toFixed(2)}%`, 14, 32);
    }

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "ID",
          "Customer",
          "Date",
          "Total",
          "Amount Paid",
          "Balance",
          "Profit",
          "Payment Status",
        ],
      ],
      body: salesData.map((s) => [
        s.id,
        s.customerName,
        new Date(s.saleDate).toLocaleDateString(),
        `$${(s.totalAmount || 0).toFixed(2)}`,
        `$${(s.paidAmount || 0).toFixed(2)}`,
        `$${(s.balance || 0).toFixed(2)}`,
        `$${(s.profit || 0).toFixed(2)}`,
        s.paymentStatus || "-",
      ]),
    });

    doc.save("sales_report.pdf");
  };

  // Filter sales by customer name
  const filteredSales = customerFilter
    ? salesData.filter((sale) =>
        sale.customerName.toLowerCase().includes(customerFilter.toLowerCase())
      )
    : salesData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Sales Dashboard</h1>

      {/* Quick Period Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["today", "week", "month", "year"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              activePeriod === p
                ? "bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {p === "today"
              ? "Today"
              : p === "week"
              ? "This Week"
              : p === "month"
              ? "This Month"
              : "This Year"}
          </button>
        ))}
      </div>

      {/* Custom Date Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePeriod("");
            }}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePeriod("");
            }}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Customer:</label>
          <div className="relative">
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Search customer..."
              className="border px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              list="customerNames"
            />
            <datalist id="customerNames">
              {allCustomers.map((customer) => (
                <option key={customer} value={customer} />
              ))}
            </datalist>
            {customerFilter && (
              <button
                onClick={() => setCustomerFilter("")}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={fetchData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Apply Filter
        </button>
        <button
          onClick={exportPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export PDF
        </button>
        <button
          onClick={() => {
            setCustomerFilter("");
            setStartDate("");
            setEndDate("");
            setActivePeriod("");
            setCurrentPage(0);
            fetchData();
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Clear Filters
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-sm text-gray-500 uppercase font-semibold">Total Sales Amount</h3>
            <p className="text-2xl font-bold text-gray-800">
              KSH{(summary.totalAmount || 0).toFixed(2)}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {activePeriod ? `For ${activePeriod}` : "All time sales"}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-sm text-gray-500 uppercase font-semibold">Profit</h3>
            <p className="text-2xl font-bold text-gray-800">
              KSH{(summary.profit || 0).toFixed(2)}
            </p>
            <div className="mt-2 text-xs text-gray-500">Net profit</div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-sm text-gray-500 uppercase font-semibold">Sales Deviation</h3>
            <p
              className={`text-2xl font-bold ${
                (summary.deviation || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {(summary.deviation || 0) >= 0
                ? `+${(summary.deviation || 0).toFixed(2)}%`
                : `${(summary.deviation || 0).toFixed(2)}%`}
            </p>
            <div className="mt-2 text-xs text-gray-500">From target</div>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Sales Records</h2>
          <span className="text-sm text-gray-500">
            Showing {filteredSales.length} of {summary?.totalSales || 0} records
            {customerFilter && ` for "${customerFilter}"`}
            {activePeriod && ` for ${activePeriod}`}
          </span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Profit</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Method</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="p-3 font-medium">#{sale.id}</td>
                      <td className="p-3 font-medium">{sale.customerName}</td>
                      <td className="p-3 font-medium">{sale.customerPhone}</td>
                      <td className="p-3">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-medium text-green-600">
                        KSH{(sale.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="p-3">kes{(sale.paidAmount || 0).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (sale.balance || 0) > 0 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          ksh{(sale.balance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-blue-600">
                        ksh{(sale.profit || 0).toFixed(2)}
                      </td>
                      <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              sale.paymentStatus === "PAID"
                ? "bg-green-100 text-green-800"
                : sale.paymentStatus === "PARTIAL"
                ? "bg-yellow-100 text-yellow-800"
                : sale.paymentStatus === "OVERPAID"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {sale.paymentStatus}
          </span>
        </td>
                              <td className="p-3">{sale.paymentMethod || "-"}</td>
                      <td className="p-3">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => setViewSale(sale)} 
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 rounded-full hover:bg-blue-50"
                            title="View details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                         { /* <button 
                            onClick={() => setEditSale(sale)}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200 p-1 rounded-full hover:bg-green-50"
                            title="Edit sale"
                          >
                            <svg xmlns="http://www.w3.org2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>*/}
                          
                          <button
  onClick={() => setReturnSaleId(sale.id)}
  className="text-purple-600 hover:text-purple-800 transition-colors duration-200 p-1 rounded-full hover:bg-purple-50"
  title="Return items"
>
  ↩️
</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-gray-500">
                        {customerFilter
                          ? `No sales found for customer "${customerFilter}"`
                          : activePeriod
                          ? `No sales found for ${activePeriod}`
                          : "No sales found for the selected period"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/*  Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages || 1}
              </span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() =>
                  setCurrentPage((p) => (p < totalPages - 1 ? p + 1 : p))
                }
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors duration-200 flex items-center"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </>
        )}
         {viewSale && (
  <ViewSaleModal sale={viewSale} onClose={() => setViewSale(null)} />
)}
{editSale && (
  <EditSaleModal
    sale={editSale}
    onClose={() => setEditSale(null)}
    onSave={fetchAllData}
  />
)}

{returnSaleId && (
  <ReturnSaleModal
    saleId={returnSaleId}
    onClose={() => setReturnSaleId(null)}
    onReturnSuccess={fetchAllData}
  />
)}
      </div>
    </div>
  );
 
}