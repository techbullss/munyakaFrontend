// app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowDownIcon, 
  ArrowUpIcon,
  DocumentArrowDownIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Type definitions matching your backend
interface DateRange {
  start: string;
  end: string;
}
interface ReportItem {
  id?: string | number;
  [key: string]: string | number | boolean | undefined; // optional if items can have dynamic properties
}
interface ReportTab {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  endpoint: string;
}

// Sale types based on your API response
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

interface SaleRecord {
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
}

interface SalesApiResponse {
  sales: SaleRecord[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  totalProfit: number;
}

interface ExpenditureRecord {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod?: string;
}

interface ItemForHireRecord {
  id: number;
  name: string;
  description: string;
  category: string;
  dailyRate: number;
  depositAmount: number;
  availableQuantity: number;
  condition: string;
  imageUrl: string | null;
  maintenanceDate: string | null;
  isActive: boolean;
}


interface PurchaseItem {
  id: number;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

interface PurchaseRecord {
  id: number;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  creditor: boolean;
  items: PurchaseItem[];
}

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: string;
}

interface CreditorRecord {
  id: number;
  name: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface ProfitLossRecord {
  id: number;
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  margin: number;
}
interface ExpenditureApiResponse {
  content: ExpenditureRecord[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
interface CreditorRecord {
  id: number;
  supplierName: string;
  balance: number;
  dueDate: string;
  status: string;
  creditTerms: string;
  paymentAmount: number;
}

interface CreditorApiResponse {
  content: CreditorRecord[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    offset: number;
    unpaged: boolean;
    paged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}


interface InventoryVariant {
  Brand?: string;
  Grade?: string;
  Size?: string;
  [key: string]: string | undefined;
}

interface InventoryRecord {
  id: number;
  itemName: string;
  category: string;
  description: string;
  price: number;
  stockQuantity: number;
  sellingPrice: number;
  supplier: string;
  sellingUnit: string;
  lengthType: string | null;
  piecesPerBox: number;
  imageUrls: string[];
  variants: InventoryVariant;
}


interface DebtorRecord {
  id: number;
  customer: string;
  amount: number;
  dueDate: string;
  status: string;
}
interface SaleItemDTO {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaleDTO {
  id: number;
  customerPhone: string;
  customerName: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number | null;
  balanceDue: number;
  paymentMethod: string;
  profit: number;
  paymentStatus: string;
  items: SaleItemDTO[];
}

interface DebtorRecord {
  id: number;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  lastSaleDate: string;
  paymentStatus: string;
  sales: SaleDTO[];
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
}

type ReportData = 
  | SaleRecord[]
  | ExpenditureRecord[]
  | ItemForHireRecord[]
  | PurchaseRecord[]
  | UserRecord[]
  | CreditorRecord[]
  | ProfitLossRecord[]
  | InventoryRecord[]
  | DebtorRecord[];

const reportTabs: ReportTab[] = [
  { id: 'sales', name: 'Sales Report', icon: CurrencyDollarIcon, endpoint: 'http://localhost:8080/api/sales' },
  { id: 'expenditure', name: 'Expenditure Report', icon: ArrowDownIcon, endpoint: 'http://localhost:8080/api/expenditures' },
  { id: 'itemforhire', name: 'Items for Hire', icon: WrenchScrewdriverIcon, endpoint: 'http://localhost:8080/api/rental-items' },
  { id: 'purchase', name: 'Purchase Report', icon: ShoppingCartIcon, endpoint: 'http://localhost:8080/api/purchases/filter' },
  { id: 'users', name: 'Users Report', icon: UsersIcon, endpoint: 'http://localhost:8080/api/users' },
  { id: 'creditors', name: 'Creditors Report', icon: UserGroupIcon, endpoint: 'http://localhost:8080/api/creditors' },
{ id: 'profit', name: 'Profit & Loss', icon: ChartBarIcon, endpoint: 'http://localhost:8080/api/sales' }, 
 { id: 'inventory', name: 'Inventory Report', icon: CubeIcon, endpoint: 'http://localhost:8080/api/items' },
  { id: 'debtors', name: 'Debtors Report', icon: UserGroupIcon, endpoint: 'http://localhost:8080/api/sales/debtors' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<string>('sales');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState<ReportData>([]);
  const [summary, setSummary] = useState<Record<string, string | number | boolean | undefined>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalItems: 0
  });
const fetchSalesData = async (dateRange: DateRange): Promise<SaleRecord[]> => {
  try {
    const queryParams = new URLSearchParams({
      page: '0',
      size: '1000',
      
    });
    
    const response = await fetch(`http://localhost:8080/api/sales?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch sales data');
    
    const result = await response.json();
    return result.sales || [];
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};

const fetchExpenditureData = async (dateRange: DateRange): Promise<ExpenditureRecord[]> => {
  try {
    const queryParams = new URLSearchParams({
      page: '0',
      size: '1000',
      
    });
    
    const response = await fetch(`http://localhost:8080/api/expenditures?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch expenditure data');
    
    const result = await response.json();
    return result.content || [];
  } catch (error) {
    console.error('Error fetching expenditure data:', error);
    return [];
  }
};

const fetchPurchaseData = async (dateRange: DateRange): Promise<PurchaseRecord[]> => {
  try {
    const queryParams = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end
    });
    
    const response = await fetch(`http://localhost:8080/api/purchases/filter?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch purchase data');
    
    const result = await response.json();
    return Array.isArray(result) ? result : result.content || result.data || [];
  } catch (error) {
    console.error('Error fetching purchase data:', error);
    return [];
  }
};

  // Fetch report data from backend
const fetchReportData = async (reportType: string, dateRange: DateRange) => {
  setIsLoading(true);
  setError('');
  setReportData([]); // Reset data when starting new fetch
  setSummary({}); // Reset summary
  
  try {
    const tab = reportTabs.find(t => t.id === reportType);
    if (!tab) throw new Error('Report type not found');

    const queryParams = new URLSearchParams();
    
    if (reportType === 'sales') {
      queryParams.append('page', '0');
      queryParams.append('size', '1000');
      queryParams.append('sortBy', 'saleDate');
      queryParams.append('direction', 'desc');
    } else if (reportType === 'expenditure') {
      queryParams.append('page', '0');
      queryParams.append('size', '1000');
      queryParams.append('startDate', dateRange.start);
      queryParams.append('endDate', dateRange.end);
    } else {
      queryParams.append('startDate', dateRange.start);
      queryParams.append('endDate', dateRange.end);
    }

    const response = await fetch(`${tab.endpoint}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${reportType} data`);
    }

    const result = await response.json();
    
    if (reportType === 'sales') {
      const salesResponse = result as SalesApiResponse;
      setReportData(salesResponse.sales || []);
      setSummary({
        totalSales: (salesResponse.sales || []).reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalProfit: salesResponse.totalProfit || 0,
        totalItems: salesResponse.totalItems || 0
      });
      setPagination({
        currentPage: salesResponse.currentPage || 0,
        totalPages: salesResponse.totalPages || 0,
        totalItems: salesResponse.totalItems || 0
      });}
      else if (reportType === 'creditors') {
      const creditorResponse = result as CreditorApiResponse;
      setReportData(creditorResponse.content || []);
      setSummary({
        totalCreditors: creditorResponse.totalElements || 0,
        totalBalance: (creditorResponse.content || []).reduce((sum, creditor) => sum + creditor.balance, 0),
        totalPayments: (creditorResponse.content || []).reduce((sum, creditor) => sum + creditor.paymentAmount, 0),
        overdueCreditors: (creditorResponse.content || []).filter(creditor => 
          new Date(creditor.dueDate) < new Date()
        ).length
      });
    }
     else if (reportType === 'debtors') {
  const debtorsData = Array.isArray(result) ? result : [];
  setReportData(debtorsData);
  setSummary({
    totalDebtors: debtorsData.length,
    totalOutstandingDebt: debtorsData.reduce((sum, debtor) => sum + debtor.totalDebt, 0),
    overdueDebtors: debtorsData.filter(debtor => 
      debtor.paymentStatus === 'PENDING' || debtor.paymentStatus === 'OVERDUE'
    ).length,
    totalPendingSales: debtorsData.reduce((sum, debtor) => sum + (debtor.sales?.length || 0), 0),
    totalReceivedPayments: debtorsData.reduce((sum, debtor) => sum + (debtor.lastPaymentAmount || 0), 0)
  });
}
    else if (reportType === 'inventory') {
      const inventoryData = Array.isArray(result) ? result : [];
      setReportData(inventoryData);
      setSummary({
        totalItems: inventoryData.length,
        totalStockValue: inventoryData.reduce((sum, item) => sum + (item.price * item.stockQuantity), 0),
        totalSellingValue: inventoryData.reduce((sum, item) => sum + (item.sellingPrice * item.stockQuantity), 0),
        lowStockItems: inventoryData.filter(item => item.stockQuantity <= 10).length,
        outOfStockItems: inventoryData.filter(item => item.stockQuantity === 0).length
      });
    }
      else if (reportType === 'purchase') {
      // Handle purchase response - it might be an array or paginated
      const purchaseData = Array.isArray(result) ? result : result.content || result.data || [];
      setReportData(purchaseData);
      setSummary({
        totalPurchases: purchaseData.reduce((sum: number, purchase: { totalAmount: number; }) => sum + purchase.totalAmount, 0),
        totalPaid: purchaseData.reduce((sum: number, purchase: { amountPaid: number; }) => sum + purchase.amountPaid, 0),
        totalBalance: purchaseData.reduce((sum: number, purchase: { balanceDue: number; }) => sum + purchase.balanceDue, 0),
        totalItems: purchaseData.length,
        creditors: purchaseData.filter((purchase: { creditor: number; }) => purchase.creditor).length
      });
    } else if (reportType === 'profit') {
  // Calculate profit and loss manually from existing endpoints
  try {
    // Fetch data from all relevant endpoints
    const [salesResponse, expenditureResponse, purchaseResponse] = await Promise.all([
      fetchSalesData(dateRange),
      fetchExpenditureData(dateRange),
      fetchPurchaseData(dateRange)
    ]);

    const revenue = salesResponse.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const costOfGoodsSold = purchaseResponse.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const operatingExpenses = expenditureResponse.reduce((sum, expense) => sum + expense.amount, 0);
    const grossProfit = revenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const profitLossData: ProfitLossRecord[] = [{
      id: 1,
      period: `${dateRange.start} to ${dateRange.end}`,
      revenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      netProfit,
      margin
    }];

    setReportData(profitLossData);
    setSummary({
      totalRevenue: revenue,
      totalCostOfGoods: costOfGoodsSold,
      totalOperatingExpenses: operatingExpenses,
      grossProfit,
      netProfit,
      profitMargin: margin
    });
  } catch (error) {
    throw new Error('Failed to calculate profit and loss data');
  }
} else if (reportType === 'expenditure') {
      const expenditureResponse = result as ExpenditureApiResponse;
      setReportData(expenditureResponse.content || []);
      setSummary({
        totalExpenditure: (expenditureResponse.content || []).reduce((sum, expense) => sum + expense.amount, 0),
        totalItems: expenditureResponse.totalElements || 0,
        averageExpense: (expenditureResponse.content || []).length > 0 
          ? (expenditureResponse.content || []).reduce((sum, expense) => sum + expense.amount, 0) / (expenditureResponse.content || []).length 
          : 0
      });
      setPagination({
        currentPage: expenditureResponse.number || 0,
        totalPages: expenditureResponse.totalPages || 0,
        totalItems: expenditureResponse.totalElements || 0
      });
    } else {
      setReportData(result.data || result.content || result || []);
      setSummary(result.summary || {});
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
    console.error('Error fetching report data:', err);
  } finally {
    setIsLoading(false);
  }
};

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Generate PDF in the browser - FIXED VERSION
  const generatePDF = async () => {
    try {
      // Import jsPDF
      const { jsPDF } = await import('jspdf');
      
      // Create document first
      const doc = new jsPDF();
      const currentTab = reportTabs.find(tab => tab.id === activeTab);
      
      // Add title
      doc.setFontSize(16);
      doc.text(`${currentTab?.name} - ${dateRange.start} to ${dateRange.end}`, 14, 15);
      
      // Add summary if available
      let startY = 25;
    if (activeTab !== 'profit' && Object.keys(summary).length > 0) {
      doc.setFontSize(10);
      Object.entries(summary).forEach(([key, value], index) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        const displayValue = typeof value === 'number' ? `KSh ${value.toFixed(2)}` : String(value);
        doc.text(`${label}: ${displayValue}`, 14, startY + (index * 5));
      });
      startY += (Object.keys(summary).length * 5) + 10;
    }


      // Now import and use autoTable
      const autoTable = await import('jspdf-autotable');
      
      switch (activeTab) {
        case 'sales':
          const salesData = reportData as SaleRecord[];
          // Flatten sales data with items
          const salesTableData = salesData.flatMap(sale => 
            sale.items.map(item => ([
              formatDate(sale.saleDate),
              sale.customerName || 'Walk-in Customer',
              item.productName,
              item.quantity.toString(),
              `KSh${item.unitPrice.toFixed(2)}`,
              `KSh${item.lineTotal.toFixed(2)}`,
              `KSh${sale.profit.toFixed(2)}`
            ]))
          );
          
          autoTable.default(doc, {
            startY: startY,
            head: [['Date', 'Customer', 'Product', 'Qty', 'Unit Price', 'Total', 'Profit']],
            body: salesTableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          break;
          case 'debtors':
  const debtorData = reportData as DebtorRecord[];
  autoTable.default(doc, {
    startY: startY,
    head: [['Customer', 'Phone', 'Total Debt', 'Last Sale Date', 'Payment Status', 'Pending Sales', 'Last Payment', 'Days Since Last Sale']],
    body: debtorData.map(debtor => {
      const lastSaleDate = new Date(debtor.lastSaleDate);
      const today = new Date();
      const daysSinceLastSale = Math.floor((today.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const lastPaymentInfo = debtor.lastPaymentAmount 
        ? `KSh ${debtor.lastPaymentAmount.toFixed(2)} ${debtor.lastPaymentDate ? formatDate(debtor.lastPaymentDate) : ''}`
        : 'No payment';
      
      return [
        debtor.customerName || 'Walk-in Customer',
        debtor.customerPhone || 'N/A',
        `KSh ${debtor.totalDebt?.toFixed(2)}`,
        formatDate(debtor.lastSaleDate),
        debtor.paymentStatus,
        (debtor.sales?.length || 0).toString(),
        lastPaymentInfo,
        `${daysSinceLastSale} days`
      ];
    }),
    styles: { fontSize: 7 }, // Smaller font to fit all columns
    headStyles: { fillColor: [59, 130, 246] }
  });
  break;

        case 'expenditure':
          const expenditureData = reportData as ExpenditureRecord[];
          autoTable.default(doc, {
            startY: startY,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: expenditureData.map(item => [
              item.date,
              item.category,
              item.description,
              `$${item.amount}`
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          break;

       case 'itemforhire':
  const hireData = reportData as ItemForHireRecord[];
  autoTable.default(doc, {
    startY: startY,
    head: [['Item Name', 'Category', 'Daily Rate', 'Deposit', 'Available Qty', 'Condition', 'Status']],
    body: hireData.map(item => [
      item.name,
      item.category,
      `KSh ${item.dailyRate.toFixed(2)}`,
      `KSh ${item.depositAmount.toFixed(2)}`,
      item.availableQuantity.toString(),
      item.condition,
      item.isActive ? 'Active' : 'Inactive'
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  break;
         case 'inventory':
  const inventoryData = reportData as InventoryRecord[];
  autoTable.default(doc, {
    startY: startY,
    head: [['Item Name', 'Category', 'Supplier', 'Stock Qty', 'Unit', 'Buying Price', 'Selling Price', 'Profit Margin', 'Stock Value', 'Status']],
    body: inventoryData.map(item => {
      const profitMargin = ((item.sellingPrice - item.price) / item.price) * 100;
      const stockValue = item.price * item.stockQuantity;
      const isLowStock = item.stockQuantity <= 10;
      const isOutOfStock = item.stockQuantity === 0;
      let status = 'In Stock';
      if (isOutOfStock) status = 'Out of Stock';
      else if (isLowStock) status = 'Low Stock';
      
      return [
        item.itemName,
        item.category,
        item.supplier,
        item.stockQuantity.toString(),
        item.sellingUnit,
        `KSh ${item.price?.toFixed(2)}`,
        `KSh ${item.sellingPrice?.toFixed(2)}`,
        `${profitMargin?.toFixed(1)}%`,
        `KSh ${stockValue?.toFixed(2)}`,
        status
      ];
    }),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  break; 

       case 'purchase':
  const purchaseData = reportData as PurchaseRecord[];
  const purchaseTableData = purchaseData.flatMap(purchase => 
    purchase.items?.map(item => ([
      formatDate(purchase.purchaseDate),
      purchase.supplierName,
      item.productName,
      item.quantity.toString(),
      `KSh ${item.price.toFixed(2)}`,
      `KSh ${item.total.toFixed(2)}`,
      `KSh ${purchase.totalAmount.toFixed(2)}`,
      `KSh ${purchase.amountPaid.toFixed(2)}`,
      `KSh ${purchase.balanceDue.toFixed(2)}`,
      purchase.status,
      purchase.creditor ? 'Yes' : 'No'
    ])) || [[
      formatDate(purchase.purchaseDate),
      purchase.supplierName,
      'No items',
      '0',
      'KSh 0.00',
      'KSh 0.00',
      `KSh ${purchase.totalAmount.toFixed(2)}`,
      `KSh ${purchase.amountPaid.toFixed(2)}`,
      `KSh ${purchase.balanceDue.toFixed(2)}`,
      purchase.status,
      purchase.creditor ? 'Yes' : 'No'
    ]]
  );
  
  autoTable.default(doc, {
    startY: startY,
    head: [['Date', 'Supplier', 'Product', 'Qty', 'Unit Price', 'Item Total', 'Total Amount', 'Paid', 'Balance', 'Status', 'Creditor']],
    body: purchaseTableData,
    styles: { fontSize: 7 }, // Smaller font for more columns
    headStyles: { fillColor: [59, 130, 246] }
  });
  break;
  
  case 'creditors':
  const creditorData = reportData as CreditorRecord[];
  autoTable.default(doc, {
    startY: startY,
    head: [['Supplier', 'Balance Due', 'Payment Made', 'Due Date', 'Credit Terms', 'Status', 'Days Remaining']],
    body: creditorData.map(creditor => {
      const dueDate = new Date(creditor.dueDate);
      const today = new Date();
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysRemaining < 0;
      
      return [
        creditor.supplierName,
        `KSh ${creditor.balance?.toFixed(2)}`,
        `KSh ${creditor.paymentAmount?.toFixed(2)}`,
        formatDate(creditor.dueDate),
        creditor.creditTerms,
        creditor.status,
        isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`
      ];
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  break;
  case 'profit':
  const profitLossData = reportData as ProfitLossRecord[];
  if (!profitLossData || profitLossData.length === 0) {
    doc.setFontSize(12);
    doc.text('No profit and loss data available for the selected period', 14, 30);
    break;
  }
  
  const plData = profitLossData[0];
  
  // Add title
  doc.setFontSize(16);
  doc.text('Profit & Loss Statement', 14, 15);
  doc.setFontSize(10);
  doc.text(`Period: ${plData.period || `${dateRange.start} to ${dateRange.end}`}`, 14, 22);
  
  let profitStartY = 35;
  
  // Draw a professional header
  doc.setDrawColor(200, 200, 200);
  doc.line(14, profitStartY - 5, 196, profitStartY - 5);
  profitStartY += 5;
  
  // Revenue section
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text('REVENUE', 14, profitStartY);
  doc.text(`KSh ${(plData.revenue || 0).toFixed(2)}`, 180, profitStartY, { align: 'right' });
  profitStartY += 10;
  
  // Cost of Goods Sold
  doc.setFontSize(11);
  doc.text('Less: Cost of Goods Sold', 20, profitStartY);
  doc.text(`(KSh ${(plData.costOfGoodsSold || 0).toFixed(2)})`, 180, profitStartY, { align: 'right' });
  profitStartY += 8;
  
  // Gross Profit line
  doc.setDrawColor(100, 100, 100);
  doc.line(14, profitStartY, 196, profitStartY);
  profitStartY += 8;
  
  // Gross Profit
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('GROSS PROFIT', 14, profitStartY);
  const grossProfit = plData.grossProfit || (plData.revenue || 0) - (plData.costOfGoodsSold || 0);
  doc.text(`KSh ${grossProfit.toFixed(2)}`, 180, profitStartY, { align: 'right' });
  profitStartY += 12;
  
  // Operating Expenses header
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text('OPERATING EXPENSES', 14, profitStartY);
  profitStartY += 8;
  
  // Operating Expenses
  doc.setFontSize(10);
  doc.text('Total Operating Expenses', 20, profitStartY);
  doc.text(`(KSh ${(plData.operatingExpenses || 0).toFixed(2)})`, 180, profitStartY, { align: 'right' });
  profitStartY += 8;
  
  // Net Profit line
  doc.setDrawColor(100, 100, 100);
  doc.line(14, profitStartY, 196, profitStartY);
  profitStartY += 8;
  
  // Net Profit
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text('NET PROFIT/LOSS', 14, profitStartY);
  const netProfit = plData.netProfit || grossProfit - (plData.operatingExpenses || 0);
  const netProfitColor = netProfit >= 0 ? [0, 128, 0] : [255, 0, 0];
  doc.setTextColor(netProfitColor[0], netProfitColor[1], netProfitColor[2]);
  doc.text(`KSh ${netProfit.toFixed(2)}`, 180, profitStartY, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  profitStartY += 15;
  
  // Financial Ratios Section
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.rect(14, profitStartY, 182, 25, 'F');
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text('FINANCIAL RATIOS', 20, profitStartY + 8);
  doc.setFont("helvetica", "normal");
  
  const margin = plData.margin || ((plData.revenue || 0) > 0 ? (netProfit / (plData.revenue || 1)) * 100 : 0);
  const grossMargin = (plData.revenue || 0) > 0 ? (grossProfit / (plData.revenue || 1)) * 100 : 0;
  const operatingMargin = (plData.revenue || 0) > 0 ? (((plData.revenue || 0) - (plData.operatingExpenses || 0)) / (plData.revenue || 1)) * 100 : 0;
  
  doc.setFontSize(9);
  doc.text(`Gross Margin: ${grossMargin.toFixed(1)}%`, 25, profitStartY + 16);
  doc.text(`Operating Margin: ${operatingMargin.toFixed(1)}%`, 100, profitStartY + 16);
  doc.text(`Net Margin: ${margin.toFixed(1)}%`, 25, profitStartY + 22);
  
  profitStartY += 35;
  
  // Performance Summary
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text('PERFORMANCE SUMMARY', 14, profitStartY);
  doc.setFont("helvetica", "normal");
  profitStartY += 7;
  
  doc.setFontSize(9);
  const performance = netProfit >= 0 ? 'Profitable Operation' : 'Loss Making';
  const efficiency = grossMargin > 30 ? 'High Efficiency' : grossMargin > 15 ? 'Moderate Efficiency' : 'Low Efficiency';
  const trend = grossProfit > (plData.revenue || 0) * 0.4 ? 'Healthy Margins' : 'Thin Margins';
  
  doc.text(`• ${performance}`, 20, profitStartY);
  profitStartY += 5;
  doc.text(`• ${efficiency}`, 20, profitStartY);
  profitStartY += 5;
  doc.text(`• ${trend}`, 20, profitStartY);
  break;
        default:
          autoTable.default(doc, {
            startY: startY,
            head: [['ID', 'Data']],
            body: (reportData as unknown as ReportItem[]).map((item, index) => [
              item.id || (index + 1).toString(),
              JSON.stringify(item)
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
          });
      }

      // Save the PDF
      doc.save(`${activeTab}-report-${dateRange.start}-to-${dateRange.end}.pdf`);
      
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
      console.error('Error generating PDF:', err);
    }
  };

  // Export to PDF function
  const exportToPDF = async () => {
    await generatePDF();
  };

  // Apply date filter
  const applyFilter = () => {
    fetchReportData(activeTab, dateRange);
  };

  // Load data when tab changes or component mounts
  useEffect(() => {
    fetchReportData(activeTab, dateRange);
  }, [activeTab]);

  // Render different tables based on active tab
  const renderTable = () => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  // Add safety check for reportData
  if (!reportData || reportData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

    switch (activeTab) {
      case 'sales':
        const salesData = reportData as SaleRecord[];
      if (!Array.isArray(salesData)) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Invalid data format</p>
          </div>
        );
      }
        return (
          <div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(reportData as SaleRecord[]).map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customerPhone || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {sale.items?.map((item, index) => (
                          <div key={index} className="mb-1">
                            {item?.productName} (Qty: {item.quantity})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      KSh{sale.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      KSh{sale.paidAmount?.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      KSh{sale.balance?.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      KSh{sale.profit?.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.paymentStatus === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'expenditure':
        const expenditureData = reportData as ExpenditureRecord[];
      if (!Array.isArray(expenditureData)) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Invalid data format</p>
          </div>
        );
      }
        return (
          <table className="min-w-full divide-y divide-gray-200">
  <thead>
    <tr>
      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {(reportData as ExpenditureRecord[]).map((expense) => (
      <tr key={expense.id} className="hover:bg-gray-50">
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
          {new Date(expense.date).toLocaleDateString()}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {expense.category}
          </span>
        </td>
        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
          {expense.description}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
          -KSh{expense.amount}
        </td>
      </tr>
    ))}
  </tbody>
</table>
        );
        case 'itemforhire':
  const hireData = reportData as ItemForHireRecord[];
  if (!Array.isArray(hireData)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invalid data format</p>
      </div>
    );
  }
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Daily Rate</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Deposit</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Available Qty</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {hireData.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {item.name}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {item.category}
              </span>
            </td>
            <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
              {item.description}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
              KSh {item.dailyRate?.toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
              KSh {item.depositAmount?.toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                item.availableQuantity > 0 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.availableQuantity}
              </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                {item.condition}
              </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                item.isActive 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
case 'purchase':
  const purchaseData = reportData as PurchaseRecord[];
  if (!Array.isArray(purchaseData)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invalid data format</p>
      </div>
    );
  }
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Balance Due</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Creditor</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {purchaseData.map((purchase) => (
          <tr key={purchase.id} className="hover:bg-gray-50">
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDate(purchase.purchaseDate)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {purchase.supplierName}
            </td>
            <td className="px-4 py-4 text-sm text-gray-900">
              <div className="max-w-xs">
                {purchase.items?.map((item, index) => (
                  <div key={item.id || index} className="mb-1">
                    {item.productName} (Qty: {item.quantity})
                  </div>
                )) || 'No items'}
              </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              KSh {purchase.totalAmount?.toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
              KSh {purchase.amountPaid?.toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
              KSh {purchase.balanceDue?.toFixed(2)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                purchase.status === 'Paid' 
                  ? 'bg-green-100 text-green-800'
                  : purchase.status === 'Partial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {purchase.status}
              </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                purchase.creditor
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {purchase.creditor ? 'Yes' : 'No'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  case 'creditors':
  const creditorData = reportData as CreditorRecord[];
  if (!Array.isArray(creditorData)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invalid data format</p>
      </div>
    );
  }
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Balance Due</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Payment Made</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Credit Terms</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Days Remaining</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {creditorData.map((creditor) => {
          const dueDate = new Date(creditor.dueDate);
          const today = new Date();
          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysRemaining < 0;
          
          return (
            <tr key={creditor.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {creditor.supplierName}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                KSh {creditor.balance?.toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                KSh {creditor.paymentAmount?.toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(creditor.dueDate)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {creditor.creditTerms}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  creditor.status === 'Paid' 
                    ? 'bg-green-100 text-green-800'
                    : creditor.status === 'Partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {creditor.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  isOverdue
                    ? 'bg-red-100 text-red-800'
                    : daysRemaining <= 7
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  case 'inventory':
  const inventoryData = reportData as InventoryRecord[];
  if (!Array.isArray(inventoryData)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invalid data format</p>
      </div>
    );
  }
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Buying Price</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Stock Value</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {inventoryData.map((item) => {
          const profitMargin = ((item.sellingPrice - item.price) / item.price) * 100;
          const stockValue = item.price * item.stockQuantity;
          const isLowStock = item.stockQuantity <= 10;
          const isOutOfStock = item.stockQuantity === 0;
          
          return (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.itemName}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {item.category}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.supplier}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  isOutOfStock
                    ? 'bg-red-100 text-red-800'
                    : isLowStock
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.stockQuantity}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.sellingUnit}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                KSh {item.price?.toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                KSh {item.sellingPrice?.toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  profitMargin > 50
                    ? 'bg-green-100 text-green-800'
                    : profitMargin > 20
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profitMargin?.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                KSh {stockValue?.toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  isOutOfStock
                    ? 'bg-red-100 text-red-800'
                    : isLowStock
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
case 'debtors':
  const debtorData = reportData as DebtorRecord[];
  if (!Array.isArray(debtorData)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invalid data format</p>
      </div>
    );
  }
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Total Debt</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Last Sale Date</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Pending Sales</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Days Since Last Sale</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {debtorData.map((debtor) => {
          const lastSaleDate = new Date(debtor.lastSaleDate);
          const today = new Date();
          const daysSinceLastSale = Math.floor((today.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <tr key={debtor.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {debtor.customerName || 'Walk-in Customer'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {debtor.customerPhone || 'N/A'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                KSh {debtor.totalDebt?.toFixed(2)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(debtor.lastSaleDate)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  debtor.paymentStatus === 'PAID' 
                    ? 'bg-green-100 text-green-800'
                    : debtor.paymentStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : debtor.paymentStatus === 'OVERPAID'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {debtor.paymentStatus}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {debtor.sales?.length || 0}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {debtor.lastPaymentAmount ? (
                  <div>
                    <div className="text-green-600">KSh {debtor.lastPaymentAmount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {debtor.lastPaymentDate ? formatDate(debtor.lastPaymentDate) : 'N/A'}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No payment</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  daysSinceLastSale > 30
                    ? 'bg-red-100 text-red-800'
                    : daysSinceLastSale > 15
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {daysSinceLastSale} days
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
case 'profit':
  const profitLossData = reportData as ProfitLossRecord[];
  if (!Array.isArray(profitLossData) || profitLossData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No profit and loss data available for the selected period</p>
      </div>
    );
  }
  
  const data = profitLossData[0];
  
  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-lg font-semibold text-green-600">KSh {data.revenue?.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Gross Profit</h3>
          <p className="text-lg font-semibold text-blue-600">KSh {data.grossProfit?.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          <p className={`text-lg font-semibold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            KSh {data.netProfit?.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Profit Margin</h3>
          <p className={`text-lg font-semibold ${data.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.margin?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Detailed Profit & Loss Statement */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Profit & Loss Statement</h3>
          <p className="text-sm text-gray-500">Period: {data.period}</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {/* Revenue Section */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Revenue</span>
              <span className="font-semibold text-green-600">KSh {data.revenue?.toFixed(2)}</span>
            </div>
            
            {/* Cost of Goods Sold */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 ml-4">Cost of Goods Sold</span>
              <span className="text-red-600">(KSh {data.costOfGoodsSold?.toFixed(2)})</span>
            </div>
            
            {/* Gross Profit */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200 bg-gray-50 px-2 -mx-2">
              <span className="font-medium text-gray-700">Gross Profit</span>
              <span className={`font-semibold ${data.grossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                KSh {data.grossProfit?.toFixed(2)}
              </span>
            </div>
            
            {/* Operating Expenses */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Operating Expenses</span>
              <span className="text-red-600">(KSh {data.operatingExpenses?.toFixed(2)})</span>
            </div>
            
            {/* Net Profit */}
            <div className="flex justify-between items-center py-3 border-t border-gray-300 bg-gray-50 px-2 -mx-2 mt-4">
              <span className="font-bold text-gray-900">Net Profit/Loss</span>
              <span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KSh {data.netProfit?.toFixed(2)}
              </span>
            </div>
            
            {/* Profit Margin */}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <span className={`text-sm font-semibold ${data.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.margin?.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Key Ratios */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">Gross Margin</h4>
              <p className={`text-lg font-semibold ${data.revenue > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {data.revenue > 0 ? ((data.grossProfit ? data.grossProfit : 0) / data.revenue * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">Operating Margin</h4>
              <p className={`text-lg font-semibold ${data.revenue > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                {data.revenue > 0 ? (((data.revenue - data.operatingExpenses) / data.revenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">Net Margin</h4>
              <p className={`text-lg font-semibold ${data.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.margin?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

      default:
        return (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(reportData as unknown as ReportItem[]).map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.id || index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {JSON.stringify(item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex gap-4 items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600">Track your business performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button 
            onClick={applyFilter}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {reportTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">
              {reportTabs.find(tab => tab.id === activeTab)?.name}
            </h2>
            <button 
              onClick={exportToPDF}
              disabled={isLoading || reportData.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>

          {/* Summary Cards */}
{Object.keys(summary).length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {Object.entries(summary).map(([key, value]) => (
      <div key={key} className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-500 capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </h3>
        <p className="text-lg font-semibold text-gray-900">
          {typeof value === 'number' ? (
            // Only add currency for money fields, not for counts
            key.toLowerCase().includes('sales') || 
            key.toLowerCase().includes('profit') || 
            key.toLowerCase().includes('expenditure') || 
            key.toLowerCase().includes('amount') || 
            key.toLowerCase().includes('revenue') || 
            key.toLowerCase().includes('cost') || 
            key.toLowerCase().includes('average') && key.toLowerCase().includes('expense')
              ? `KSh ${value.toFixed(2)}`
              : value.toLocaleString() // For counts like totalItems
          ) : String(value)}
        </p>
      </div>
    ))}
  </div>
)}

          {/* Report Table */}
          <div className="overflow-x-auto">
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
}