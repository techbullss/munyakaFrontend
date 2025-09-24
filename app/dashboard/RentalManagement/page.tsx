"use client";
import { useState, useEffect } from "react";

// Rental transaction types
interface RentalPayment {
  id: number;
  amount: number;
  paymentType: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  isDeposit: boolean;
}

interface RentalTransaction {
  balanceDue: any;
  id?: number;
  rentalItem: RentalItem;
  customerName: string;
  customerPhone: string;
  customerIdNumber?: string;
  rentalStartDate: string;
  expectedReturnDate: string;
  rentalEndDate?: string;
  quantityRented: number;
  totalAmount: number;
  depositPaid: number;
  status: string;
  createdAt?: string;
  returnedAt?: string;
  notes?: string;
}

interface RentalItem {
  id: number;
  name: string;
  dailyRate: number;
  depositAmount: number;
  availableQuantity: number;
}

// API service functions
const rentalTransactionApi = {
  getRentalTransactions: async (): Promise<RentalTransaction[]> => {
    const response = await fetch('http://localhost:8080/api/rental-transactions');
    if (!response.ok) throw new Error('Failed to fetch rental transactions');
    return response.json();
  },

  createRentalTransaction: async (transaction: RentalTransaction): Promise<RentalTransaction> => {
    const response = await fetch('http://localhost:8080/api/rental-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Failed to create rental transaction');
    return response.json();
  },

  returnRentalItem: async (id: number): Promise<RentalTransaction> => {
    const response = await fetch(`http://localhost:8080/api/rental-transactions/${id}/return`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to return rental item');
    return response.json();
  },

  getRentalItems: async (): Promise<RentalItem[]> => {
    const response = await fetch('http://localhost:8080/api/rental-items');
    if (!response.ok) throw new Error('Failed to fetch rental items');
    return response.json();
  },
};

// Rental Modal Component
function RentItemModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerIdNumber: '',
    rentalStartDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    quantityRented: 1,
    depositPaid: 0,
    notes: ''
  });

  useEffect(() => {
    loadRentalItems();
  }, []);

  useEffect(() => {
    if (selectedItem && formData.quantityRented > 0) {
      const days = Math.ceil((new Date(formData.expectedReturnDate).getTime() - 
                            new Date(formData.rentalStartDate).getTime()) / (1000 * 3600 * 24));
      const totalAmount = selectedItem.dailyRate * days * formData.quantityRented;
      setFormData(prev => ({ ...prev, depositPaid: selectedItem.depositAmount * formData.quantityRented }));
    }
  }, [selectedItem, formData.quantityRented, formData.rentalStartDate, formData.expectedReturnDate]);

  const loadRentalItems = async () => {
    try {
      const items = await rentalTransactionApi.getRentalItems();
      setRentalItems(items.filter(item => item.availableQuantity > 0));
    } catch (error) {
      console.error('Error loading rental items:', error);
      alert('Failed to load rental items');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Please select a rental item');
      return;
    }

    try {
      const transaction: RentalTransaction = {
          rentalItem: selectedItem,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerIdNumber: formData.customerIdNumber,
          rentalStartDate: formData.rentalStartDate,
          expectedReturnDate: formData.expectedReturnDate,
          quantityRented: formData.quantityRented,
          totalAmount: selectedItem.dailyRate *
              Math.ceil((new Date(formData.expectedReturnDate).getTime() -
                  new Date(formData.rentalStartDate).getTime()) / (1000 * 3600 * 24)) *
              formData.quantityRented,
          depositPaid: formData.depositPaid,
          status: 'PENDING',
          notes: formData.notes,
          balanceDue: undefined
      };

      await rentalTransactionApi.createRentalTransaction(transaction);
      alert('Rental transaction created successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating rental transaction:', error);
      alert('Failed to create rental transaction');
    }
  };

  const daysDifference = selectedItem ? Math.ceil(
    (new Date(formData.expectedReturnDate).getTime() - 
     new Date(formData.rentalStartDate).getTime()) / (1000 * 3600 * 24)
  ) : 0;

  const totalAmount = selectedItem ? selectedItem.dailyRate * daysDifference * formData.quantityRented : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Rent Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Item to Rent*</label>
            <select
              value={selectedItem?.id || ''}
              onChange={(e) => setSelectedItem(rentalItems.find(item => item.id === parseInt(e.target.value)) || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Item</option>
              {rentalItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - KES {item.dailyRate}/day (Available: {item.availableQuantity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name*</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone*</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input
              type="text"
              value={formData.customerIdNumber}
              onChange={(e) => setFormData({ ...formData, customerIdNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
              <input
                type="date"
                value={formData.rentalStartDate}
                onChange={(e) => setFormData({ ...formData, rentalStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date*</label>
              <input
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                min={formData.rentalStartDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity*</label>
              <input
                type="number"
                value={formData.quantityRented}
                onChange={(e) => setFormData({ ...formData, quantityRented: parseInt(e.target.value) || 1 })}
                min="1"
                max={selectedItem?.availableQuantity || 1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {selectedItem && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-2">Rental Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Daily Rate:</div>
                <div className="text-right">KES {selectedItem.dailyRate.toFixed(2)}</div>
                
                <div>Rental Period:</div>
                <div className="text-right">{daysDifference} day(s)</div>
                
                <div>Quantity:</div>
                <div className="text-right">{formData.quantityRented}</div>
                
                <div className="font-medium">Subtotal:</div>
                <div className="text-right font-medium">KES {totalAmount.toFixed(2)}</div>
                
                <div>Deposit:</div>
                <div className="text-right">KES {(selectedItem.depositAmount * formData.quantityRented).toFixed(2)}</div>
                
                <div className="font-medium text-green-600">Total Amount:</div>
                <div className="text-right font-medium text-green-600">KES {totalAmount.toFixed(2)}</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Rental
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Rental Management Component
export default function RentalManagement() {
  const [rentalTransactions, setRentalTransactions] = useState<RentalTransaction[]>([]);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
 const [selectedRental, setSelectedRental] = useState<RentalTransaction | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [payments, setPayments] = useState<RentalPayment[]>([]);

  const loadPayments = async (rentalId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/rental-transactions/${rentalId}/payments`);
      if (response.ok) {
        const paymentData = await response.json();
        setPayments(paymentData);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handlePayment = (rental: RentalTransaction) => {
    setSelectedRental(rental);
    setShowPaymentModal(true);
  };

  const handleReturn = (rental: RentalTransaction) => {
    setSelectedRental(rental);
    setShowReturnModal(true);
  };

  const handleViewPayments = async (rental: RentalTransaction) => {
    setSelectedRental(rental);
    if (rental.id) {
      await loadPayments(rental.id);
      setShowPayments(true);
    }
  };
  useEffect(() => {
    loadRentalTransactions();
  }, []);

  const loadRentalTransactions = async () => {
    try {
      setLoading(true);
      const transactions = await rentalTransactionApi.getRentalTransactions();
      setRentalTransactions(transactions);
    } catch (error) {
      console.error('Error loading rental transactions:', error);
      alert('Failed to load rental transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnItem = async (id: number) => {
    if (confirm('Are you sure you want to mark this item as returned?')) {
      try {
        await rentalTransactionApi.returnRentalItem(id);
        alert('Item returned successfully!');
        loadRentalTransactions();
      } catch (error) {
        console.error('Error returning item:', error);
        alert('Failed to return item');
      }
    }
  };

  const filteredTransactions = rentalTransactions.filter(transaction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return transaction.status === 'ACTIVE';
    if (activeTab === 'overdue') {
      const expectedReturn = new Date(transaction.expectedReturnDate);
      const today = new Date();
      return transaction.status === 'ACTIVE' && expectedReturn < today;
    }
    return transaction.status === activeTab.toUpperCase();
  });

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rental Management</h1>
        <p className="text-gray-600">Manage tool and equipment rentals</p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
            {['all', 'active', 'overdue', 'completed', 'pending'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            onClick={() => setIsRentModalOpen(true)}
          >
            New Rental
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rental Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{transaction.rentalItem.name}</div>
                      <div className="text-sm text-gray-500">Qty: {transaction.quantityRented}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{transaction.customerName}</div>
                      <div className="text-sm text-gray-500">{transaction.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(transaction.rentalStartDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        → {new Date(transaction.expectedReturnDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        KES {transaction.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Deposit: KES {transaction.depositPaid.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(transaction.status)}
                    </td>

                     <td className="px-6 py-4 text-sm font-medium">
    {transaction.status === 'ACTIVE' && (
      <>
        <button
          onClick={() => handlePayment(transaction)}
          className="text-green-600 hover:text-green-900 mr-3"
        >
          Payment
        </button>
        <button
          onClick={() => handleReturn(transaction)}
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          Return
        </button>
      </>
    )}
    <button
      onClick={() => handleViewPayments(transaction)}
      className="text-gray-600 hover:text-gray-900"
    >
      Payments
    </button>
  </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No rental transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {isRentModalOpen && (
        <RentItemModal
          onClose={() => setIsRentModalOpen(false)}
          onSave={loadRentalTransactions}
        />
      )}
        {showPaymentModal && selectedRental && (
    <PaymentModal
      rental={selectedRental}
      onClose={() => setShowPaymentModal(false)}
      onSave={loadRentalTransactions}
    />
  )}
  
  {showReturnModal && selectedRental && (
    <ReturnModal
      rental={selectedRental}
      onClose={() => setShowReturnModal(false)}
      onSave={loadRentalTransactions}
    />
  )}
    </div>
  );
  function PaymentModal({ 
  rental, 
  onClose, 
  onSave 
}: { 
  rental: RentalTransaction; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [formData, setFormData] = useState({
    amount: rental.balanceDue,
    paymentType: 'CASH',
    referenceNumber: '',
    notes: '',
    isDeposit: false
  });

  const paymentTypes = [
    { value: 'CASH', label: 'Cash' },
    { value: 'MPESA', label: 'M-Pesa' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:8080/api/rental-transactions/${rental.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      alert('Payment processed successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Process Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)*</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              min="0"
              max={rental.balanceDue}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Balance due: KES {rental.balanceDue.toFixed(2)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type*</label>
            <select
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {paymentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          {formData.paymentType !== 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number*</label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={formData.paymentType !== 'CASH'}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isDeposit}
              onChange={(e) => setFormData({ ...formData, isDeposit: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">This is a deposit payment</label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Process Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function ReturnModal({ 
  rental, 
  onClose, 
  onSave 
}: { 
  rental: RentalTransaction; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [formData, setFormData] = useState({
    returnCondition: 'GOOD',
    damageCharges: 0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  const returnConditions = [
    { value: 'EXCELLENT', label: 'Excellent - No issues' },
    { value: 'GOOD', label: 'Good - Minor wear' },
    { value: 'DAMAGED', label: 'Damaged - Requires repair' },
    { value: 'LOST', label: 'Lost - Item not returned' }
  ];

  const calculateLateFees = () => {
    const expectedReturn = new Date(rental.expectedReturnDate);
    const today = new Date();
    const daysLate = Math.max(0, Math.ceil((today.getTime() - expectedReturn.getTime()) / (1000 * 3600 * 24)));
    return daysLate * rental.rentalItem.dailyRate * 0.5; // 50% of daily rate
  };

  const calculateTotalDue = () => {
    const lateFees = calculateLateFees();
    return (rental.balanceDue || 0) + lateFees + formData.damageCharges;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const returnData = {
        returnCondition: formData.returnCondition,
        damageCharges: formData.damageCharges,
        notes: formData.notes
      };

      const response = await fetch(`http://localhost:8080/api/rental-transactions/${rental.id}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const returnedRental = await response.json();
      alert('Item returned successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error returning item:', error);
      alert(`Failed to return item: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const lateFees = calculateLateFees();
  const totalDue = calculateTotalDue();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Return Item</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Condition*</label>
            <select
              value={formData.returnCondition}
              onChange={(e) => setFormData({ ...formData, returnCondition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              {returnConditions.map(condition => (
                <option key={condition.value} value={condition.value}>{condition.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Damage Charges (KES)</label>
            <input
              type="number"
              value={formData.damageCharges}
              onChange={(e) => setFormData({ ...formData, damageCharges: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe any damage or issues with the returned item..."
              disabled={loading}
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-700 mb-2">Return Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Item:</div>
              <div className="text-right font-medium">{rental.rentalItem.name}</div>
              
              <div>Outstanding Balance:</div>
              <div className="text-right">KES {(rental.balanceDue || 0).toFixed(2)}</div>
              
              <div>Late Fees ({Math.max(0, Math.ceil((new Date().getTime() - new Date(rental.expectedReturnDate).getTime()) / (1000 * 3600 * 24)))} days):</div>
              <div className="text-right">KES {lateFees.toFixed(2)}</div>
              
              <div>Damage Charges:</div>
              <div className="text-right">KES {formData.damageCharges.toFixed(2)}</div>
              
              <div className="font-medium border-t pt-1 text-green-600">Total Due:</div>
              <div className="text-right font-medium border-t pt-1 text-green-600">KES {totalDue.toFixed(2)}</div>
            </div>
            
            {formData.returnCondition === 'LOST' && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  ⚠️ Warning: Marking as LOST will remove this item from inventory.
                </p>
              </div>
            )}
            
            {formData.returnCondition === 'DAMAGED' && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  ⚠️ Item will be marked for repair and unavailable for rental.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Process Return'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
}