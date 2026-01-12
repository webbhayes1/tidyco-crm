'use client';

import { useState, useEffect } from 'react';
import type { Client, Cleaner } from '@/types/airtable';

interface ClientFormProps {
  client?: Client;
  onSave: (data: Partial<Client['fields']>) => Promise<void>;
  onCancel: () => void;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);

  // Fetch cleaners for dropdown
  useEffect(() => {
    fetch('/api/cleaners')
      .then(r => r.json())
      .then(data => setCleaners(data.filter((c: Cleaner) => c.fields.Status === 'Active')))
      .catch(err => console.error('Failed to load cleaners:', err));
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: client?.fields.Name || '',
    email: client?.fields.Email || '',
    phone: client?.fields.Phone || '',
    address: client?.fields.Address || '',
    zipCode: client?.fields['Zip Code'] || '',
    status: client?.fields.Status || 'Active',
    owner: client?.fields.Owner || '',
    preferredCleaner: client?.fields['Preferred Cleaner']?.[0] || '',
    leadSource: client?.fields['Lead Source'] || '',
    preferredPaymentMethod: client?.fields['Preferred Payment Method'] || '',
    preferences: client?.fields.Preferences || '',
    notes: client?.fields.Notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientData: Partial<Client['fields']> = {
        Name: formData.name,
        Email: formData.email,
        Phone: formData.phone,
        Address: formData.address,
        'Zip Code': formData.zipCode,
        Status: formData.status as Client['fields']['Status'],
        Notes: formData.notes,
        Preferences: formData.preferences,
      };

      // Only add optional fields if they have values
      if (formData.owner) {
        clientData.Owner = formData.owner as 'Sean' | 'Webb';
      }
      if (formData.preferredCleaner) {
        clientData['Preferred Cleaner'] = [formData.preferredCleaner];
      }
      if (formData.leadSource) {
        clientData['Lead Source'] = formData.leadSource as Client['fields']['Lead Source'];
      }
      if (formData.preferredPaymentMethod) {
        clientData['Preferred Payment Method'] = formData.preferredPaymentMethod as Client['fields']['Preferred Payment Method'];
      }

      await onSave(clientData);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Contact Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Smith"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(310) 555-1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Property Address</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main St, Manhattan Beach, CA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zip Code *
          </label>
          <input
            type="text"
            required
            value={formData.zipCode}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            placeholder="90266"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg max-w-xs"
          />
        </div>
      </div>

      {/* Assignment & Ownership */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Assignment</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner (Who manages this client?)
            </label>
            <select
              value={formData.owner}
              onChange={(e) => handleChange('owner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select owner...</option>
              <option value="Webb">Webb</option>
              <option value="Sean">Sean</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Cleaner
            </label>
            <select
              value={formData.preferredCleaner}
              onChange={(e) => handleChange('preferredCleaner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select cleaner...</option>
              {cleaners.map(cleaner => (
                <option key={cleaner.id} value={cleaner.id}>
                  {cleaner.fields.Name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Preferences</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Churned">Churned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Payment Method
            </label>
            <select
              value={formData.preferredPaymentMethod}
              onChange={(e) => handleChange('preferredPaymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select method...</option>
              <option value="Zelle">Zelle</option>
              <option value="Square">Square</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lead Source
          </label>
          <select
            value={formData.leadSource}
            onChange={(e) => handleChange('leadSource', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select source...</option>
            <option value="Angi">Angi</option>
            <option value="Referral">Referral</option>
            <option value="Direct">Direct</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Additional Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Preferences
          </label>
          <textarea
            value={formData.preferences}
            onChange={(e) => handleChange('preferences', e.target.value)}
            placeholder="Any special requests, focus areas, access instructions, etc."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Internal notes about the client..."
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </button>
      </div>
    </form>
  );
}