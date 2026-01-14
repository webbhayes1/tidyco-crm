'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Kanban, MessageSquare } from 'lucide-react';

const tabs = [
  { name: 'Pipeline', href: '/leads/pipeline', icon: Kanban },
  { name: 'SMS Drips', href: '/leads/sms-drips', icon: MessageSquare },
];

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show tabs on detail pages ([id], new, edit)
  const isDetailPage = pathname?.match(/\/leads\/(?!pipeline|sms-drips)[^/]+/);

  if (isDetailPage) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-tidyco-blue text-tidyco-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
