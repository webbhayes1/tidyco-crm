'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Client, Cleaner, Team } from '@/types/airtable';
import { ScheduleSyncModal } from './ScheduleSyncModal';
import { AddressAutocomplete } from './AddressAutocomplete';
import { DraftRestoreModal } from './DraftRestoreModal';
import { useDraftSave } from '@/hooks/useDraftSave';

interface ClientFormProps {
  client?: Client;
  onSave: (data: Partial<Client['fields']>) => Promise<void>;
  onCancel: () => void;
}

// Helper to compare schedule fields
function hasScheduleChanged(
  original: {
    recurringDays: string[];
    recurringStartTime: string;
    recurringEndTime: string;
    recurrenceFrequency: string;
    preferredCleaner: string;
  },
  current: {
    recurringDays: string[];
    recurringStartTime: string;
    recurringEndTime: string;
    recurrenceFrequency: string;
    preferredCleaner: string;
  }
): boolean {
  // Compare recurring days
  if (original.recurringDays.join(',') !== current.recurringDays.join(',')) return true;
  // Compare times
  if (original.recurringStartTime !== current.recurringStartTime) return true;
  if (original.recurringEndTime !== current.recurringEndTime) return true;
  // Compare frequency
  if (original.recurrenceFrequency !== current.recurrenceFrequency) return true;
  // Compare cleaner
  if (original.preferredCleaner !== current.preferredCleaner) return true;
  return false;
}

// Days of the week
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// Time options for schedule
const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
];

// Common cities in the service area
const CITY_SUGGESTIONS = [
  'Manhattan Beach',
  'Hermosa Beach',
  'Redondo Beach',
  'El Segundo',
  'Torrance',
  'Palos Verdes',
  'Rancho Palos Verdes',
  'Rolling Hills',
  'Rolling Hills Estates',
  'Hawthorne',
  'Gardena',
  'Carson',
  'Long Beach',
  'San Pedro',
  'Lomita',
  'Los Angeles',
  'Inglewood',
  'Culver City',
  'Marina del Rey',
  'Playa del Rey',
  'Venice',
  'Santa Monica',
];

