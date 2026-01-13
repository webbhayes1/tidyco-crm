'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Cleaners', href: '/cleaners' },
  { name: 'Teams', href: '/cleaners/teams' },
];

export default function CleanersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === '/cleaners') {
      return pathname === '/cleaners' || (pathname?.startsWith('/cleaners/') && !pathname?.startsWith('/cleaners/teams'));
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                isTabActive(tab.href)
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
