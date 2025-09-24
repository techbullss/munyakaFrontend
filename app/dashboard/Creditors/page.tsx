// app/dashboard/creditors/page.tsx
'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { Creditor, PaymentStatus } from '@/app/business';

export default function Creditors() {
  const [creditors, setCreditors] = useState<Creditor[]>([
    { 
      id: 1, 
      name: 'ABC Suppliers', 
      contact: 'John Doe', 
      email: 'john@abcsuppliers.com', 
      phone: '555-0123', 
      balance: 2500.00, 
      dueDate: '2023-06-15',
      status: 'Pending',
      creditTerms: 'Net 30',
      lastPayment: '2023-04-20',
      paymentAmount: 1000.00
    },
    { 
      id: 2, 
      name: 'XYZ Wholesale', 
      contact: 'Jane Smith', 
      email: 'jane@xyzwholesale.com', 
      phone: '555-0456', 
      balance: 1250.75, 
      dueDate: '2023-06-20',
      status: 'Pending',
      creditTerms: 'Net 15',
      lastPayment: '2023-05-05',
      paymentAmount: 750.00
    },
    { 
      id: 3, 
      name: 'Global Distributors', 
      contact: 'Mike Johnson', 
      email: 'mike@globaldist.com', 
      phone: '555-0789', 
      balance: 3750.50, 
      dueDate: '2023-05-30',
      status: 'Overdue',
      creditTerms: 'Net 30',
      lastPayment: '2023-03-15',
      paymentAmount: 1200.00
    },
    { 
      id: 4, 
      name: 'Premium Goods Inc', 
      contact: 'Sarah Wilson', 
      email: 'sarah@premiumgoods.com', 
      phone: '555-0912', 
      balance: 820.25, 
      dueDate: '2023-07-05',
      status: 'Pending',
      creditTerms: 'Net 45',
      lastPayment: '2023-05-22',
      paymentAmount: 500.00
    },
  ]);

  const [selectedCreditor, setSelectedCreditor] = useState<Creditor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCreditors = creditors.filter((creditor: Creditor) => 
    creditor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creditor.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayable: number = creditors.reduce((sum: number, creditor: Creditor) => sum + creditor.balance, 0);
  const overdueAmount: number = creditors
    .filter((c: Creditor) => c.status === 'Overdue')
    .reduce((sum: number, creditor: Creditor) => sum + creditor.balance, 0);

  const handleRecordPayment = (creditor: Creditor): void => {
    setSelectedCreditor(creditor);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const processPayment = (): void => {
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const amount: number = parseFloat(paymentAmount);
    if (selectedCreditor && amount > selectedCreditor.balance) {
      alert('Payment amount cannot exceed the balance');
      return;
    }

    if (selectedCreditor) {
      // Update the creditor's balance
      setCreditors(prev => prev.map(c => 
        c.id === selectedCreditor.id 
          ? { 
              ...c, 
              balance: c.balance - amount,
              status: (c.balance - amount) > 0 ? 'Pending' : 'Paid',
              lastPayment: new Date().toISOString().split('T')[0],
              paymentAmount: amount
            } 
          : c
      ));

      setShowPaymentModal(false);
      setSelectedCreditor(null);
      alert(`Payment of $${amount.toFixed(2)} recorded successfully to ${selectedCreditor.name}`);
    }
  };

  const getStatusBadgeClass = (status: PaymentStatus): string => {
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Creditors Management</h1>
          <p className="text-gray-600">Manage suppliers and vendors your business owes money to</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Creditor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">${totalPayable.toFixed(2)}</h2>
              <p className="text-sm text-gray-500">Total Payable</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">${overdueAmount.toFixed(2)}</h2>
              <p className="text-sm text-gray-500">Overdue Amount</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <BuildingStorefrontIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">{creditors.length}</h2>
              <p className="text-sm text-gray-500">Active Creditors</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Creditors List</h2>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="py-2 px-4 block w-full leading-5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Search creditors..."
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
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creditor</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terms</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCreditors.map((creditor: Creditor) => (
                  <tr key={creditor.id} className={creditor.status === 'Overdue' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                            {creditor.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{creditor.name}</div>
                          <div className="text-sm text-gray-500">ID: #{creditor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{creditor.contact}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {creditor.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {creditor.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${creditor.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {creditor.dueDate}
                      {creditor.status === 'Overdue' && (
                        <span className="ml-2 text-xs text-red-500">(Overdue)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {creditor.creditTerms}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(creditor.status)}`}>
                        {creditor.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleRecordPayment(creditor)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Record Payment
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-900">
              Total Payable: ${totalPayable.toFixed(2)}
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">Previous</button>
              <button className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCreditor && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment to Creditor</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Creditor: <span className="font-medium">{selectedCreditor.name}</span></p>
              <p className="text-sm text-gray-600">Current Balance: <span className="font-medium">${selectedCreditor.balance.toFixed(2)}</span></p>
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
                max={selectedCreditor.balance}
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
    </div>
  );
}