// Format phone number as (XXX) XXX-XXXX
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Schedule sync modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [futureJobsCount, setFutureJobsCount] = useState(0);
  const [syncMode, setSyncMode] = useState<'sync' | 'generate'>('sync');

  // Track original schedule values for comparison (only for existing clients)
  const originalScheduleRef = useRef({
    recurringDays: client?.fields['Recurring Days']?.split(', ') || [],
    recurringStartTime: client?.fields['Recurring Start Time'] || '8:00 AM',
    recurringEndTime: client?.fields['Recurring End Time'] || '11:00 AM',
    recurrenceFrequency: client?.fields['Recurrence Frequency'] || '',
    preferredCleaner: client?.fields['Preferred Cleaner']?.[0] || '',
  });

  // Fetch cleaners and teams for dropdown
  useEffect(() => {
    Promise.all([
      fetch('/api/cleaners').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
    ])
      .then(([cleanersData, teamsData]) => {
        setCleaners(cleanersData.filter((c: Cleaner) => c.fields.Status === 'Active'));
        setTeams(teamsData.filter((t: Team) => t.fields.Status === 'Active'));
      })
      .catch(err => console.error('Failed to load cleaners/teams:', err));
  }, []);

  // Helper to parse existing name into first/last
  const parseExistingName = () => {
    if (client?.fields['First Name']) {
      return {
        firstName: client.fields['First Name'],
        lastName: client.fields['Last Name'] || ''
      };
    }
    // Fall back to splitting the Name field
    const fullName = client?.fields.Name || '';
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const { firstName: initialFirstName, lastName: initialLastName } = parseExistingName();

  // Form state
  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: client?.fields.Email || '',
    phone: client?.fields.Phone || '',
    address: client?.fields.Address || '',
    addressLine2: client?.fields['Address Line 2'] || '',
    city: client?.fields.City || '',
    state: client?.fields.State || 'CA',
    zipCode: client?.fields['Zip Code'] || '',
    status: client?.fields.Status || 'Active',
    owner: client?.fields.Owner || '',
    preferredCleaner: client?.fields['Preferred Cleaner']?.[0] || '',
    leadSource: client?.fields['Lead Source'] || '',
    preferredPaymentMethod: client?.fields['Preferred Payment Method'] || '',
    isRecurring: client?.fields['Is Recurring'] || false,
    recurrenceFrequency: client?.fields['Recurrence Frequency'] || '',
    recurringDay: client?.fields['Recurring Day'] || '',
    recurringDays: client?.fields['Recurring Days']?.split(', ') || [],
    recurringStartTime: client?.fields['Recurring Start Time'] || '8:00 AM',
    recurringEndTime: client?.fields['Recurring End Time'] || '11:00 AM',
    firstCleaningDate: client?.fields['First Cleaning Date'] || '',
    pricingType: client?.fields['Pricing Type'] || 'Per Cleaning',
    clientHourlyRate: client?.fields['Client Hourly Rate'] || 35,
    chargePerCleaning: client?.fields['Charge Per Cleaning'] || 150,
    bedrooms: client?.fields['Bedrooms'] || 3,
    bathrooms: client?.fields['Bathrooms'] || 2,
    preferences: client?.fields.Preferences || '',
    entryInstructions: client?.fields['Entry Instructions'] || '',
    notes: client?.fields.Notes || '',
  });

  // Draft save functionality - only for new clients
  const draftKey = client?.id ? `client-${client.id}` : 'new-client';
  const { hasDraft, draftData, clearDraft } = useDraftSave({
    key: draftKey,
    data: formData,
    enabled: !client, // Only save drafts for new clients
  });

  const [showDraftModal, setShowDraftModal] = useState(false);

  // Check for draft on mount
  useEffect(() => {
    if (hasDraft && draftData && !client) {
      setShowDraftModal(true);
    }
  }, [hasDraft, draftData, client]);

  // Restore draft data
  const handleRestoreDraft = useCallback(() => {
    if (draftData) {
      setFormData(draftData as typeof formData);
    }
    setShowDraftModal(false);
  }, [draftData]);

  // Discard draft
  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftModal(false);
  }, [clearDraft]);

  // Build client data from form
  const buildClientData = (): Partial<Client['fields']> => {
    const fullName = formData.lastName
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : formData.firstName.trim();

    const clientData: Partial<Client['fields']> = {
      Name: fullName,
      'First Name': formData.firstName.trim(),
      'Last Name': formData.lastName.trim() || undefined,
      Email: formData.email,
      Phone: formData.phone,
      Address: formData.address,
      'Address Line 2': formData.addressLine2 || undefined,
      City: formData.city,
      State: formData.state,
      'Zip Code': formData.zipCode,
      Status: formData.status as Client['fields']['Status'],
      Notes: formData.notes,
      Preferences: formData.preferences,
      'Entry Instructions': formData.entryInstructions,
    };

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

    clientData['Pricing Type'] = formData.pricingType as Client['fields']['Pricing Type'];
    if (formData.pricingType === 'Hourly Rate') {
      clientData['Client Hourly Rate'] = formData.clientHourlyRate;
    } else {
      clientData['Charge Per Cleaning'] = formData.chargePerCleaning;
    }

    clientData['Bedrooms'] = formData.bedrooms;
    clientData['Bathrooms'] = formData.bathrooms;

    clientData['Is Recurring'] = formData.isRecurring;
    if (formData.isRecurring) {
      if (formData.recurrenceFrequency) {
        clientData['Recurrence Frequency'] = formData.recurrenceFrequency as Client['fields']['Recurrence Frequency'];
      }
      if (formData.recurringDays.length > 0) {
        clientData['Recurring Days'] = formData.recurringDays.join(', ');
        clientData['Recurring Day'] = formData.recurringDays[0] as Client['fields']['Recurring Day'];
      }
      if (formData.recurringStartTime) {
        clientData['Recurring Start Time'] = formData.recurringStartTime;
      }
      if (formData.recurringEndTime) {
        clientData['Recurring End Time'] = formData.recurringEndTime;
      }
      if (formData.firstCleaningDate) {
        clientData['First Cleaning Date'] = formData.firstCleaningDate;
      }
    }

    return clientData;
  };

  // Sync or generate jobs with schedule
  const syncJobsWithSchedule = async () => {
    if (!client?.id) return;

    try {
      await fetch(`/api/clients/${client.id}/sync-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringDays: formData.recurringDays,
          recurringStartTime: formData.recurringStartTime,
          recurringEndTime: formData.recurringEndTime,
          preferredCleaner: formData.preferredCleaner ? [formData.preferredCleaner] : [],
          frequency: formData.recurrenceFrequency,
          mode: syncMode, // 'sync' or 'generate'
        }),
      });
    } catch (error) {
      console.error('Failed to sync jobs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const clientData = buildClientData();

      // Check if this is an existing client and schedule has changed
      if (client?.id && formData.isRecurring) {
        const currentSchedule = {
          recurringDays: formData.recurringDays,
          recurringStartTime: formData.recurringStartTime,
          recurringEndTime: formData.recurringEndTime,
          recurrenceFrequency: formData.recurrenceFrequency,
          preferredCleaner: formData.preferredCleaner,
        };

        if (hasScheduleChanged(originalScheduleRef.current, currentSchedule)) {
          // Check how many future jobs exist
          const response = await fetch(`/api/clients/${client.id}/sync-jobs`);
          const data = await response.json();

          // Save client data directly via API (don't use onSave which navigates)
          await fetch(`/api/clients/${client.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData),
          });

          if (data.count > 0) {
            // Has future jobs - offer to sync them
            setSyncMode('sync');
            setFutureJobsCount(data.count);
            setShowSyncModal(true);
            setLoading(false);
            return;
          } else if (formData.recurringDays.length > 0) {
            // No future jobs but has recurring schedule - offer to generate
            setSyncMode('generate');
            setFutureJobsCount(0);
            setShowSyncModal(true);
            setLoading(false);
            return;
          }
        }
      }

      clearDraft(); // Clear draft on successful save
      await onSave(clientData);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.recurringDays;
    if (currentDays.includes(day)) {
      handleChange('recurringDays', currentDays.filter(d => d !== day));
    } else {
      // Keep days in order
      const newDays = DAYS_OF_WEEK.filter(d => currentDays.includes(d) || d === day);
      handleChange('recurringDays', [...newDays]);
    }
  };

  return (
    <>
      {/* Draft Restore Modal */}
      <DraftRestoreModal
        isOpen={showDraftModal}
        entityType="client"
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Contact Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="John"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Smith (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
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
              onChange={(e) => handleChange('phone', formatPhoneNumber(e.target.value))}
              placeholder="(310) 555-1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              maxLength={14}
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
          <AddressAutocomplete
            value={formData.address}
            onChange={(address) => handleChange('address', address)}
            onAddressSelect={(components) => {
              // Auto-fill city, state, zip from Google Places
              if (components.city) handleChange('city', components.city);
              if (components.state) handleChange('state', components.state);
              if (components.zipCode) handleChange('zipCode', components.zipCode);
            }}
            placeholder="Start typing address..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apt / Unit / Suite
          </label>
          <input
            type="text"
            value={formData.addressLine2}
            onChange={(e) => handleChange('addressLine2', e.target.value)}
            placeholder="Apt 2B, Unit 101, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => {
                handleChange('city', e.target.value);
                setShowCitySuggestions(true);
              }}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
              placeholder="Start typing city..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {showCitySuggestions && formData.city && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {CITY_SUGGESTIONS
                  .filter(city => city.toLowerCase().includes(formData.city.toLowerCase()))
                  .map(city => (
                    <button
                      key={city}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                      onMouseDown={() => {
                        handleChange('city', city);
                        setShowCitySuggestions(false);
                      }}
                    >
                      {city}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <select
              required
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="CA">California</option>
            </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <select
              value={formData.bedrooms}
              onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <select
              value={formData.bathrooms}
              onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
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
              Preferred Cleaner / Team
            </label>
            <select
              value={formData.preferredCleaner}
              onChange={(e) => handleChange('preferredCleaner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select cleaner or team...</option>
              {teams.length > 0 && (
                <optgroup label="Teams">
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.fields['Team Name']} ({team.fields['Member Count'] || 0} members)
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Individual Cleaners">
                {cleaners.map(cleaner => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.fields.Name}
                  </option>
                ))}
              </optgroup>
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

      {/* Pricing */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Pricing</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingType"
                value="Per Cleaning"
                checked={formData.pricingType === 'Per Cleaning'}
                onChange={(e) => handleChange('pricingType', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Charge Per Cleaning</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pricingType"
                value="Hourly Rate"
                checked={formData.pricingType === 'Hourly Rate'}
                onChange={(e) => handleChange('pricingType', e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Hourly Rate</span>
            </label>
          </div>
        </div>

        {formData.pricingType === 'Per Cleaning' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charge Per Cleaning
            </label>
            <div className="relative w-48">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.chargePerCleaning}
                onChange={(e) => handleChange('chargePerCleaning', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                min="0"
                step="5"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Fixed amount charged per cleaning visit</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate
            </label>
            <div className="relative w-48">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.clientHourlyRate}
                onChange={(e) => handleChange('clientHourlyRate', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                min="0"
                step="5"
              />
              <span className="absolute right-3 top-2 text-gray-500">/hr</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Rate charged per hour of cleaning</p>
          </div>
        )}
      </div>

      {/* Recurring Schedule */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Recurring Schedule</h3>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={(e) => handleChange('isRecurring', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
            This client has a recurring cleaning schedule
          </label>
        </div>

        {formData.isRecurring && (
          <div className="space-y-4 pt-2">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={formData.recurrenceFrequency}
                onChange={(e) => handleChange('recurrenceFrequency', e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select frequency...</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly (Every 2 weeks)</option>
                <option value="Monthly">Monthly</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Select specific days of the week below for recurring cleanings</p>
            </div>

            {/* Days of Week - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.recurringDays.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              {formData.recurringDays.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {formData.recurringDays.join(', ')}
                </p>
              )}
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={formData.recurringStartTime}
                  onChange={(e) => handleChange('recurringStartTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <span className="text-gray-500">to</span>
                <select
                  value={formData.recurringEndTime}
                  onChange={(e) => handleChange('recurringEndTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* First Cleaning Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Cleaning Date
              </label>
              <input
                type="date"
                value={formData.firstCleaningDate}
                onChange={(e) => handleChange('firstCleaningDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">When does the recurring schedule start?</p>
            </div>

            {/* Schedule Summary */}
            {formData.recurringDays.length > 0 && formData.recurrenceFrequency && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Schedule: </span>
                  {formData.recurrenceFrequency} on {formData.recurringDays.join(', ')}, {formData.recurringStartTime} - {formData.recurringEndTime}
                  {formData.firstCleaningDate && ` (starting ${new Date(formData.firstCleaningDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Additional Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Instructions
          </label>
          <textarea
            value={formData.entryInstructions}
            onChange={(e) => handleChange('entryInstructions', e.target.value)}
            placeholder="Gate codes, key locations, garage codes, how to access property..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Instructions for cleaners to enter the property</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Preferences
          </label>
          <textarea
            value={formData.preferences}
            onChange={(e) => handleChange('preferences', e.target.value)}
            placeholder="Any special requests, focus areas, cleaning preferences, etc."
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

      {/* Schedule Sync Modal */}
      <ScheduleSyncModal
        isOpen={showSyncModal}
        onClose={() => {
          setShowSyncModal(false);
          // Navigate back after modal closes
          if (client?.id) {
            window.location.href = `/clients/${client.id}`;
          }
        }}
        onConfirm={async () => {
          await syncJobsWithSchedule();
          // Navigate back after sync completes
          if (client?.id) {
            window.location.href = `/clients/${client.id}`;
          }
        }}
        futureJobsCount={futureJobsCount}
        clientName={formData.firstName + (formData.lastName ? ' ' + formData.lastName : '')}
        mode={syncMode}
      />
    </form>
    </>
  );
}