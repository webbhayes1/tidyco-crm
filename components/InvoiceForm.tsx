'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Invoice, Client } from '@/types/airtable';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface InvoiceFormProps {
  invoice?: Invoice;
  initialData?: Partial<Invoice['fields']>;
  onSave: (data: Partial<Invoice['fields']>) => Promise<void>;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, initialData, onSave, onCancel }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [formData, setFormData] = useState({
    clientId: invoice?.fields.Client?.[0] || initialData?.Client?.[0] || '',
    serviceDate: invoice?.fields['Service Date'] || initialData?.['Service Date'] || '',
    serviceType: invoice?.fields['Service Type'] || initialData?.['Service Type'] || 'General Clean',
    hours: invoice?.fields.Hours || initialData?.Hours || 0,
    rate: invoice?.fields.Rate || initialData?.Rate || 50,
    dueDate: invoice?.fields['Due Date'] || initialData?.['Due Date'] || '',
    notes: invoice?.fields.Notes || initialData?.Notes || '',
    status: invoice?.fields.Status || initialData?.Status || 'Pending',
  });

  // Capture initial form state for unsaved changes detection
  const initialFormState = useMemo(() => ({
    clientId: invoice?.fields.Client?.[0] || initialData?.Client?.[0] || '',
    serviceDate: invoice?.fields['Service Date'] || initialData?.['Service Date'] || '',
    serviceType: invoice?.fields['Service Type'] || initialData?.['Service Type'] || 'General Clean',
    hours: invoice?.fields.Hours || initialData?.Hours || 0,
    rate: invoice?.fields.Rate || initialData?.Rate || 50,
    dueDate: invoice?.fields['Due Date'] || initialData?.['Due Date'] || '',
    notes: invoice?.fields.Notes || initialData?.Notes || '',
    status: invoice?.fields.Status || initialData?.Status || 'Pending',
  }), [invoice?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes detection - only for editing existing invoices
  const { markClean } = useUnsavedChanges({
    formId: `invoice-${invoice?.id || 'new'}`,
    formData,
    initialData: initialFormState,
    enabled: !!invoice, // Only enable for editing, not for new invoices
  });

  // Fetch clients for dropdown
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        setClients(data);
        setLoadingClients(false);
      })
      .catch((error) => {
        console.error('Error fetching clients:', error);
        setLoadingClients(false);
      });
  }, []);

  // Calculate amount
  const amount = formData.hours * formData.rate;

  // Set due date to 14 days from service date if not set
  useEffect(() => {
    if (formData.serviceDate && !formData.dueDate) {
      const serviceDate = new Date(formData.serviceDate);
      const dueDate = new Date(serviceDate);
      dueDate.setDate(dueDate.getDate() + 14);
      setFormData((prev) => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.serviceDate, formData.dueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert('Please select a client');
      return;
    }
    if (!formData.serviceDate) {
      alert('Please enter a service date');
      return;
    }
    if (formData.hours <= 0) {
      alert('Please enter hours worked');
      return;
    }

    setLoading(true);
    try {
      markClean(); // Mark form as clean before navigation
      await onSave({
        Client: [formData.clientId],
        'Service Date': formData.serviceDate,
        'Service Type': formData.serviceType as Invoice['fields']['Service Type'],
        Hours: formData.hours,
        Rate: formData.rate,
        'Due Date': formData.dueDate || undefined,
        Notes: formData.notes || undefined,
        Status: formData.status as Invoice['fields']['Status'],
      });
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Client Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client *
          </label>
          {loadingClients ? (
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Loading clients...
            </div>
          ) : (
            <select
              required
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fields.Name} {client.fields.Email ? `(${client.fields.Email})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Service Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Date *
            </label>
            <input
              type="date"
              required
              value={formData.serviceDate}
              onChange={(e) => handleChange('serviceDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type *
            </label>
            <select
              required
              value={formData.serviceType}
              onChange={(e) => handleChange('serviceType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="General Clean">General Clean</option>
              <option value="Deep Clean">Deep Clean</option>
              <option value="Move-In-Out">Move-In-Out</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours *
            </label>
            <input
              type="number"
              required
              min="0.5"
              step="0.5"
              value={formData.hours}
              onChange={(e) => handleChange('hours', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate ($/hr) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="5"
              value={formData.rate}
              onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-lg font-semibold">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-900 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-tidyco-blue">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Billing Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Billing Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 14 days from service date</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Voided">Voided</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Notes</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional notes for this invoice..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-tidyco-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
