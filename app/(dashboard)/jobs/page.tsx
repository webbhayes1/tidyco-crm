'use client';

import { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { QuickStatusSelect } from '@/components/QuickStatusSelect';
import { MarkPaidButton } from '@/components/MarkPaidButton';
import { Job, Client, Cleaner } from '@/types/airtable';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Plus, Search, Filter, X } from 'lucide-react';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [cleanerFilter, setCleanerFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const fetchJobs = async () => {
    try {
      const [jobsRes, clientsRes, cleanersRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/clients'),
        fetch('/api/cleaners'),
      ]);
      const [jobsData, clientsData, cleanersData] = await Promise.all([
        jobsRes.json(),
        clientsRes.json(),
        cleanersRes.json(),
      ]);
      setJobs(jobsData);
      setClients(clientsData);
      setCleaners(cleanersData);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Get unique service types from jobs
  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    jobs.forEach(job => {
      if (job.fields['Service Type']) {
        types.add(job.fields['Service Type']);
      }
    });
    return Array.from(types).sort();
  }, [jobs]);

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

  // Count active filters
  const activeFilterCount = [
    filter !== 'all',
    clientFilter !== 'all',
    cleanerFilter !== 'all',
    serviceFilter !== 'all',
  ].filter(Boolean).length;

  const filteredJobs = jobs
    .filter((job) => {
      // Search filter - matches client name, cleaner name, service type, address, status
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const clientName = (job.clientName || '').toLowerCase();
        const cleanerName = (job.cleanerName || '').toLowerCase();
        const cleanerNames = (job.cleanerNames || []).join(' ').toLowerCase();
        const serviceType = (job.fields['Service Type'] || '').toLowerCase();
        const address = (job.fields.Address || '').toLowerCase();
        const status = (job.fields.Status || '').toLowerCase();
        const jobId = String(job.fields['Job ID'] || '').toLowerCase();

        return clientName.includes(query) ||
               cleanerName.includes(query) ||
               cleanerNames.includes(query) ||
               serviceType.includes(query) ||
               address.includes(query) ||
               status.includes(query) ||
               jobId.includes(query);
      }
      return true;
    })
    .filter((job) => {
      // Status filter
      if (filter === 'unassigned') return !job.fields.Cleaner?.length;
      if (filter === 'pending') return job.fields.Status === 'Pending';
      if (filter === 'scheduled') return job.fields.Status === 'Scheduled';
      if (filter === 'completed') return job.fields.Status === 'Completed';
      return true; // 'all'
    })
    .filter((job) => {
      // Client filter
      if (clientFilter === 'all') return true;
      return job.fields.Client?.[0] === clientFilter;
    })
    .filter((job) => {
      // Cleaner filter
      if (cleanerFilter === 'all') return true;
      if (cleanerFilter === 'unassigned') return !job.fields.Cleaner?.length;
      return job.fields.Cleaner?.includes(cleanerFilter);
    })
    .filter((job) => {
      // Service type filter
      if (serviceFilter === 'all') return true;
      return job.fields['Service Type'] === serviceFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          const dateA = a.fields.Date ? parseDate(a.fields.Date).getTime() : 0;
          const dateB = b.fields.Date ? parseDate(b.fields.Date).getTime() : 0;
          return dateA - dateB;
        case 'date-asc':
          const dateA2 = a.fields.Date ? parseDate(a.fields.Date).getTime() : 0;
          const dateB2 = b.fields.Date ? parseDate(b.fields.Date).getTime() : 0;
          return dateB2 - dateA2;
        case 'client-asc':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'client-desc':
          return (b.clientName || '').localeCompare(a.clientName || '');
        case 'cleaner-asc':
          // Unassigned jobs go to end
          if (!a.cleanerName && !b.cleanerName) return 0;
          if (!a.cleanerName) return 1;
          if (!b.cleanerName) return -1;
          return a.cleanerName.localeCompare(b.cleanerName);
        case 'cleaner-desc':
          // Unassigned jobs go to end
          if (!a.cleanerName && !b.cleanerName) return 0;
          if (!a.cleanerName) return 1;
          if (!b.cleanerName) return -1;
          return b.cleanerName.localeCompare(a.cleanerName);
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

      {/* Search and Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
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

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="client-asc">Client (A-Z)</option>
              <option value="client-desc">Client (Z-A)</option>
              <option value="cleaner-asc">Cleaner (A-Z)</option>
              <option value="cleaner-desc">Cleaner (Z-A)</option>
              <option value="amount-high">Amount (High-Low)</option>
              <option value="amount-low">Amount (Low-High)</option>
            </select>
          </div>
        </div>

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filters */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'unassigned', 'pending', 'scheduled', 'completed'].map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md ${
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
              </div>

              {/* Client Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Client</label>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white min-w-[150px]"
                >
                  <option value="all">All Clients</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.fields.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cleaner Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cleaner</label>
                <select
                  value={cleanerFilter}
                  onChange={(e) => setCleanerFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white min-w-[150px]"
                >
                  <option value="all">All Cleaners</option>
                  <option value="unassigned">Unassigned</option>
                  {cleaners.filter(c => c.fields.Status === 'Active').map(cleaner => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.fields.Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white min-w-[150px]"
                >
                  <option value="all">All Services</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-transparent">Clear</label>
                  <button
                    onClick={() => {
                      setFilter('all');
                      setClientFilter('all');
                      setCleanerFilter('all');
                      setServiceFilter('all');
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-200"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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