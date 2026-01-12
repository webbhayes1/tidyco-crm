'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Cleaner } from '@/types/airtable';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCleaners() {
      try {
        const response = await fetch('/api/cleaners');
        const data = await response.json();
        setCleaners(data);
      } catch (error) {
        console.error('Failed to fetch cleaners:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCleaners();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const cleanerColumns: Column<Cleaner>[] = [
    {
      key: 'Name',
      label: 'Name',
      render: (cleaner) => (
        <div>
          <div className="font-medium text-gray-900">{cleaner.fields.Name}</div>
          <div className="text-sm text-gray-500">{cleaner.fields.Email}</div>
        </div>
      ),
    },
    {
      key: 'Experience Level',
      label: 'Experience',
      render: (cleaner) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          cleaner.fields['Experience Level'] === 'Senior'
            ? 'bg-purple-100 text-purple-800'
            : cleaner.fields['Experience Level'] === 'Mid-Level'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {cleaner.fields['Experience Level'] || 'Junior'}
        </span>
      ),
    },
    {
      key: 'Hourly Rate',
      label: 'Rate',
      render: (cleaner) => formatCurrency(cleaner.fields['Hourly Rate'] || 0),
    },
    {
      key: 'Average Quality Score',
      label: 'Avg Quality',
      render: (cleaner) => {
        const score = cleaner.fields['Average Quality Score'];
        // Handle NaN special values from Airtable
        if (!score || typeof score !== 'number' || isNaN(score)) return '-';
        const color = score >= 80 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-medium ${color}`}>{score.toFixed(0)}</span>;
      },
    },
    {
      key: 'Jobs Completed',
      label: 'Jobs',
      render: (cleaner) => cleaner.fields['Jobs Completed'] || 0,
    },
    {
      key: 'Total Earnings',
      label: 'Total Earnings',
      render: (cleaner) => formatCurrency(cleaner.fields['Total Earnings'] || 0),
    },
    {
      key: 'Status',
      label: 'Status',
      render: (cleaner) => <StatusBadge status={cleaner.fields.Status || 'Active'} />,
    },
  ];

  const filteredCleaners = cleaners.filter((cleaner) => {
    if (filter === 'active') return cleaner.fields.Status === 'Active' || !cleaner.fields.Status;
    if (filter === 'inactive') return cleaner.fields.Status === 'Inactive';
    if (filter === 'on-leave') return cleaner.fields.Status === 'On Leave';
    if (filter === 'junior') return cleaner.fields['Experience Level'] === 'Junior' || !cleaner.fields['Experience Level'];
    if (filter === 'mid-level') return cleaner.fields['Experience Level'] === 'Mid-Level';
    if (filter === 'senior') return cleaner.fields['Experience Level'] === 'Senior';
    return true; // 'all'
  });

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cleaners"
        description={`${filteredCleaners.length} total cleaners`}
        actions={
          <Link
            href="/cleaners/new"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Cleaner
          </Link>
        }
      />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex space-x-2">
            {['all', 'active', 'inactive', 'on-leave'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === filterOption
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {filterOption === 'on-leave' ? 'On Leave' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Experience:</span>
          <div className="flex space-x-2">
            {['junior', 'mid-level', 'senior'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === filterOption
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {filterOption === 'mid-level' ? 'Mid-Level' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        data={filteredCleaners}
        columns={cleanerColumns}
        getRowHref={(cleaner) => `/cleaners/${cleaner.id}`}
        emptyMessage="No cleaners found"
      />
    </div>
  );
}
