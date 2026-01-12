'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Clock, CheckCircle, XCircle, Send, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Quote } from '@/types/airtable';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  'Sent': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send },
  'Accepted': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  'Expired': { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetch('/api/quotes')
      .then(r => r.json())
      .then(data => {
        setQuotes(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load quotes:', error);
        setLoading(false);
      });
  }, []);

  // Filter quotes
  const filteredQuotes = filterStatus === 'all'
    ? quotes
    : quotes.filter(q => q.fields.Status === filterStatus);

  // Calculate stats
  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.fields.Status === 'Pending').length,
    sent: quotes.filter(q => q.fields.Status === 'Sent').length,
    accepted: quotes.filter(q => q.fields.Status === 'Accepted').length,
    rejected: quotes.filter(q => q.fields.Status === 'Rejected').length,
    totalValue: quotes.reduce((sum, q) => sum + (q.fields['Price Quote'] || 0), 0),
    acceptedValue: quotes
      .filter(q => q.fields.Status === 'Accepted')
      .reduce((sum, q) => sum + (q.fields['Price Quote'] || 0), 0),
  };

  const conversionRate = stats.total > 0
    ? ((stats.accepted / stats.total) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        actions={
          <Link href="/quotes/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-tidyco-blue text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              New Quote
            </button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Quotes</p>
          <p className="text-2xl font-bold text-tidyco-navy">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Pending/Sent</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending + stats.sent}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-bold text-green-600">{conversionRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Accepted Value</p>
          <p className="text-2xl font-bold text-tidyco-blue">${stats.acceptedValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'Pending', 'Sent', 'Accepted', 'Rejected', 'Expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-tidyco-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
            <span className="ml-2 text-xs opacity-75">
              ({status === 'all' ? quotes.length : quotes.filter(q => q.fields.Status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Quote</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Client</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Service</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Price</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredQuotes.map((quote) => {
              const statusConfig = STATUS_COLORS[quote.fields.Status] || STATUS_COLORS['Pending'];
              const StatusIcon = statusConfig.icon;

              return (
                <tr
                  key={quote.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/quotes/${quote.id}`}
                >
                  <td className="p-4">
                    <div className="font-medium text-tidyco-navy">
                      {quote.fields['Quote Name'] || `Quote #${quote.fields['Quote ID']}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {quote.fields.Bedrooms || 0} bed • {quote.fields.Bathrooms || 0} bath
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">{quote.fields['Name (from Client)'] || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{quote.fields['Email (from Client)']}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {quote.fields['Service Type']}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-tidyco-blue">
                      ${quote.fields['Price Quote']?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-500">
                      ~{quote.fields['Estimated Hours'] || 0} hrs
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {quote.fields.Status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {quote.fields['Created Date']
                      ? format(new Date(quote.fields['Created Date']), 'MMM d, yyyy')
                      : '-'}
                  </td>
                </tr>
              );
            })}
            {filteredQuotes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No quotes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}