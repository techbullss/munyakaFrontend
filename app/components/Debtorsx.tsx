// app/dashboard/debtors/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  
  PhoneIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
 
} from '@heroicons/react/24/outline';

// Import debtorService (adjust the path as needed)
import { debtorService } from '../services/debtorService';

// Type definitions
type PaymentStatus = 'OVERDUE' | 'PENDING' | 'PAID';

type Sale = {
  id: number;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
};

type Debtor = {
  id: number;
  customerName: string;
  customerPhone: string;
  totalDebt: number;
  lastSaleDate: string;
  paymentStatus: PaymentStatus;
  sales: Sale[];
};


export default function Debtors() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadDebtors();
  }, []);

  const loadDebtors = async () => {
    try {
      setLoading(true);
      const data = await debtorService.getDebtors();
      setDebtors(data);
    } catch (err) {
      setError('Failed to load debtors');
      console.error('Error loading debtors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDebtors = useMemo(() => {
  return debtors.filter((debtor: Debtor) => 
    debtor.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debtor.customerPhone.includes(searchTerm)
  );
}, [debtors, searchTerm]);

  const totalReceivable = useMemo(() => 
  debtors.reduce((sum: number, debtor: Debtor) => sum + debtor.totalDebt, 0),
  [debtors]);
  const overdueAmount = useMemo(() => 
  debtors
    .filter((d: Debtor) => d.paymentStatus === 'OVERDUE')
    .reduce((sum: number, debtor: Debtor) => sum + debtor.totalDebt, 0),
  [debtors]);

  const handleRecordPayment = (debtor: Debtor, saleId?: number): void => {
    setSelectedDebtor(debtor);
    setSelectedSaleId(saleId || null);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleViewDetails = (debtor: Debtor): void => {
    setSelectedDebtor(debtor);
    setShowDetailsModal(true);
  };

  const processPayment = async (): Promise<void> => {
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    
    try {
      if (selectedSaleId) {
        // Record payment for specific sale
        await debtorService.recordPayment(selectedSaleId, amount);
      } else if (selectedDebtor) {
        // Record payment for the first pending sale of this debtor
        const pendingSale = selectedDebtor.sales.find(sale => sale.paymentStatus === 'PENDING');
        if (pendingSale) {
          await debtorService.recordPayment(pendingSale.id, amount);
        }
      }

      // Reload debtors to get updated data
      await loadDebtors();
      setShowPaymentModal(false);
      setSelectedDebtor(null);
      setSelectedSaleId(null);
      alert(`Payment of $${amount.toFixed(2)} recorded successfully`);
    } catch (err) {
      alert('Failed to record payment');
      console.error('Error recording payment:', err);
    }
  };

  const getStatusBadgeClass = (status: PaymentStatus): string => {
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading debtors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Debtors Management</h1>
          <p className="text-gray-600">Manage customers with pending payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">ksh{totalReceivable.toFixed(2)}</h2>
              <p className="text-sm text-gray-500">Total Receivable</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">ksh{overdueAmount.toFixed(2)}</h2>
              <p className="text-sm text-gray-500">Overdue Amount</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">{debtors.length}</h2>
              <p className="text-sm text-gray-500">Active Debtors</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Debtors List</h2>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="py-2 px-4 block w-full leading-5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Search by name or phone..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Debt</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sale</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDebtors.map((debtor: Debtor) => (
                  <tr key={debtor.id} className={debtor.paymentStatus === 'OVERDUE' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {debtor.customerName.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{debtor.customerName}</div>
                          <div className="text-sm text-gray-500">{debtor.sales.length} pending sale(s)</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {debtor.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      KSh {debtor.totalDebt?.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(debtor.lastSaleDate)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(debtor.paymentStatus)}`}>
                        {debtor.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleRecordPayment(debtor)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Record Payment
                      </button>
                      <button 
                        onClick={() => handleViewDetails(debtor)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredDebtors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No debtors found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDebtor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Customer: <span className="font-medium">{selectedDebtor.customerName}</span></p>
              <p className="text-sm text-gray-600">Phone: <span className="font-medium">{selectedDebtor.customerPhone}</span></p>
              <p className="text-sm text-gray-600">Total Debt: <span className="font-medium">${selectedDebtor.totalDebt.toFixed(2)}</span></p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
                step="0.01"
                min="0.01"
                max={selectedDebtor.totalDebt}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDebtor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Debtor Details - {selectedDebtor.customerName}
            </h3>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span> {selectedDebtor.customerName}
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span> {selectedDebtor.customerPhone}
                </div>
                <div>
                  <span className="text-gray-500">Total Debt:</span> ${selectedDebtor.totalDebt.toFixed(2)}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span> 
                  <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedDebtor.paymentStatus)}`}>
                    {selectedDebtor.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <h4 className="font-medium text-gray-700 mb-2">Pending Sales</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sale Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDebtor.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 text-sm">{formatDate(sale.saleDate)}</td>
                      <td className="px-4 py-2 text-sm">ksh{sale.totalAmount?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">ksh{sale.paidAmount?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm font-medium">ksh{sale.balanceDue?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => handleRecordPayment(selectedDebtor, sale.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
                
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}