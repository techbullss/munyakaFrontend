"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CurrencyDollarIcon,
  TruckIcon,
  UserGroupIcon,
  CreditCardIcon,
  UsersIcon,
  UserIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import Header from "./components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true); // initial state only

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Inventory', path: '/dashboard/inventory', icon: ClipboardDocumentListIcon },
    { name: 'Sales', path: '/dashboard/sales', icon: CurrencyDollarIcon },
    { name: 'Purchases', path: '/dashboard/purchases', icon: TruckIcon },
    { name: 'Suppliers', path: '/dashboard/suppliers', icon: UserGroupIcon },
    { name: 'Creditors', path: '/dashboard/creditors', icon: CreditCardIcon },
    { name: 'Debtors', path: '/dashboard/debtors', icon: UsersIcon },
    { name: 'Employees', path: '/dashboard/employes', icon: UserIcon },
    { name: 'Expenditures', path: '/dashboard/expenditure', icon: CurrencyDollarIcon },
    { name: 'Reports', path: '/dashboard/reports', icon: ChartBarIcon },
    { name: 'Users', path: '/dashboard/users', icon: UserGroupIcon },
    { name: 'Rental item Management', path: '/dashboard/rentalmanagement', icon: UsersIcon },
    { name: 'Item Rent', path: '/dashboard/itemRent', icon: ClipboardDocumentListIcon },
  ];

  const isActive = (path: string) => pathname === path;

  return (
     <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`bg-gray-200 border-r border-gray-200 p-4 h-screen sticky top-0 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
      <nav className="flex flex-col ">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md gap-2 ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>

      {/* Main content */}
      <main className="flex-1 p-2 bg-white">
        <Header />
        {children}
      </main>
    </div>
  );
}
