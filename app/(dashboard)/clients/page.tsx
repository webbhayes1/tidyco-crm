'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { QuickStatusSelect } from '@/components/QuickStatusSelect';
import { Client, Cleaner, Job } from '@/types/airtable';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Plus, Search, X } from 'lucide-react';

// Helper to parse date strings correctly (avoids timezone issues)
const parseDate = (dateStr: string) => {
  if (!dateStr) return null;
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');
  }
  return parseISO(dateStr);
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [cleanerFilter, setCleanerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [clientsRes, cleanersRes, jobsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/cleaners'),
        fetch('/api/jobs'),
      ]);
      const [clientsData, cleanersData, jobsData] = await Promise.all([
        clientsRes.json(),
        cleanersRes.json(),
        jobsRes.json(),
      ]);
      setClients(clientsData);
      setCleaners(cleanersData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create lookup map for cleaner names
  const cleanerMap = new Map(cleaners.map(c => [c.id, c.fields.Name]));

  // Get today at midnight for comparison
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  // Build a map of client ID -> { lastBooking, nextBooking }
  const clientBookingsMap = useMemo(() => {
    const map = new Map<string, { lastBooking: Date | null; nextBooking: Date | null }>();

    jobs.forEach(job => {
      const clientId = job.fields.Client?.[0];
      if (!clientId || !job.fields.Date) return;

      const jobDate = parseDate(job.fields.Date);
      if (!jobDate) return;

      const jobTime = jobDate.getTime();
      const current = map.get(clientId) || { lastBooking: null, nextBooking: null };

      if (jobTime < today) {
        // Past job - find the most recent one (closest to today)
        if (!current.lastBooking || jobTime > current.lastBooking.getTime()) {
          current.lastBooking = jobDate;
        }
      } else {
        // Future job (including today) - find the soonest one
        if (!current.nextBooking || jobTime < current.nextBooking.getTime()) {
          current.nextBooking = jobDate;
        }
      }

      map.set(clientId, current);
    });

    return map;
  }, [jobs, today]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const clientColumns: Column<Client>[] = [
    {
      key: 'Name',
      label: 'Name',
      render: (client) => (
        <div>
          <div className="font-medium text-gray-900">{client.fields.Name}</div>
          <div className="text-sm text-gray-500">{client.fields.Email}</div>
        </div>
      ),
    },
    {
      key: 'Phone',
      label: 'Phone',
      render: (client) => client.fields.Phone || '-',
    },
    {
      key: 'Preferred Cleaner',
      label: 'Cleaner',
      render: (client) => {
        const cleanerId = client.fields['Preferred Cleaner']?.[0];
        if (!cleanerId) {
          return <span className="text-orange-600 font-medium">Assign cleaner</span>;
        }
        return cleanerMap.get(cleanerId) || '-';
      },
    },
    {
      key: 'Total Bookings',
      label: 'Bookings',
      render: (client) => client.fields['Total Bookings'] || 0,
    },
    {
      key: 'Total Lifetime Value',
      label: 'LTV',
      render: (client) => formatCurrency(client.fields['Total Lifetime Value'] || 0),
    },
    {
      key: 'Last Booking',
      label: 'Last Booking',
      render: (client) => {
        const bookings = clientBookingsMap.get(client.id);
        if (!bookings?.lastBooking) return <span className="text-gray-400">-</span>;
        return format(bookings.lastBooking, 'MMM d, yyyy');
      },
    },
    {
      key: 'Next Booking',
      label: 'Next Booking',
      render: (client) => {
        const bookings = clientBookingsMap.get(client.id);
        if (!bookings?.nextBooking) return <span className="text-gray-400">-</span>;
        return <span className="text-primary-600 font-medium">{format(bookings.nextBooking, 'MMM d, yyyy')}</span>;
      },
    },
    {
      key: 'Status',
      label: 'Status',
      render: (client) => (
        <QuickStatusSelect
          recordId={client.id}
          currentStatus={client.fields.Status || 'Active'}
          statusType="client"
          apiEndpoint="/api/clients"
          onSuccess={fetchData}
        />
      ),
    },
  ];

  // Filter clients
  const filteredClients = clients
    .filter((client) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (client.fields.Name || '').toLowerCase();
        const email = (client.fields.Email || '').toLowerCase();
        const phone = (client.fields.Phone || '').toLowerCase();
        const address = (client.fields.Address || '').toLowerCase();
        const city = (client.fields.City || '').toLowerCase();
        const cleanerId = client.fields['Preferred Cleaner']?.[0];
        const cleanerName = cleanerId ? (cleanerMap.get(cleanerId) || '').toLowerCase() : '';

        return name.includes(query) ||
               email.includes(query) ||
               phone.includes(query) ||
               address.includes(query) ||
               city.includes(query) ||
               cleanerName.includes(query);
      }
      return true;
    })
    .filter((client) => {
      // Status filter
      if (filter === 'active') return client.fields.Status === 'Active' || !client.fields.Status;
      if (filter === 'inactive') return client.fields.Status === 'Inactive';
      if (filter === 'churned') return client.fields.Status === 'Churned';
      return true; // 'all'
    })
    .filter((client) => {
      // Cleaner filter
      if (cleanerFilter === 'all') return true;
      if (cleanerFilter === 'unassigned') return !client.fields['Preferred Cleaner']?.length;
      return client.fields['Preferred Cleaner']?.[0] === cleanerFilter;
    })
    .sort((a, b) => {
      // Sort logic
      switch (sortBy) {
        case 'name-asc':
          return (a.fields.Name || '').localeCompare(b.fields.Name || '');
        case 'name-desc':
          return (b.fields.Name || '').localeCompare(a.fields.Name || '');
        case 'ltv-high':
          return (b.fields['Total Lifetime Value'] || 0) - (a.fields['Total Lifetime Value'] || 0);
        case 'ltv-low':
          return (a.fields['Total Lifetime Value'] || 0) - (b.fields['Total Lifetime Value'] || 0);
        case 'recent':
          // Sort by most recent past booking (clients with recent activity first)
          const lastA = clientBookingsMap.get(a.id)?.lastBooking?.getTime() || 0;
          const lastB = clientBookingsMap.get(b.id)?.lastBooking?.getTime() || 0;
          return lastB - lastA;
        case 'oldest':
          // Sort by oldest past booking (clients needing attention first)
          const lastA2 = clientBookingsMap.get(a.id)?.lastBooking?.getTime() || 0;
          const lastB2 = clientBookingsMap.get(b.id)?.lastBooking?.getTime() || 0;
          return lastA2 - lastB2;
        case 'next-soonest':
          // Sort by next upcoming booking (soonest first)
          const nextA = clientBookingsMap.get(a.id)?.nextBooking?.getTime() || Infinity;
          const nextB = clientBookingsMap.get(b.id)?.nextBooking?.getTime() || Infinity;
          return nextA - nextB;
        case 'cleaner-asc':
          const cleanerNameA = a.fields['Preferred Cleaner']?.[0] ? (cleanerMap.get(a.fields['Preferred Cleaner'][0]) || '') : '';
          const cleanerNameB = b.fields['Preferred Cleaner']?.[0] ? (cleanerMap.get(b.fields['Preferred Cleaner'][0]) || '') : '';
          // Put unassigned at the end
          if (!cleanerNameA && cleanerNameB) return 1;
          if (cleanerNameA && !cleanerNameB) return -1;
          return cleanerNameA.localeCompare(cleanerNameB);
        case 'cleaner-desc':
          const cleanerNameA2 = a.fields['Preferred Cleaner']?.[0] ? (cleanerMap.get(a.fields['Preferred Cleaner'][0]) || '') : '';
          const cleanerNameB2 = b.fields['Preferred Cleaner']?.[0] ? (cleanerMap.get(b.fields['Preferred Cleaner'][0]) || '') : '';
          // Put unassigned at the end
          if (!cleanerNameA2 && cleanerNameB2) return 1;
          if (cleanerNameA2 && !cleanerNameB2) return -1;
          return cleanerNameB2.localeCompare(cleanerNameA2);
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
        title="Clients"
        description={`${filteredClients.length} total clients`}
        actions={
          <Link
            href="/clients/new"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Link>
        }
      />

      {/* Search and Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
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

        {/* Status Filters */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-green-700 hover:bg-green-50 border border-green-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === 'inactive'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-300'
            }`}
          >
            Inactive
          </button>
          <button
            onClick={() => setFilter('churned')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === 'churned'
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-600 hover:bg-red-50 border border-red-300'
            }`}
          >
            Churned
          </button>
        </div>

        {/* Cleaner Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Cleaner:</label>
          <select
            value={cleanerFilter}
            onChange={(e) => setCleanerFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
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
            <option value="cleaner-asc">Cleaner (A-Z)</option>
            <option value="cleaner-desc">Cleaner (Z-A)</option>
            <option value="ltv-high">LTV (High-Low)</option>
            <option value="ltv-low">LTV (Low-High)</option>
            <option value="next-soonest">Next Booking (Soonest)</option>
            <option value="recent">Last Booking (Recent)</option>
            <option value="oldest">Last Booking (Oldest)</option>
          </select>
        </div>
      </div>

      <DataTable
        data={filteredClients}
        columns={clientColumns}
        getRowHref={(client) => `/clients/${client.id}`}
        emptyMessage="No clients found"
      />
    </div>
  );
}
