"use client"
import { useState } from 'react';

export default function Dashboard() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [notifications, setNotifications] = useState(3);
  
  const navigationItems = [
    'Dashboard', 'POS', 'Inventory', 'Purchases', 
    'Sales', 'Customers', 'Suppliers', 'Reports', 'Settings'
  ];

  // Sample data for dashboard cards
  const stats = [
    { title: 'Total Sales', value: '$12,426', change: '+12%', icon: '📊' },
    { title: 'Customers', value: '1,342', change: '+8%', icon: '👥' },
    { title: 'Inventory', value: '2,153', change: '-3%', icon: '📦' },
    { title: 'Pending Orders', value: '47', change: '+4%', icon: '📝' },
  ];

  // Components for each page


  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, John! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-2xl">
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and additional content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Sales chart visualization</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <ul className="space-y-4">
            <li className="flex items-center">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <span className="text-green-600">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium">New order #1234</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </li>
            <li className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <span className="text-blue-600">👤</span>
              </div>
              <div>
                <p className="text-sm font-medium">New customer registered</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </li>
            <li className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-2 mr-3">
                <span className="text-yellow-600">📦</span>
              </div>
              <div>
                <p className="text-sm font-medium">Low inventory alert</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
