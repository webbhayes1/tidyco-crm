'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { QuickStatusSelect } from '@/components/QuickStatusSelect';
import { Cleaner } from '@/types/airtable';
import Link from 'next/link';
import { Plus, Search, X } from 'lucide-react';

export default function CleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCleaners = useCallback(async () => {
    try {
      const response = await fetch('/api/cleaners');
      const data = await response.json();
      setCleaners(data);
    } catch (error) {
      console.error('Failed to fetch cleaners:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCleaners();
  }, [fetchCleaners]);

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
      render: (cleaner) => (
        <QuickStatusSelect
          recordId={cleaner.id}
          currentStatus={cleaner.fields.Status || 'Active'}
          statusType="cleaner"
          apiEndpoint="/api/cleaners"
          onSuccess={fetchCleaners}
        />
      ),
    },
  ];

  const filteredCleaners = cleaners
    .filter((cleaner) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (cleaner.fields.Name || '').toLowerCase();
        const email = (cleaner.fields.Email || '').toLowerCase();
        const phone = (cleaner.fields.Phone || '').toLowerCase();
        const experience = (cleaner.fields['Experience Level'] || '').toLowerCase();

        return name.includes(query) ||
               email.includes(query) ||
               phone.includes(query) ||
               experience.includes(query);
      }
      return true;
    })
    .filter((cleaner) => {
      if (filter === 'active') return cleaner.fields.Status === 'Active' || !cleaner.fields.Status;
      if (filter === 'inactive') return cleaner.fields.Status === 'Inactive';
      if (filter === 'on-leave') return cleaner.fields.Status === 'On Leave';
      if (filter === 'junior') return cleaner.fields['Experience Level'] === 'Junior' || !cleaner.fields['Experience Level'];
      if (filter === 'mid-level') return cleaner.fields['Experience Level'] === 'Mid-Level';
      if (filter === 'senior') return cleaner.fields['Experience Level'] === 'Senior';
      return true; // 'all'
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.fields.Name || '').localeCompare(b.fields.Name || '');
        case 'name-desc':
          return (b.fields.Name || '').localeCompare(a.fields.Name || '');
        case 'quality-high':
          return (b.fields['Average Quality Score'] || 0) - (a.fields['Average Quality Score'] || 0);
        case 'quality-low':
          return (a.fields['Average Quality Score'] || 0) - (b.fields['Average Quality Score'] || 0);
        case 'earnings-high':
          return (b.fields['Total Earnings'] || 0) - (a.fields['Total Earnings'] || 0);
        case 'earnings-low':
          return (a.fields['Total Earnings'] || 0) - (b.fields['Total Earnings'] || 0);
        case 'jobs-high':
          return (b.fields['Jobs Completed'] || 0) - (a.fields['Jobs Completed'] || 0);
        case 'jobs-low':
          return (a.fields['Jobs Completed'] || 0) - (b.fields['Jobs Completed'] || 0);
        default:
          return 0;
      }
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

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cleaners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <div className="flex space-x-2">
            {['all', 'active', 'inactive', 'on-leave'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  filter === filterOption
                    ? filterOption === 'active' ? 'bg-green-600 text-white'
                    : filterOption === 'inactive' ? 'bg-orange-500 text-white'
                    : filterOption === 'on-leave' ? 'bg-blue-600 text-white'
                    : 'bg-primary-600 text-white'
                    : filterOption === 'active' ? 'bg-white text-green-700 hover:bg-green-50 border border-green-300'
                    : filterOption === 'inactive' ? 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-300'
                    : filterOption === 'on-leave' ? 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {filterOption === 'on-leave' ? 'On Leave' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="quality-high">Quality (High-Low)</option>
              <option value="quality-low">Quality (Low-High)</option>
              <option value="earnings-high">Earnings (High-Low)</option>
              <option value="earnings-low">Earnings (Low-High)</option>
              <option value="jobs-high">Jobs (High-Low)</option>
              <option value="jobs-low">Jobs (Low-High)</option>
            </select>
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
