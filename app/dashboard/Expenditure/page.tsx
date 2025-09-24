'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Expenditure {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
}

const categories = ['Utilities', 'Rent', 'Salaries', 'Office Supplies', 'Maintenance', 'Marketing', 'Other'];

export default function Expenditures() {
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(5);
  const [total, setTotal] = useState<number>(0);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expenditure | null>(null);

  const fetchExpenditures = async () => {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(categoryFilter !== 'All Categories' && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm }),
      } as any);
      const res = await fetch(`http://localhost:8080/api/expenditures?${query.toString()}`);
      const data = await res.json();
      setExpenditures(data.content);
      setTotal(data.totalElements);
    } catch (err) {
      console.error('Error fetching expenditures', err);
    }
  };

  useEffect(() => {
    fetchExpenditures();
  }, [page, categoryFilter, searchTerm]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expenditure?')) return;
    try {
      await fetch(`http://localhost:8080/api/expenditures/${id}`, { method: 'DELETE' });
      fetchExpenditures();
    } catch (err) {
      console.error('Error deleting expenditure', err);
    }
  };

  const handleSave = async (expense: Partial<Expenditure>) => {
    try {
      if (editingExpense) {
        // Edit
        await fetch(`http://localhost:8080/api/expenditures/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expense),
        });
      } else {
        // Create
        await fetch(`http://localhost:8080/api/expenditures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expense),
        });
      }
      setShowModal(false);
      setEditingExpense(null);
      fetchExpenditures();
    } catch (err) {
      console.error('Error saving expenditure', err);
    }
  };

  const totalAmount = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
  const avgAmount = expenditures.length ? totalAmount / expenditures.length : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenditure Tracking</h1>
          <p className="text-gray-600">Track and manage business expenses</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => setShowModal(true)}
        >
          <PlusIcon className="h-5 w-5 mr-1" /> New Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Expenses</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">${totalAmount.toFixed(2)}</p>
          <p className="mt-1 text-sm text-gray-500">This page</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Average Expense</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">${avgAmount.toFixed(2)}</p>
          <p className="mt-1 text-sm text-gray-500">Per transaction</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Recent Expenditures</h2>
          <div className="flex space-x-2">
            <select
              className="py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option>All Categories</option>
              {categories.map(cat => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="py-2 px-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Search expenses..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenditures.map(exp => (
                <tr key={exp.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{exp.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{exp.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{exp.description}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${exp.amount.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{exp.paymentMethod}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900" onClick={() => { setEditingExpense(exp); setShowModal(true); }}>
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(exp.id)}>
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-900">
              Total: {total} items
            </div>
            <div className="flex space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={(page + 1) * size >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          expense={editingExpense}
          onClose={() => { setShowModal(false); setEditingExpense(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Modal Component
interface ModalProps {
  expense: Expenditure | null;
  onClose: () => void;
  onSave: (expense: Partial<Expenditure>) => void;
}

function Modal({ expense, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState<Partial<Expenditure>>(expense || { date: '', category: '', description: '', amount: 0, paymentMethod: '' });

  const handleChange = (key: keyof Expenditure, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
        <div className="space-y-3">
          <input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e => handleChange('date', e.target.value)} />
          <select className="w-full border p-2 rounded" value={form.category} onChange={e => handleChange('category', e.target.value)}>
            <option value="">Select category</option>
            {categories.map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <input type="text" placeholder="Description" className="w-full border p-2 rounded" value={form.description} onChange={e => handleChange('description', e.target.value)} />
          <input type="number" placeholder="Amount" className="w-full border p-2 rounded" value={form.amount} onChange={e => handleChange('amount', parseFloat(e.target.value))} />
          <input type="text" placeholder="Payment Method" className="w-full border p-2 rounded" value={form.paymentMethod} onChange={e => handleChange('paymentMethod', e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}
