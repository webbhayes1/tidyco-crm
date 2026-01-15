'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  User,
  MapPin,
  Home,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Quote, Client } from '@/types/airtable';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  'Sent': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send },
  'Accepted': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  'Expired': { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
};

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const quoteRes = await fetch(`/api/quotes/${params.id}`);
        if (!quoteRes.ok) throw new Error('Quote not found');
        const quoteData = await quoteRes.json();
        setQuote(quoteData);

        // Fetch client details
        if (quoteData.fields.Client?.[0]) {
          const clientRes = await fetch(`/api/clients/${quoteData.fields.Client[0]}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClient(clientData);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const updateQuoteStatus = async (status: Quote['fields']['Status']) => {
    if (!quote) return;
    setUpdating(true);
    try {
      const fields: Partial<Quote['fields']> = { Status: status };
      if (status === 'Sent') {
        fields['Sent Date'] = new Date().toISOString().split('T')[0];
      } else if (status === 'Accepted' || status === 'Rejected') {
        fields['Response Date'] = new Date().toISOString().split('T')[0];
      }

      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (response.ok) {
        const updated = await response.json();
        setQuote(updated);
      }
    } catch (err) {
      console.error('Error updating quote:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/finances/quotes');
      }
    } catch (err) {
      console.error('Error deleting quote:', err);
    }
  };

  const handleConvertToJob = async () => {
    if (!quote) return;
    // Navigate to job creation with pre-filled data from quote
    const queryParams = new URLSearchParams({
      clientId: quote.fields.Client?.[0] || '',
      serviceType: quote.fields['Service Type'] || '',
      address: quote.fields.Address || '',
      bedrooms: String(quote.fields.Bedrooms || 0),
      bathrooms: String(quote.fields.Bathrooms || 0),
      fromQuote: quote.id,
    });
    router.push(`/jobs/new?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading quote...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/finances/quotes" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader title="Error" description="" />
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <p className="text-red-700">{error || 'Quote not found'}</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_COLORS[quote.fields.Status] || STATUS_COLORS['Pending'];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finances/quotes" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader
            title={quote.fields['Quote Name'] || `Quote #${quote.fields['Quote ID']}`}
            description={`${quote.fields['Service Type']} - $${quote.fields['Price Quote']?.toLocaleString() || '0'}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            <StatusIcon className="w-4 h-4" />
            {quote.fields.Status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quote Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Service Type</dt>
                <dd className="mt-1 font-medium text-gray-900">{quote.fields['Service Type']}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Estimated Hours</dt>
                <dd className="mt-1 font-medium text-gray-900">{quote.fields['Estimated Hours'] || 0} hours</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Hourly Rate</dt>
                <dd className="mt-1 font-medium text-gray-900">${quote.fields['Client Hourly Rate'] || 0}/hr</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Total Price</dt>
                <dd className="mt-1 text-xl font-bold text-tidyco-blue">${quote.fields['Price Quote']?.toLocaleString() || '0'}</dd>
              </div>
            </dl>
          </div>

          {/* Property Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="h-5 w-5 text-gray-400" />
              Property Details
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address
                </dt>
                <dd className="mt-1 font-medium text-gray-900">{quote.fields.Address || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Bedrooms</dt>
                <dd className="mt-1 font-medium text-gray-900">{quote.fields.Bedrooms || 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Bathrooms</dt>
                <dd className="mt-1 font-medium text-gray-900">{quote.fields.Bathrooms || 0}</dd>
              </div>
              {quote.fields['Zip Code'] && (
                <div>
                  <dt className="text-sm text-gray-500">Zip Code</dt>
                  <dd className="mt-1 font-medium text-gray-900">{quote.fields['Zip Code']}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          {(quote.fields['Quote Notes'] || quote.fields['Internal Notes']) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Notes</h3>
              {quote.fields['Quote Notes'] && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Quote Notes (visible to client)</p>
                  <p className="mt-1 text-gray-700">{quote.fields['Quote Notes']}</p>
                </div>
              )}
              {quote.fields['Internal Notes'] && (
                <div>
                  <p className="text-sm text-gray-500">Internal Notes</p>
                  <p className="mt-1 text-gray-700">{quote.fields['Internal Notes']}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quote.fields.Status === 'Accepted' && (
                <button
                  onClick={handleConvertToJob}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Briefcase className="h-4 w-4" />
                  Convert to Job
                </button>
              )}
              <Link
                href={`/finances/quotes/${quote.id}/edit`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Edit className="h-4 w-4" />
                Edit Quote
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-4 w-4" />
                Delete Quote
              </button>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-2">
              {(['Pending', 'Sent', 'Accepted', 'Rejected', 'Expired'] as const).map((status) => {
                const config = STATUS_COLORS[status];
                const Icon = config.icon;
                const isActive = quote.fields.Status === status;
                return (
                  <button
                    key={status}
                    onClick={() => updateQuoteStatus(status)}
                    disabled={updating || isActive}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                      isActive
                        ? `${config.bg} ${config.text} font-medium`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {quote.fields['Created Date']
                    ? format(new Date(quote.fields['Created Date']), 'MMM d, yyyy')
                    : '-'}
                </dd>
              </div>
              {quote.fields['Sent Date'] && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sent</dt>
                  <dd className="text-gray-900">
                    {format(new Date(quote.fields['Sent Date']), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              {quote.fields['Expiration Date'] && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Expires</dt>
                  <dd className="text-gray-900">
                    {format(new Date(quote.fields['Expiration Date']), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              {quote.fields['Response Date'] && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Response</dt>
                  <dd className="text-gray-900">
                    {format(new Date(quote.fields['Response Date']), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Client Info */}
          {client && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                Client
              </h3>
              <Link
                href={`/clients/${client.id}`}
                className="block hover:bg-gray-50 -m-2 p-2 rounded-lg"
              >
                <p className="font-medium text-gray-900">{client.fields.Name}</p>
                {client.fields.Email && (
                  <p className="text-sm text-gray-500">{client.fields.Email}</p>
                )}
                {client.fields.Phone && (
                  <p className="text-sm text-gray-500">{client.fields.Phone}</p>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
