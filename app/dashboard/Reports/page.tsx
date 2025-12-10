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
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Type definitions matching your backend
interface DateRange {
  start: string;
  end: string;
}
interface ReportItem {
  id?: string | number;
  [key: string]: string | number | boolean | undefined;
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
  createdAt?: string;
  updatedAt?: string;
}

interface UserApiResponse {
  content: UserRecord[];
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

// Pagination interface
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

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
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  });

  // Fetch sales data with pagination
  const fetchSalesData = async (dateRange: DateRange, page: number, size: number): Promise<SalesApiResponse> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end,
        sortBy: 'saleDate',
        direction: 'desc'
      });
      
      const response = await fetch(`http://localhost:8080/api/sales?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch sales data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  };

  // Fetch expenditure data with pagination
  const fetchExpenditureData = async (dateRange: DateRange, page: number, size: number): Promise<ExpenditureApiResponse> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      const response = await fetch(`http://localhost:8080/api/expenditures?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch expenditure data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching expenditure data:', error);
      throw error;
    }
  };

  // Fetch purchase data with pagination
  const fetchPurchaseData = async (dateRange: DateRange, page: number, size: number): Promise<any> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      const response = await fetch(`http://localhost:8080/api/purchases/filter?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch purchase data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching purchase data:', error);
      throw error;
    }
  };

  // Fetch users data with pagination
  const fetchUsersData = async (page: number, size: number): Promise<UserApiResponse> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      const response = await fetch(`http://localhost:8080/api/users?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch users data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching users data:', error);
      throw error;
    }
  };

  // Fetch creditors data with pagination
  const fetchCreditorData = async (dateRange: DateRange, page: number, size: number): Promise<CreditorApiResponse> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      const response = await fetch(`http://localhost:8080/api/creditors?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch creditor data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching creditor data:', error);
      throw error;
    }
  };

  // Fetch inventory data with pagination
  const fetchInventoryData = async (page: number, size: number): Promise<any> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      const response = await fetch(`http://localhost:8080/api/items?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch inventory data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      throw error;
    }
  };

  // Fetch debtors data with pagination
  const fetchDebtorData = async (dateRange: DateRange, page: number, size: number): Promise<any> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      
      const response = await fetch(`http://localhost:8080/api/sales/debtors?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch debtor data');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching debtor data:', error);
      throw error;
    }
  };

  // Fetch report data from backend with pagination
  const fetchReportData = async (reportType: string, dateRange: DateRange, page: number = 0) => {
    setIsLoading(true);
    setError('');
    setReportData([]);
    setSummary({});
    
    try {
      const tab = reportTabs.find(t => t.id === reportType);
      if (!tab) throw new Error('Report type not found');

      switch (reportType) {
        case 'sales': {
          const result = await fetchSalesData(dateRange, page, pagination.pageSize);
          setReportData(result.sales || []);
          setSummary({
            totalSales: (result.sales || []).reduce((sum, sale) => sum + sale.totalAmount, 0),
            totalProfit: result.totalProfit || 0,
            totalItems: result.totalItems || 0
          });
          setPagination(prev => ({
            ...prev,
            currentPage: result.currentPage || 0,
            totalPages: result.totalPages || 0,
            totalItems: result.totalItems || 0
          }));
          break;
        }
        
        case 'expenditure': {
          const result = await fetchExpenditureData(dateRange, page, pagination.pageSize);
          setReportData(result.content || []);
          setSummary({
            totalExpenditure: (result.content || []).reduce((sum, expense) => sum + expense.amount, 0),
            totalItems: result.totalElements || 0,
            averageExpense: (result.content || []).length > 0 
              ? (result.content || []).reduce((sum, expense) => sum + expense.amount, 0) / (result.content || []).length 
              : 0
          });
          setPagination(prev => ({
            ...prev,
            currentPage: result.number || 0,
            totalPages: result.totalPages || 0,
            totalItems: result.totalElements || 0
          }));
          break;
        }
        
        case 'users': {
          const result = await fetchUsersData(page, pagination.pageSize);
          setReportData(result.content || []);
          setSummary({
            totalUsers: result.totalElements || 0,
            activeUsers: (result.content || []).filter(user => user.status === 'ACTIVE').length,
            inactiveUsers: (result.content || []).filter(user => user.status === 'INACTIVE').length,
            adminUsers: (result.content || []).filter(user => user.role === 'ADMIN').length,
            staffUsers: (result.content || []).filter(user => user.role === 'STAFF').length,
            averageLastLogin: (result.content || []).length > 0 
              ? Math.floor((result.content || []).reduce((sum, user) => {
                  const lastLogin = new Date(user.lastLogin);
                  const now = new Date();
                  const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
                  return sum + daysSinceLogin;
                }, 0) / (result.content || []).length)
              : 0
          });
          setPagination(prev => ({
            ...prev,
            currentPage: result.number || 0,
            totalPages: result.totalPages || 0,
            totalItems: result.totalElements || 0
          }));
          break;
        }
        
        case 'creditors': {
          const result = await fetchCreditorData(dateRange, page, pagination.pageSize);
          setReportData(result.content || []);
          setSummary({
            totalCreditors: result.totalElements || 0,
            totalBalance: (result.content || []).reduce((sum, creditor) => sum + creditor.balance, 0),
            totalPayments: (result.content || []).reduce((sum, creditor) => sum + creditor.paymentAmount, 0),
            overdueCreditors: (result.content || []).filter(creditor => 
              new Date(creditor.dueDate) < new Date()
            ).length
          });
          setPagination(prev => ({
            ...prev,
            currentPage: result.number || 0,
            totalPages: result.totalPages || 0,
            totalItems: result.totalElements || 0
          }));
          break;
        }
        
        case 'debtors': {
          const result = await fetchDebtorData(dateRange, page, pagination.pageSize);
          const debtorsData = Array.isArray(result.content) ? result.content : (Array.isArray(result) ? result : []);
          setReportData(debtorsData);
          setSummary({
            totalDebtors: debtorsData.length,
            totalOutstandingDebt: debtorsData.reduce((sum: number, debtor: { totalDebt: any; }) => sum + (debtor.totalDebt || 0), 0),
            overdueDebtors: debtorsData.filter((debtor: { paymentStatus: string; }) => 
              debtor.paymentStatus === 'PENDING' || debtor.paymentStatus === 'OVERDUE'
            ).length,
            totalPendingSales: debtorsData.reduce((sum: number, debtor: { sales: string | any[]; }) => sum + (debtor.sales?.length || 0), 0),
            totalReceivedPayments: debtorsData.reduce((sum: number, debtor: { lastPaymentAmount: number; }) => sum + (debtor.lastPaymentAmount || 0), 0)
          });
          
          if (result.totalElements !== undefined) {
            setPagination(prev => ({
              ...prev,
              currentPage: result.number || 0,
              totalPages: result.totalPages || 0,
              totalItems: result.totalElements || 0
            }));
          } else {
            setPagination(prev => ({
              ...prev,
              currentPage: 0,
              totalPages: 1,
              totalItems: debtorsData.length
            }));
          }
          break;
        }
        
        case 'inventory': {
          const result = await fetchInventoryData(page, pagination.pageSize);
          const inventoryData = Array.isArray(result.content) ? result.content : (Array.isArray(result) ? result : []);
          setReportData(inventoryData);
          setSummary({
            totalItems: inventoryData.length,
            totalStockValue: inventoryData.reduce((sum: number, item: { price: number; stockQuantity: number; }) => 
              sum + (item.price * item.stockQuantity), 0),
            totalSellingValue: inventoryData.reduce((sum: number, item: { sellingPrice: number; stockQuantity: number; }) => 
              sum + (item.sellingPrice * item.stockQuantity), 0),
            lowStockItems: inventoryData.filter((item: { stockQuantity: number; }) => item.stockQuantity <= 10).length,
            outOfStockItems: inventoryData.filter((item: { stockQuantity: number; }) => item.stockQuantity === 0).length
          });
          
          if (result.totalElements !== undefined) {
            setPagination(prev => ({
              ...prev,
              currentPage: result.number || 0,
              totalPages: result.totalPages || 0,
              totalItems: result.totalElements || 0
            }));
          }
          break;
        }
        
        case 'purchase': {
          const result = await fetchPurchaseData(dateRange, page, pagination.pageSize);
          const purchaseData = Array.isArray(result.content) ? result.content : (Array.isArray(result) ? result : result.data || []);
          setReportData(purchaseData);
          setSummary({
            totalPurchases: purchaseData.reduce((sum: number, purchase: { totalAmount: number; }) => sum + (purchase.totalAmount || 0), 0),
            totalPaid: purchaseData.reduce((sum: number, purchase: { amountPaid: number; }) => sum + (purchase.amountPaid || 0), 0),
            totalBalance: purchaseData.reduce((sum: number, purchase: { balanceDue: number; }) => sum + (purchase.balanceDue || 0), 0),
            totalItems: purchaseData.length,
            creditors: purchaseData.filter((purchase: { creditor: number; }) => purchase.creditor).length
          });
          
          if (result.totalElements !== undefined) {
            setPagination(prev => ({
              ...prev,
              currentPage: result.number || 0,
              totalPages: result.totalPages || 0,
              totalItems: result.totalElements || 0
            }));
          }
          break;
        }
        
        case 'profit': {
          try {
            const [salesResult, expenditureResult, purchaseResult] = await Promise.all([
              fetchSalesData(dateRange, 0, 1000),
              fetchExpenditureData(dateRange, 0, 1000),
              fetchPurchaseData(dateRange, 0, 1000)
            ]);

            const revenue = (salesResult.sales || []).reduce((sum, sale) => sum + sale.totalAmount, 0);
            const costOfGoodsSold = (Array.isArray(purchaseResult.content) ? purchaseResult.content : 
              Array.isArray(purchaseResult) ? purchaseResult : []).reduce((sum: number, purchase: { totalAmount: number; }) => 
                sum + (purchase.totalAmount || 0), 0);
            const operatingExpenses = (expenditureResult.content || []).reduce((sum, expense) => sum + expense.amount, 0);
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
            setPagination(prev => ({
              ...prev,
              currentPage: 0,
              totalPages: 1,
              totalItems: 1
            }));
          } catch (error) {
            throw new Error('Failed to calculate profit and loss data');
          }
          break;
        }
        
        default: {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            size: pagination.pageSize.toString(),
            startDate: dateRange.start,
            endDate: dateRange.end
          });
          
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
          const data = result.data || result.content || result || [];
          setReportData(data);
          setSummary(result.summary || {});
          
          if (result.totalElements !== undefined) {
            setPagination(prev => ({
              ...prev,
              currentPage: result.number || 0,
              totalPages: result.totalPages || 0,
              totalItems: result.totalElements || 0
            }));
          } else {
            setPagination(prev => ({
              ...prev,
              currentPage: 0,
              totalPages: 1,
              totalItems: Array.isArray(data) ? data.length : 0
            }));
          }
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchReportData(activeTab, dateRange, newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      currentPage: 0
    }));
    fetchReportData(activeTab, dateRange, 0);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Generate PDF function
  const generatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const allData = await fetchAllDataForPDF();
      const doc = new jsPDF();
      const currentTab = reportTabs.find(tab => tab.id === activeTab);
      
      doc.setFontSize(16);
      doc.text(`${currentTab?.name} - ${dateRange.start} to ${dateRange.end}`, 14, 15);
      
      let startY = 25;
      if (activeTab !== 'profit' && Object.keys(summary).length > 0) {
        doc.setFontSize(10);
        Object.entries(summary).forEach(([key, value], index) => {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          const displayValue = typeof value === 'number' ? (label.includes('Days') ? `${value} days` : `KSh ${value.toFixed(2)}`) : String(value);
          doc.text(`${label}: ${displayValue}`, 14, startY + (index * 5));
        });
        startY += (Object.keys(summary).length * 5) + 10;
      }

      const autoTable = await import('jspdf-autotable');
      
      switch (activeTab) {
        case 'sales': {
          const salesData = allData as SaleRecord[];
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
        }
        
        case 'users': {
          const userData = allData as UserRecord[];
          autoTable.default(doc, {
            startY: startY,
            head: [['Name', 'Email', 'Role', 'Last Login', 'Status', 'Created']],
            body: userData.map(user => [
              user.name,
              user.email,
              user.role,
              formatDateTime(user.lastLogin),
              user.status,
              user.createdAt ? formatDate(user.createdAt) : 'N/A'
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          break;
        }
        
        case 'debtors': {
          const debtorData = allData as DebtorRecord[];
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
            styles: { fontSize: 7 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          break;
        }

        case 'expenditure': {
          const expenditureData = allData as ExpenditureRecord[];
          autoTable.default(doc, {
            startY: startY,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: expenditureData.map(item => [
              item.date,
              item.category,
              item.description,
              `KSh${item.amount}`
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          break;
        }

        case 'itemforhire': {
          const hireData = allData as ItemForHireRecord[];
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
        }
        
        case 'inventory': {
          const inventoryData = allData as InventoryRecord[];
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
        } 

        case 'purchase': {
          const purchaseData = allData as PurchaseRecord[];
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
            styles: { fontSize: 7 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          break;
        }
        
        case 'creditors': {
          const creditorData = allData as CreditorRecord[];
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
        }
        
        case 'profit': {
          const profitLossData = allData as ProfitLossRecord[];
          if (!profitLossData || profitLossData.length === 0) {
            doc.setFontSize(12);
            doc.text('No profit and loss data available for the selected period', 14, 30);
            break;
          }
          
          const plData = profitLossData[0];
          doc.setFontSize(16);
          doc.text('Profit & Loss Statement', 14, 15);
          doc.setFontSize(10);
          doc.text(`Period: ${plData.period || `${dateRange.start} to ${dateRange.end}`}`, 14, 22);
          
          let profitStartY = 35;
          doc.setDrawColor(200, 200, 200);
          doc.line(14, profitStartY - 5, 196, profitStartY - 5);
          profitStartY += 5;
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text('REVENUE', 14, profitStartY);
          doc.text(`KSh ${(plData.revenue || 0).toFixed(2)}`, 180, profitStartY, { align: 'right' });
          profitStartY += 10;
          
          doc.setFontSize(11);
          doc.text('Less: Cost of Goods Sold', 20, profitStartY);
          doc.text(`(KSh ${(plData.costOfGoodsSold || 0).toFixed(2)})`, 180, profitStartY, { align: 'right' });
          profitStartY += 8;
          
          doc.setDrawColor(100, 100, 100);
          doc.line(14, profitStartY, 196, profitStartY);
          profitStartY += 8;
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text('GROSS PROFIT', 14, profitStartY);
          const grossProfit = plData.grossProfit || (plData.revenue || 0) - (plData.costOfGoodsSold || 0);
          doc.text(`KSh ${grossProfit.toFixed(2)}`, 180, profitStartY, { align: 'right' });
          profitStartY += 12;
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.text('OPERATING EXPENSES', 14, profitStartY);
          profitStartY += 8;
          
          doc.setFontSize(10);
          doc.text('Total Operating Expenses', 20, profitStartY);
          doc.text(`(KSh ${(plData.operatingExpenses || 0).toFixed(2)})`, 180, profitStartY, { align: 'right' });
          profitStartY += 8;
          
          doc.setDrawColor(100, 100, 100);
          doc.line(14, profitStartY, 196, profitStartY);
          profitStartY += 8;
          
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text('NET PROFIT/LOSS', 14, profitStartY);
          const netProfit = plData.netProfit || grossProfit - (plData.operatingExpenses || 0);
          const netProfitColor = netProfit >= 0 ? [0, 128, 0] : [255, 0, 0];
          doc.setTextColor(netProfitColor[0], netProfitColor[1], netProfitColor[2]);
          doc.text(`KSh ${netProfit.toFixed(2)}`, 180, profitStartY, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          profitStartY += 15;
          
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
        }
        
        default: {
          autoTable.default(doc, {
            startY: startY,
            head: [['ID', 'Data']],
            body: (allData as unknown as ReportItem[]).map((item, index) => [
              item.id || (index + 1).toString(),
              JSON.stringify(item)
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
          });
        }
      }

      doc.save(`${activeTab}-report-${dateRange.start}-to-${dateRange.end}.pdf`);
      
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
      console.error('Error generating PDF:', err);
    }
  };

  // Fetch all data for PDF export (non-paginated)
  const fetchAllDataForPDF = async () => {
    switch (activeTab) {
      case 'sales': {
        const salesResult = await fetchSalesData(dateRange, 0, 1000);
        return salesResult.sales || [];
      }
      case 'expenditure': {
        const expResult = await fetchExpenditureData(dateRange, 0, 1000);
        return expResult.content || [];
      }
      case 'users': {
        const usersResult = await fetchUsersData(0, 1000);
        return usersResult.content || [];
      }
      case 'creditors': {
        const credResult = await fetchCreditorData(dateRange, 0, 1000);
        return credResult.content || [];
      }
      case 'debtors': {
        const debtorResult = await fetchDebtorData(dateRange, 0, 1000);
        return Array.isArray(debtorResult.content) ? debtorResult.content : (Array.isArray(debtorResult) ? debtorResult : []);
      }
      case 'inventory': {
        const inventoryResult = await fetchInventoryData(0, 1000);
        return Array.isArray(inventoryResult.content) ? inventoryResult.content : (Array.isArray(inventoryResult) ? inventoryResult : []);
      }
      case 'purchase': {
        const purchaseResult = await fetchPurchaseData(dateRange, 0, 1000);
        return Array.isArray(purchaseResult.content) ? purchaseResult.content : (Array.isArray(purchaseResult) ? purchaseResult : purchaseResult.data || []);
      }
      default:
        return reportData;
    }
  };

  const exportToPDF = async () => {
    await generatePDF();
  };

  // Apply date filter
  const applyFilter = () => {
    fetchReportData(activeTab, dateRange, 0);
  };

  // Load data when tab changes or component mounts
  useEffect(() => {
    fetchReportData(activeTab, dateRange, 0);
  }, [activeTab]);

  // Update pagination when pageSize changes
  useEffect(() => {
    if (pagination.currentPage === 0) {
      fetchReportData(activeTab, dateRange, 0);
    } else {
      setPagination(prev => ({ ...prev, currentPage: 0 }));
    }
  }, [pagination.pageSize]);

  // Render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 0}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              pagination.currentPage === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages - 1}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              pagination.currentPage >= pagination.totalPages - 1
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{pagination.currentPage * pagination.pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalItems)}
              </span>{' '}
              of <span className="font-medium">{pagination.totalItems}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">Items per page:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 0}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                  pagination.currentPage === 0 
                    ? 'cursor-not-allowed bg-gray-50' 
                    : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i;
                } else if (pagination.currentPage < 2) {
                  pageNum = i;
                } else if (pagination.currentPage > pagination.totalPages - 3) {
                  pageNum = pagination.totalPages - 5 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      pageNum === pagination.currentPage
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages - 1}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${
                  pagination.currentPage >= pagination.totalPages - 1
                    ? 'cursor-not-allowed bg-gray-50' 
                    : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

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

    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
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
                {salesData.map((sale) => (
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

      case 'users':
        const usersData = reportData as UserRecord[];
        if (!Array.isArray(usersData)) {
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
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData.map((user) => {
                const lastLogin = new Date(user.lastLogin);
                const now = new Date();
                const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'STAFF'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{formatDateTime(user.lastLogin)}</div>
                        <div className={`text-xs ${daysSinceLogin > 30 ? 'text-red-600' : daysSinceLogin > 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {daysSinceLogin === 0 ? 'Today' : `${daysSinceLogin} days ago`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              {expenditureData.map((expense) => (
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

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Profit & Loss Statement</h3>
                <p className="text-sm text-gray-500">Period: {data.period}</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Revenue</span>
                    <span className="font-semibold text-green-600">KSh {data.revenue?.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 ml-4">Cost of Goods Sold</span>
                    <span className="text-red-600">(KSh {data.costOfGoodsSold?.toFixed(2)})</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 bg-gray-50 px-2 -mx-2">
                    <span className="font-medium text-gray-700">Gross Profit</span>
                    <span className={`font-semibold ${data.grossProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      KSh {data.grossProfit?.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Operating Expenses</span>
                    <span className="text-red-600">(KSh {data.operatingExpenses?.toFixed(2)})</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-t border-gray-300 bg-gray-50 px-2 -mx-2 mt-4">
                    <span className="font-bold text-gray-900">Net Profit/Loss</span>
                    <span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      KSh {data.netProfit?.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <span className={`text-sm font-semibold ${data.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.margin?.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
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
              disabled={isLoading || (Array.isArray(reportData) && reportData.length === 0)}
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
                      key.toLowerCase().includes('sales') || 
                      key.toLowerCase().includes('profit') || 
                      key.toLowerCase().includes('expenditure') || 
                      key.toLowerCase().includes('amount') || 
                      key.toLowerCase().includes('revenue') || 
                      key.toLowerCase().includes('cost') || 
                      key.toLowerCase().includes('average') && key.toLowerCase().includes('expense')
                        ? `KSh ${value.toFixed(2)}`
                        : key.toLowerCase().includes('days') || key.toLowerCase().includes('login')
                        ? `${value} days`
                        : value.toLocaleString()
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
          
          {/* Pagination Controls */}
          {renderPagination()}
        </div>
      </div>
    </div>
  );
}