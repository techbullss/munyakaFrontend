// app/dashboard/reports/page.js
'use client';

import { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: '2023-05-01',
    end: '2023-05-31'
  });
  
  const reportData = {
    sales: { value: 25480.75, change: 12.5 },
    purchases: { value: 18750.25, change: -3.2 },
    expenses: { value: 5250.50, change: 5.7 },
    profit: { value: 1480.00, change: 8.9 }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600">Track your business performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Apply
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {Object.entries(reportData).map(([key, data]) => (
          <div key={key} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-500 capitalize">{key}</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">${data.value.toFixed(2)}</p>
              <div className={`ml-2 flex items-center text-sm font-medium ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.change >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                <span>{Math.abs(data.change)}%</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">From last month</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Sales Report</h2>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              Export PDF
            </button>
          </div>
          
          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Sales chart visualization would appear here</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Top Selling Products</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Product A</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">125</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">$3,750.00</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">32%</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Product B</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">98</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">$2,940.00</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">28%</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Product C</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">76</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">$1,824.00</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">35%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}