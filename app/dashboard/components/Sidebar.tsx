'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export default function Sidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true); // optional toggle
setSidebarOpen(true);
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
   
    { name: 'Inventory', path: '/dashboard/Inventory', icon: ClipboardDocumentListIcon },
    { name: 'Sales', path: '/dashboard/Sales', icon: CurrencyDollarIcon },
    { name: 'Purchases', path: '/dashboard/Purchases', icon: TruckIcon },
    { name: 'Suppliers', path: '/dashboard/Suppliers', icon: UserGroupIcon },
    { name: 'Creditors', path: '/dashboard/Creditors', icon: CreditCardIcon },
    { name: 'Debtors', path: '/dashboard/Deptors', icon: UsersIcon },
    { name: 'Employees', path: '/dashboard/Employee', icon: UserIcon },
    { name: 'Expenditures', path: '/dashboard/Expenditure', icon: CurrencyDollarIcon },
    { name: 'Reports', path: '/dashboard/Reports', icon: ChartBarIcon },
    { name: 'Users', path: '/dashboard/Users', icon: UserGroupIcon },
    
    { name: 'Rental item Management', path: '/dashboard/RentalManagement', icon: UsersIcon },
    { name: 'Item Rent', path: '/dashboard/ItemRent', icon: ClipboardDocumentListIcon },
  ];

  const isActive = (path: string) => pathname === path;

  return (
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
  );
}
