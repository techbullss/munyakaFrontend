"use client";
import { useEffect, useState } from 'react';
import { 
  MagnifyingGlassIcon, 

  EnvelopeIcon, 
  PhoneIcon, 
  CurrencyDollarIcon,
 
  ExclamationTriangleIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import { useMemo } from 'react';
type Creditor = {
  id: number;
  supplierName: string;
  supplierEmail: string;
  supplierPhone:string;
  contact: string;
  email: string;
  phone: string;
  balance: number;
  dueDate: string;
  status: 'Pending' | 'Overdue' | 'Paid';
  creditTerms: string;
  lastPayment: string | null;
  paymentAmount: number;
};

export default function Creditors() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  
  const [selectedCreditor, setSelectedCreditor] = useState<Creditor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function loadCreditors() {
      try {
        const res = await fetch('http://localhost:8080/api/creditors?page=0&size=20');
        if (!res.ok) throw new Error('Failed to load creditors');
        const page = await res.json();
        // Spring's Page<> returns {content:[], totalElements,...}
        setCreditors(page.content);
      } catch (err) {
       setError('Error fetching creditors');
       
      } 
     
    }
    loadCreditors();
  }, []);
const filteredCreditors = useMemo(() => {
  return creditors.filter((creditor: Creditor) =>
    (creditor.supplierName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (creditor.contact ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [creditors, searchTerm]);

 const totalPayable = useMemo(() => 
  creditors.reduce((sum, c) => sum + c.balance, 0),
[creditors]);

const overdueAmount = useMemo(() => 
  creditors.filter(c => c.status === 'Overdue').reduce((sum, c) => sum + c.balance, 0),
[creditors]);

  const handleRecordPayment = (creditor: Creditor): void => {
    setSelectedCreditor(creditor);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

 const processPayment = async (): Promise<void> => {
  if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
        window.showToast("Invalid payment amount", "error");
    return;
  }

  const amount: number = parseFloat(paymentAmount);

  if (selectedCreditor && amount > selectedCreditor.balance) {
    window.showToast('Payment amount cannot exceed the balance', 'error');
    return;
  }

  if (!selectedCreditor) return;

  try {
    // 1️⃣  Send payment to backend
const res = await fetch(
  `http://localhost:8080/api/creditors/pay/${selectedCreditor.id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  }
);
   

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    // 2️⃣  Get updated creditor from backend
    const updatedCreditor: Creditor = await res.json();

    // 3️⃣  Update local state with backend result
    setCreditors(prev =>
      prev.map(c => c.id === updatedCreditor.id ? updatedCreditor : c)
    );

    setShowPaymentModal(false);
    setSelectedCreditor(null);
  } catch (err) {
    console.error('Payment failed:', err);
  }
};
  return (
    <div className="max-w-7xl mx-auto">
      {error && (
  <div className="text-red-500 mb-4">{error}</div>
)}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Creditors Management</h1>
          <p className="text-gray-600">Manage suppliers and vendors your business owes money to</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Ksh{totalPayable.toFixed(2)}</h2>
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
              <h2 className="text-lg font-semibold text-gray-900">Ksh{overdueAmount.toFixed(2)}</h2>
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
  {(creditor.supplierName ?? '').charAt(0) || '?'}
</div>
                         
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{creditor.supplierName}</div>
                          <div className="text-sm text-gray-500">ID: #{creditor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{creditor.contact}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {creditor.supplierEmail}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {creditor.supplierPhone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Ksh{creditor.balance.toFixed(2)}
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full }`}>
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
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-900">
              Total Payable: Ksh{totalPayable.toFixed(2)}
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
              <p className="text-sm text-gray-600">Creditor: <span className="font-medium">{selectedCreditor.supplierName}</span></p>
              <p className="text-sm text-gray-600">Current Balance: <span className="font-medium">Ksh{selectedCreditor.balance.toFixed(2)}</span></p>
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