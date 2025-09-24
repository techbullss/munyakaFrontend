// types/business.ts
export interface Debtor {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  dueDate: string;
  status: 'Overdue' | 'Pending' | 'Paid';
  creditLimit: number;
  lastPayment: string;
  paymentAmount: number;
}

export interface Creditor {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  balance: number;
  dueDate: string;
  status: 'Overdue' | 'Pending' | 'Paid';
  creditTerms: string;
  lastPayment: string;
  paymentAmount: number;
}

export type PaymentStatus = 'Overdue' | 'Pending' | 'Paid';