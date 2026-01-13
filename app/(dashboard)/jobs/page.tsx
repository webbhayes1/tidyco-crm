'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
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
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    }

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
      render: (job) => job.fields.Date ? format(parseDate(job.fields.Date), 'MMM d, yyyy') : '-',
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
      render: (job) => job.cleanerName || <span className="text-orange-600 font-medium">Unassigned</span>,
    },
    {
      key: 'Service Type',
      label: 'Service',
      render: (job) => job.fields['Service Type'],
    },
    {
      key: 'Status',
      label: 'Status',
      render: (job) => <StatusBadge status={job.fields.Status} />,
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
  ];

  const filteredJobs = jobs.filter((job) => {
    if (filter === 'unassigned') return !job.fields.Cleaner;
    if (filter === 'pending') return job.fields.Status === 'Pending';
    if (filter === 'scheduled') return job.fields.Status === 'Scheduled';
    if (filter === 'completed') return job.fields.Status === 'Completed';
    return true; // 'all'
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

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'unassigned', 'pending', 'scheduled', 'completed'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === filterOption
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
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