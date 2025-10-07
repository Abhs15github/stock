'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { TrendingUp, LogOut, User, Home, Target } from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Trades', href: '/trades', icon: Target },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center">
              <TrendingUp className="w-8 h-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">BBT Trades</h1>
            </Link>

            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};