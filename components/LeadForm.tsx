'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lead } from '@/types/airtable';
import { AddressAutocomplete } from './AddressAutocomplete';
import { DraftRestoreModal } from './DraftRestoreModal';
import { useDraftSave } from '@/hooks/useDraftSave';

interface LeadFormProps {
  initialData?: Lead['fields'];
  onSave: (data: Lead['fields']) => Promise<void>;
  onCancel: () => void;
}

export function LeadForm({ initialData, onSave, onCancel }: LeadFormProps) {
  const [formData, setFormData] = useState<Lead['fields']>({
    Name: initialData?.Name || '',
    Email: initialData?.Email || '',
    Phone: initialData?.Phone || '',
    Address: initialData?.Address || '',
    City: initialData?.City || '',
    State: initialData?.State || '',
    'Zip Code': initialData?.['Zip Code'] || '',
    'Lead Source': initialData?.['Lead Source'] || 'Angi',
    'Angi Lead ID': initialData?.['Angi Lead ID'] || '',
    'Service Type Interested': initialData?.['Service Type Interested'],
    Bedrooms: initialData?.Bedrooms,
    Bathrooms: initialData?.Bathrooms,
    Status: initialData?.Status || 'New',
    Owner: initialData?.Owner,
    Notes: initialData?.Notes || '',
    'Next Follow-Up Date': initialData?.['Next Follow-Up Date'] || '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft save functionality - only for new leads
  const isNewLead = !initialData?.Name;
  const { hasDraft, draftData, clearDraft } = useDraftSave({
    key: 'new-lead',
    data: formData,
    enabled: isNewLead,
  });

  const [showDraftModal, setShowDraftModal] = useState(false);

  useEffect(() => {
    if (hasDraft && draftData && isNewLead) {
      setShowDraftModal(true);
    }
  }, [hasDraft, draftData, isNewLead]);

  const handleRestoreDraft = useCallback(() => {
    if (draftData) {
      setFormData(draftData as Lead['fields']);
    }
    setShowDraftModal(false);
  }, [draftData]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftModal(false);
  }, [clearDraft]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: string | number | undefined = value;

    if (type === 'number' && value !== '') {
      processedValue = parseFloat(value);
    } else if (value === '') {
      processedValue = undefined;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.Name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      clearDraft();
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DraftRestoreModal
        isOpen={showDraftModal}
        entityType="lead"
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="Name"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="Phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                id="Phone"
                name="Phone"
                value={formData.Phone || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="Email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="Email"
                name="Email"
                value={formData.Email || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="Lead Source" className="block text-sm font-medium text-gray-700">
                Lead Source
              </label>
              <select
                id="Lead Source"
                name="Lead Source"
                value={formData['Lead Source'] || 'Angi'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="Angi">Angi</option>
                <option value="Referral">Referral</option>
                <option value="Direct">Direct</option>
                <option value="Google">Google</option>
                <option value="Facebook">Facebook</option>
                <option value="Thumbtack">Thumbtack</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="Owner" className="block text-sm font-medium text-gray-700">
                Owner
              </label>
              <select
                id="Owner"
                name="Owner"
                value={formData.Owner || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select owner...</option>
                <option value="Sean">Sean</option>
                <option value="Webb">Webb</option>
              </select>
            </div>

            {formData['Lead Source'] === 'Angi' && (
              <div>
                <label htmlFor="Angi Lead ID" className="block text-sm font-medium text-gray-700">
                  Angi Lead ID
                </label>
                <input
                  type="text"
                  id="Angi Lead ID"
                  name="Angi Lead ID"
                  value={formData['Angi Lead ID'] || ''}
                  onChange={handleChange}
                  placeholder="For tracking/deduplication"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="Address" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <AddressAutocomplete
                value={formData.Address || ''}
                onChange={(address) => setFormData(prev => ({ ...prev, Address: address }))}
                onAddressSelect={(components) => {
                  setFormData(prev => ({
                    ...prev,
                    City: components.city || prev.City,
                    State: components.state || prev.State,
                    'Zip Code': components.zipCode || prev['Zip Code'],
                  }));
                }}
                placeholder="Start typing address..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="City" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="City"
                name="City"
                value={formData.City || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="State" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="State"
                  name="State"
                  value={formData.State || ''}
                  onChange={handleChange}
                  placeholder="CA"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="Zip Code" className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input
                  type="text"
                  id="Zip Code"
                  name="Zip Code"
                  value={formData['Zip Code'] || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Interest */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Interest</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="Service Type Interested" className="block text-sm font-medium text-gray-700">
                Service Type
              </label>
              <select
                id="Service Type Interested"
                name="Service Type Interested"
                value={formData['Service Type Interested'] || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Not specified</option>
                <option value="General Clean">General Clean</option>
                <option value="Deep Clean">Deep Clean</option>
                <option value="Move-In-Out">Move-In-Out</option>
              </select>
            </div>

            <div>
              <label htmlFor="Bedrooms" className="block text-sm font-medium text-gray-700">
                Bedrooms
              </label>
              <input
                type="number"
                id="Bedrooms"
                name="Bedrooms"
                min="0"
                value={formData.Bedrooms ?? ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="Bathrooms" className="block text-sm font-medium text-gray-700">
                Bathrooms
              </label>
              <input
                type="number"
                id="Bathrooms"
                name="Bathrooms"
                min="0"
                step="0.5"
                value={formData.Bathrooms ?? ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status & Follow-Up */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Follow-Up</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="Status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="Status"
                name="Status"
                value={formData.Status || 'New'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Quote Sent">Quote Sent</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Churned">Churned</option>
              </select>
            </div>

            <div>
              <label htmlFor="Next Follow-Up Date" className="block text-sm font-medium text-gray-700">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                id="Next Follow-Up Date"
                name="Next Follow-Up Date"
                value={formData['Next Follow-Up Date'] || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <textarea
            id="Notes"
            name="Notes"
            rows={4}
            value={formData.Notes || ''}
            onChange={handleChange}
            placeholder="Any additional notes about this lead..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : initialData ? 'Update Lead' : 'Create Lead'}
        </button>
      </div>
    </form>
    </>
  );
}
