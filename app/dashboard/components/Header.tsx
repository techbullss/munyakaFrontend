'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LogOutIcon, ShoppingCart } from 'lucide-react';
export default function Header() {
  
  return (
    <header className="bg-gray-100 shadow-md w-full h-12 p-2 flex items-center justify-between px-4 sm:px-6 lg:px-8 top-0 left-0 right-0 z-20">
      {/* Logo */}
      <div className="text-xl font-bold text-indigo-600">MyApp</div>
      <div>
      <Link href="/POS" className="flex text-indigo-600 items-center gap-2  font-medium hover:text-blue-600 transition">
        <ShoppingCart className="w-5 h-5" />
        <span>POS</span>
      </Link>
    </div>
         
         

      {/* Right side - Notifications & User */}
      <div className="flex items-center space-x-4">
         <div>
      <Link href="/POS" className="flex text-indigo-600 items-center gap-2  font-medium hover:text-blue-600 transition">
        <LogOutIcon className="w-5 h-5" />
        <span>Logout</span>
      </Link>
    </div>
        <button className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100">
          <span className="sr-only">View notifications</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        
            
        
        </button>
       

        <div className="relative">
          <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 font-semibold flex items-center justify-center">
              JD
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
