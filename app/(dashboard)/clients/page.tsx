'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Client } from '@/types/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

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
      key: 'Total Bookings',
      label: 'Total Bookings',
      render: (client) => client.fields['Total Bookings'] || 0,
    },
    {
      key: 'Total Lifetime Value',
      label: 'LTV',
      render: (client) => formatCurrency(client.fields['Total Lifetime Value'] || 0),
    },
    {
      key: 'Last Booking Date',
      label: 'Last Booking',
      render: (client) => {
        if (!client.fields['Last Booking Date']) return '-';
        try {
          return format(new Date(client.fields['Last Booking Date']), 'MMM d, yyyy');
        } catch {
          return '-';
        }
      },
    },
    {
      key: 'Status',
      label: 'Status',
      render: (client) => <StatusBadge status={client.fields.Status || 'Active'} />,
    },
  ];

  const filteredClients = clients.filter((client) => {
    if (filter === 'active') return client.fields.Status === 'Active' || !client.fields.Status;
    if (filter === 'inactive') return client.fields.Status === 'Inactive';
    if (filter === 'churned') return client.fields.Status === 'Churned';
    return true; // 'all'
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

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'active', 'inactive', 'churned'].map((filterOption) => (
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
        data={filteredClients}
        columns={clientColumns}
        getRowHref={(client) => `/clients/${client.id}`}
        emptyMessage="No clients found"
      />
    </div>
  );
}
