'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, ChevronDown, FileText, Download, Send, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import type { Invoice } from '@/types/airtable';

type InvoiceStatus = 'Pending' | 'Paid' | 'Voided';
const STATUS_ORDER: InvoiceStatus[] = ['Pending', 'Paid', 'Voided'];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showNewDropdown, setShowNewDropdown] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const status = invoice.fields.Status || 'Pending';
    if (filter === 'all') return true;
    return status === filter;
  });

  // Sort by date (newest first)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const dateA = a.fields['Service Date'] || '';
    const dateB = b.fields['Service Date'] || '';
    return dateB.localeCompare(dateA);
  });

  // Calculate status counts
  const statusCounts = invoices.reduce((acc, invoice) => {
    const status = invoice.fields.Status || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate totals
  const totals = {
    pending: invoices.filter(i => i.fields.Status === 'Pending').reduce((sum, i) => sum + ((i.fields.Hours || 0) * (i.fields.Rate || 0)), 0),
    paid: invoices.filter(i => i.fields.Status === 'Paid').reduce((sum, i) => sum + ((i.fields.Hours || 0) * (i.fields.Rate || 0)), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} total invoices`}
        actions={
          <div className="relative">
            <button
              onClick={() => setShowNewDropdown(!showNewDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-tidyco-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Invoice
              <ChevronDown className="h-4 w-4" />
            </button>
            {showNewDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNewDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <Link
                    href="/finances/invoices/new"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowNewDropdown(false)}
                  >
                    Standalone Invoice
                  </Link>
                  <Link
                    href="/jobs"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowNewDropdown(false)}
                  >
                    From Job...
                  </Link>
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">${totals.pending.toLocaleString()}</p>
          <p className="text-xs text-yellow-700">{statusCounts['Pending'] || 0} invoices</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">Paid</p>
          <p className="text-2xl font-bold text-green-900">${totals.paid.toLocaleString()}</p>
          <p className="text-xs text-green-700">{statusCounts['Paid'] || 0} invoices</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">Voided</p>
          <p className="text-2xl font-bold text-gray-700">{statusCounts['Voided'] || 0}</p>
          <p className="text-xs text-gray-500">invoices</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-tidyco-blue text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          All ({invoices.length})
        </button>
        <div className="border-l border-gray-300 mx-2" />
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === status
                ? 'bg-tidyco-blue text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {status} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedInvoices.map((invoice) => {
              const amount = (invoice.fields.Hours || 0) * (invoice.fields.Rate || 0);
              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/finances/invoices/${invoice.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {invoice.fields['Invoice Number']}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{invoice.fields['Client Name'] || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {invoice.fields['Service Date']
                      ? format(new Date(invoice.fields['Service Date']), 'MMM d, yyyy')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {invoice.fields['Service Type']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">${amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={invoice.fields.Status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/finances/invoices/${invoice.id}?action=send`)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Send Invoice"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No invoices found. Create your first invoice!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
