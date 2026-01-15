'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Client, Quote } from '@/types/airtable';

const SERVICE_TYPES = ['General Clean', 'Deep Clean', 'Move-In-Out'] as const;

function calculateEstimatedHours(serviceType: string, bedrooms: number, bathrooms: number): number {
  const baseHours: Record<string, number> = {
    'General Clean': 1.5,
    'Deep Clean': 3,
    'Move-In-Out': 4,
  };
  const base = baseHours[serviceType] || 2;
  return base + (bedrooms * 0.5) + (bathrooms * 0.3);
}

export default function EditQuotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    serviceType: 'General Clean' as typeof SERVICE_TYPES[number],
    bedrooms: 2,
    bathrooms: 1,
    address: '',
    zipCode: '',
    hourlyRate: 45,
    quoteNotes: '',
    internalNotes: '',
    status: 'Pending' as Quote['fields']['Status'],
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [quoteRes, clientsRes] = await Promise.all([
          fetch(`/api/quotes/${params.id}`),
          fetch('/api/clients'),
        ]);

        if (!quoteRes.ok) throw new Error('Quote not found');

        const quote = await quoteRes.json();
        const clientsData = await clientsRes.json();

        setClients(Array.isArray(clientsData) ? clientsData : []);
        setFormData({
          clientId: quote.fields.Client?.[0] || '',
          serviceType: quote.fields['Service Type'] || 'General Clean',
          bedrooms: quote.fields.Bedrooms || 2,
          bathrooms: quote.fields.Bathrooms || 1,
          address: quote.fields.Address || '',
          zipCode: quote.fields['Zip Code'] || '',
          hourlyRate: quote.fields['Client Hourly Rate'] || 45,
          quoteNotes: quote.fields['Quote Notes'] || '',
          internalNotes: quote.fields['Internal Notes'] || '',
          status: quote.fields.Status || 'Pending',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const estimatedHours = calculateEstimatedHours(formData.serviceType, formData.bedrooms, formData.bathrooms);
  const priceQuote = estimatedHours * formData.hourlyRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const quoteData: Partial<Quote['fields']> = {
        Client: [formData.clientId],
        'Service Type': formData.serviceType,
        Bedrooms: formData.bedrooms,
        Bathrooms: formData.bathrooms,
        Address: formData.address,
        'Zip Code': formData.zipCode,
        'Client Hourly Rate': formData.hourlyRate,
        Status: formData.status,
        'Quote Notes': formData.quoteNotes || undefined,
        'Internal Notes': formData.internalNotes || undefined,
      };

      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      router.push(`/finances/quotes/${params.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/finances/quotes/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title="Edit Quote" description="Update quote details" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              required
            >
              <option value="">Select a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fields.Name} {client.fields.Email ? `(${client.fields.Email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Quote['fields']['Status'] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
            >
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as typeof SERVICE_TYPES[number] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              required
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              placeholder="123 Main St, City, State"
            />
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              placeholder="90266"
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Price Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2">Quote Preview</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Est. Hours</p>
                <p className="text-lg font-semibold text-gray-900">{estimatedHours.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rate</p>
                <p className="text-lg font-semibold text-gray-900">${formData.hourlyRate}/hr</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-tidyco-blue">${priceQuote.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Notes (visible to client)
            </label>
            <textarea
              value={formData.quoteNotes}
              onChange={(e) => setFormData({ ...formData, quoteNotes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              placeholder="Add any notes that the client should see..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-tidyco-blue focus:border-transparent"
              placeholder="Add any internal notes..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href={`/finances/quotes/${params.id}`}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-tidyco-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}