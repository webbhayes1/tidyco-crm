'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { UserButton } from '@clerk/nextjs'; // Temporarily disabled
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  UserCheck,
  DollarSign,
  UserPlus
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Calendar', href: '/calendar/daily', icon: Calendar },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Cleaners', href: '/cleaners', icon: UserCheck },
  { name: 'Finances', href: '/finances', icon: DollarSign },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <h1 className="text-xl font-bold text-primary-600">TidyCo CRM</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            {/* <UserButton /> */}
          </div>
        </div>
      </div>
    </nav>
  );
}