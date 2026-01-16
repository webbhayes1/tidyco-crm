'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { QuickStatusSelect } from '@/components/QuickStatusSelect';
import { MarkPaidButton } from '@/components/MarkPaidButton';
import { Job } from '@/types/airtable';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Plus } from 'lucide-react';

// Helper to parse date strings correctly (avoids timezone issues)
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');
  }
  return parseISO(dateStr);
};

// Extended Job type with enriched data
type EnrichedJob = Job & {
  clientName?: string | null;
  cleanerName?: string | null;
  cleanerNames?: string[];
  cleanerCount?: number;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const jobColumns: Column<EnrichedJob>[] = [
    {
      key: 'Date',
      label: 'Date',
      render: (job) => job.fields.Date ? format(parseDate(job.fields.Date), 'MM-dd-yyyy') : '-',
    },
    {
      key: 'Time',
      label: 'Time',
      render: (job) => job.fields.Time || '-',
    },
    {
      key: 'Client',
      label: 'Client',
      render: (job) => job.clientName || '-',
    },
    {
      key: 'Cleaner',
      label: 'Cleaner',
      render: (job) => {
        const count = job.cleanerCount || 0;
        if (count === 0) {
          return <span className="text-orange-600 font-medium">Unassigned</span>;
        }
        if (count === 1) {
          return job.cleanerName;
        }
        return (
          <div>
            <span className="font-medium">{count} cleaners</span>
            <div className="text-xs text-gray-500">{job.cleanerNames?.slice(0, 2).join(', ')}{count > 2 ? '...' : ''}</div>
          </div>
        );
      },
    },
    {
      key: 'Service Type',
      label: 'Service',
      render: (job) => job.fields['Service Type'],
    },
    {
      key: 'Status',
      label: 'Status',
      render: (job) => (
        <QuickStatusSelect
          recordId={job.id}
          currentStatus={job.fields.Status || 'Pending'}
          statusType="job"
          apiEndpoint="/api/jobs"
          onSuccess={fetchJobs}
        />
      ),
    },
    {
      key: 'Amount',
      label: 'Amount',
      render: (job) => formatCurrency(job.fields['Amount Charged'] || 0),
    },
    {
      key: 'Quality',
      label: 'Quality',
      render: (job) => {
        const score = job.fields['Quality Score'];
        if (!score) return '-';
        const color = score >= 80 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-medium ${color}`}>{score}</span>;
      },
    },
    {
      key: 'Payment',
      label: 'Payment',
      render: (job) => {
        // Only show for completed jobs
        if (job.fields.Status !== 'Completed') {
          return <span className="text-gray-400 text-xs">-</span>;
        }
        return (
          <MarkPaidButton
            jobId={job.id}
            jobTitle={`Job #${job.fields['Job ID'] || job.id.slice(0, 8)}`}
            currentPaymentStatus={job.fields['Payment Status'] || 'Pending'}
            currentCleanerPaid={job.fields['Cleaner Paid'] || false}
            amountCharged={job.fields['Amount Charged'] || 0}
            cleanerPayout={0}
            currentTip={job.fields['Tip Amount'] || 0}
            cleanerCount={job.cleanerCount || 1}
            variant="compact"
            onSuccess={fetchJobs}
          />
        );
      },
    },
  ];

  const filteredJobs = jobs
    .filter((job) => {
      if (filter === 'unassigned') return !job.fields.Cleaner?.length;
      if (filter === 'pending') return job.fields.Status === 'Pending';
      if (filter === 'scheduled') return job.fields.Status === 'Scheduled';
      if (filter === 'completed') return job.fields.Status === 'Completed';
      return true; // 'all'
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          const dateA = a.fields.Date ? parseDate(a.fields.Date).getTime() : 0;
          const dateB = b.fields.Date ? parseDate(b.fields.Date).getTime() : 0;
          return dateB - dateA;
        case 'date-asc':
          const dateA2 = a.fields.Date ? parseDate(a.fields.Date).getTime() : 0;
          const dateB2 = b.fields.Date ? parseDate(b.fields.Date).getTime() : 0;
          return dateA2 - dateB2;
        case 'client-asc':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'client-desc':
          return (b.clientName || '').localeCompare(a.clientName || '');
        case 'amount-high':
          return (b.fields['Amount Charged'] || 0) - (a.fields['Amount Charged'] || 0);
        case 'amount-low':
          return (a.fields['Amount Charged'] || 0) - (b.fields['Amount Charged'] || 0);
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
        title="Jobs"
        description={`${filteredJobs.length} total jobs`}
        actions={
          <Link
            href="/jobs/new"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        }
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filters */}
        <div className="flex space-x-2">
          {['all', 'unassigned', 'pending', 'scheduled', 'completed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === filterOption
                  ? filterOption === 'unassigned' ? 'bg-orange-500 text-white' : 'bg-primary-600 text-white'
                  : filterOption === 'unassigned'
                    ? 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
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
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="client-asc">Client (A-Z)</option>
            <option value="client-desc">Client (Z-A)</option>
            <option value="amount-high">Amount (High-Low)</option>
            <option value="amount-low">Amount (Low-High)</option>
          </select>
        </div>
      </div>

      <DataTable
        data={filteredJobs}
        columns={jobColumns}
        getRowHref={(job) => `/jobs/${job.id}`}
        emptyMessage="No jobs found"
      />
    </div>
  );
}