'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE';
}

interface Debtor {
  id: number;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE';
  lastSaleDate: string;
  sales: Sale[];
}

export default function Debtors() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadDebtors();
  }, []);

  const loadDebtors = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/api/sales/debtors');
      if (!res.ok) throw new Error('Failed to fetch debtors');
      const data = await res.json();
      setDebtors(data);
    } catch (err) {
      console.error('Error loading debtors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDebtors = useMemo(() => {
    return debtors.filter(
      (debtor) =>
        debtor.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debtor.customerPhone.includes(searchTerm)
    );
  }, [debtors, searchTerm]);

  const totalReceivable = useMemo(
    () => debtors.reduce((sum, d) => sum + d.totalDebt, 0),
    [debtors]
  );

  const overdueAmount = useMemo(
    () =>
      debtors
        .filter((d) => d.paymentStatus === 'OVERDUE')
        .reduce((sum, d) => sum + d.totalDebt, 0),
    [debtors]
  );

  const recordPayment = async (saleId: number) => {
    if (!paymentAmount) {
      window.showToast("no payment","success")
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/sales/payment/${saleId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentAmount: parseFloat(paymentAmount) }),
        }
      );
      if (!res.ok) throw new Error('Failed to record payment');
      window.showToast('Payment recorded successfully!', 'success');

      setShowModal(false);
      setPaymentAmount('');
      await loadDebtors();
    } catch (err) {
      console.error('Error recording payment:', err);
      window.showToast('Failed to record payment', 'error');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading debtors...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Debtors Management</h1>
          <p className="text-gray-600">Manage customers with pending payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-blue-100 p-3">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-900">
              KSh {totalReceivable.toFixed(2)}
            </h2>
            <p className="text-sm text-gray-500">Total Receivable</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-red-100 p-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-900">
              KSh {overdueAmount.toFixed(2)}
            </h2>
            <p className="text-sm text-gray-500">Overdue Amount</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-green-100 p-3">
            <ClockIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-900">{debtors.length}</h2>
            <p className="text-sm text-gray-500">Active Debtors</p>
          </div>
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Debtors List</h2>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 px-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Search by name or phone..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Debt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Sale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDebtors.map((debtor) => (
                  <tr key={debtor.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {debtor.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {debtor.customerPhone}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      KSh {debtor.totalDebt.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(debtor.lastSaleDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          debtor.paymentStatus
                        )}`}
                      >
                        {debtor.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedDebtor(debtor);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDebtors.length === 0 && (
              <div className="text-center py-8 text-gray-500">No debtors found</div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && selectedDebtor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
            <p className="text-sm mb-2">
              {selectedDebtor.customerName} — KSh {selectedDebtor.totalDebt.toFixed(2)} due
            </p>

            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border rounded p-2 mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  selectedDebtor.sales.length > 0 &&
                  recordPayment(selectedDebtor.sales[0].id)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
