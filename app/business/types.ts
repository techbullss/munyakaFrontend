// app/business/types.ts
export interface SaleItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  createdAt: string;
  timestamp: Date;
  saleItems: SaleItem[];
  total: number;
  grandTotal: number;
  amountPaid: number;
  change: number;
  note: string;
  id: number;
  customerPhone: string;
  customerName: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  balanceDue: number;
  paymentMethod: string;
  profit: number;
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE';
  items: SaleItem[];
}

export interface Debtor {
  id: number;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  lastSaleDate: string;
  paymentStatus: 'PENDING' | 'OVERDUE';
  sales: Sale[];
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';