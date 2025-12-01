// app/services/debtorService.ts
import { Debtor, Sale } from '@/app/business/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const debtorService = {
  // Get all debtors (customers with pending payments)
  async getDebtors(): Promise<Debtor[]> {
    const response = await fetch(`${API_BASE_URL}/sales/debtors`);
    if (!response.ok) throw new Error('Failed to fetch debtors');
    return response.json();
  },

  // Get sales with pending payments
  async getPendingSales(): Promise<Sale[]> {
    const response = await fetch(`${API_BASE_URL}/sales/pending`);
    if (!response.ok) throw new Error('Failed to fetch pending sales');
    return response.json();
  },

  // Record a payment for a sale
  async recordPayment(saleId: number, paymentAmount: number): Promise<Sale> {
    const response = await fetch(`http://localhost:8080/api/sales/payment/${saleId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentAmount }),
    });
    if (!response.ok) throw new Error('Failed to record payment');
    return response.json();
  },

  // Get debtor details by customer phone
  async getDebtorByPhone(phone: string): Promise<Debtor> {
    const response = await fetch(`${API_BASE_URL}/sales/debtors/${phone}`);
    if (!response.ok) throw new Error('Failed to fetch debtor details');
    return response.json();
  }
};