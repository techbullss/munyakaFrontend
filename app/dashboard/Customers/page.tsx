// app/dashboard/customers/page.js
'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function Customers() {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'John Smith', email: 'john@example.com', phone: '555-0123', orders: 12, totalSpent: 2450.75, status: 'Active' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-0456', orders: 8, totalSpent: 1875.50, status: 'Active' },
    { id: 3, name: 'Michael Brown', email: 'michael@example.com', phone: '555-0789', orders: 5, totalSpent: 925.25, status: 'Inactive' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', phone: '555-0912', orders: 15, totalSpent: 3520.00, status: 'Active' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center">
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Customer
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Customers</h2>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 px-4 block w-full leading-5 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                placeholder="Search customers..."
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
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {customer.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">ID: #{customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{customer.orders}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${customer.totalSpent.toFixed(2)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-gray-600 hover:text-gray-900">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">Previous</button>
              <button className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}