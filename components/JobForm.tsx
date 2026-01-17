'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Job, Client, Cleaner, Team } from '@/types/airtable';
import { Users2 } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { DraftIndicator } from './DraftIndicator';
import { useDraftSave } from '@/hooks/useDraftSave';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

// Days of the week for recurring selection
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

interface JobFormProps {
  job?: Job;
  onSave: (data: Partial<Job['fields']>) => Promise<void>;
  onCancel: () => void;
}

export function JobForm({ job, onSave, onCancel }: JobFormProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Form state - using actual Airtable field names
  const [formData, setFormData] = useState({
    client: job?.fields.Client?.[0] || '',
    selectedCleaners: job?.fields.Cleaner || [],
    selectedTeam: job?.fields.Team?.[0] || '',
    date: job?.fields.Date || '',
    time: job?.fields.Time || '',
    endTime: job?.fields['End Time'] || '',
    serviceType: job?.fields['Service Type'] || 'General Clean',
    address: job?.fields.Address || '',
    addressLine2: job?.fields['Address Line 2'] || '',
    city: job?.fields.City || '',
    state: job?.fields.State || '',
    zipCode: job?.fields['Zip Code'] || '',
    bedrooms: job?.fields.Bedrooms || 0,
    bathrooms: job?.fields.Bathrooms || 0,
    durationHours: job?.fields['Duration Hours'] || 2,
    clientHourlyRate: job?.fields['Client Hourly Rate'] || 0,
    amountCharged: job?.fields['Amount Charged'] || 0,
    status: job?.fields.Status || 'Scheduled',
    isRecurring: job?.fields['Is Recurring'] || false,
    recurrenceFrequency: job?.fields['Recurrence Frequency'] || undefined,
    recurringDay: job?.fields['Recurring Day'] || '',
    notes: job?.fields.Notes || '',
  });

  // Capture initial data for unsaved changes detection
  const initialData = useMemo(() => ({
    client: job?.fields.Client?.[0] || '',
    selectedCleaners: job?.fields.Cleaner || [],
    selectedTeam: job?.fields.Team?.[0] || '',
    date: job?.fields.Date || '',
    time: job?.fields.Time || '',
    endTime: job?.fields['End Time'] || '',
    serviceType: job?.fields['Service Type'] || 'General Clean',
    address: job?.fields.Address || '',
    addressLine2: job?.fields['Address Line 2'] || '',
    city: job?.fields.City || '',
    state: job?.fields.State || '',
    zipCode: job?.fields['Zip Code'] || '',
    bedrooms: job?.fields.Bedrooms || 0,
    bathrooms: job?.fields.Bathrooms || 0,
    durationHours: job?.fields['Duration Hours'] || 2,
    clientHourlyRate: job?.fields['Client Hourly Rate'] || 0,
    amountCharged: job?.fields['Amount Charged'] || 0,
    status: job?.fields.Status || 'Scheduled',
    isRecurring: job?.fields['Is Recurring'] || false,
    recurrenceFrequency: job?.fields['Recurrence Frequency'] || undefined,
    recurringDay: job?.fields['Recurring Day'] || '',
    notes: job?.fields.Notes || '',
  }), [job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes detection - only for editing existing jobs
  const { markClean } = useUnsavedChanges({
    formId: `job-${job?.id || 'new'}`,
    formData,
    initialData,
    enabled: !!job, // Only enable for editing, not for new jobs
  });

  // Draft save functionality - only for new jobs
  const isNewJob = !job;
  const { hasDraft, draftData, clearDraft } = useDraftSave({
    key: 'new-job',
    data: formData,
    enabled: isNewJob,
  });

  // Restore draft data
  const handleRestoreDraft = useCallback(() => {
    if (draftData) {
      setFormData(draftData as typeof formData);
    }
  }, [draftData]);

  // Delete draft
  const handleDeleteDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  // Toggle day selection for recurring jobs
  const toggleDay = (day: string) => {
    // For now, just set a single day (can expand to multi-day later if needed)
    handleChange('recurringDay', formData.recurringDay === day ? '' : day);
  };

  // Assignment type: 'individual' or 'team'
  const [assignmentType, setAssignmentType] = useState<'individual' | 'team'>(
    job?.fields.Team?.[0] ? 'team' : 'individual'
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/cleaners').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
    ]).then(([clientsData, cleanersData, teamsData]) => {
      setClients(clientsData);
      setCleaners(cleanersData.filter((c: Cleaner) => c.fields.Status === 'Active'));
      setTeams(teamsData.filter((t: Team) => t.fields.Status === 'Active'));
    });
  }, []);

  // When team is selected, populate cleaners from team
  const handleTeamSelect = (teamId: string) => {
    handleChange('selectedTeam', teamId);
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team?.fields.Members) {
        handleChange('selectedCleaners', team.fields.Members);
      }
    } else {
      handleChange('selectedCleaners', []);
    }
  };

  // Toggle individual cleaner selection
  const toggleCleaner = (cleanerId: string, checked: boolean) => {
    let newCleaners: string[];
    if (checked) {
      newCleaners = [...formData.selectedCleaners, cleanerId];
    } else {
      newCleaners = formData.selectedCleaners.filter(id => id !== cleanerId);
    }
    handleChange('selectedCleaners', newCleaners);
  };

  // Calculate combined hourly rate for selected cleaners
  const combinedHourlyRate = formData.selectedCleaners.reduce((sum, cleanerId) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    return sum + (cleaner?.fields['Hourly Rate'] || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert form data to Airtable format
      const jobData: Partial<Job['fields']> = {
        Client: formData.client ? [formData.client] : undefined,
        Cleaner: formData.selectedCleaners.length > 0 ? formData.selectedCleaners : undefined,
        Team: assignmentType === 'team' && formData.selectedTeam ? [formData.selectedTeam] : undefined,
        Date: formData.date,
        Time: formData.time,
        'End Time': formData.endTime,
        'Service Type': formData.serviceType as 'General Clean' | 'Deep Clean' | 'Move-In-Out',
        Address: formData.address,
        'Address Line 2': formData.addressLine2 || undefined,
        City: formData.city || undefined,
        State: formData.state || undefined,
        'Zip Code': formData.zipCode || undefined,
        Bedrooms: formData.bedrooms,
        Bathrooms: formData.bathrooms,
        'Duration Hours': formData.durationHours,
        'Client Hourly Rate': formData.clientHourlyRate,
        'Amount Charged': formData.amountCharged,
        Status: formData.status as 'Pending' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled',
        'Is Recurring': formData.isRecurring,
        'Recurrence Frequency': formData.recurrenceFrequency,
        'Recurring Day': formData.recurringDay as Job['fields']['Recurring Day'] || undefined,
        Notes: formData.notes,
      };

      markClean(); // Mark form as clean before navigation
      clearDraft();
      await onSave(jobData);
    } catch (error) {
      console.error('Failed to save job:', error);
      alert('Failed to save job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-fill address fields when a client is selected
  const handleClientChange = (clientId: string) => {
    handleChange('client', clientId);

    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          client: clientId,
          address: selectedClient.fields.Address || prev.address,
          addressLine2: selectedClient.fields['Address Line 2'] || prev.addressLine2,
          city: selectedClient.fields.City || prev.city,
          state: selectedClient.fields.State || prev.state,
          zipCode: selectedClient.fields['Zip Code'] || prev.zipCode,
          bedrooms: selectedClient.fields.Bedrooms || prev.bedrooms,
          bathrooms: selectedClient.fields.Bathrooms || prev.bathrooms,
          clientHourlyRate: selectedClient.fields['Charge Per Cleaning']
            ? (selectedClient.fields['Charge Per Cleaning'] / (prev.durationHours || 2))
            : prev.clientHourlyRate,
        }));
      }
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Draft Indicator - shows when a draft is available */}
      {isNewJob && (
        <DraftIndicator
          entityType="job"
          hasDraft={hasDraft}
          onRestore={handleRestoreDraft}
          onDelete={handleDeleteDraft}
        />
      )}

      {/* Client Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Client</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client *
          </label>
          <select
            required
            value={formData.client}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.fields.Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cleaner Assignment Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Cleaner Assignment</h3>
          {formData.selectedCleaners.length > 0 && (
            <span className="text-sm text-gray-600">
              {formData.selectedCleaners.length} cleaner{formData.selectedCleaners.length !== 1 ? 's' : ''} |
              Combined rate: ${combinedHourlyRate.toFixed(2)}/hr
            </span>
          )}
        </div>

        {/* Assignment Type Toggle */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="assignmentType"
              checked={assignmentType === 'individual'}
              onChange={() => {
                setAssignmentType('individual');
                handleChange('selectedTeam', '');
              }}
              className="text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Individual Cleaners</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="assignmentType"
              checked={assignmentType === 'team'}
              onChange={() => setAssignmentType('team')}
              className="text-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Use Team Template</span>
          </label>
        </div>

        {/* Team Selection */}
        {assignmentType === 'team' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team
            </label>
            <select
              value={formData.selectedTeam}
              onChange={(e) => handleTeamSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.fields['Team Name']} ({team.fields['Member Count'] || 0} members)
                </option>
              ))}
            </select>
            {formData.selectedTeam && (
              <p className="text-sm text-gray-500 mt-2">
                Team members will be auto-selected below. You can modify the selection for this job.
              </p>
            )}
          </div>
        )}

        {/* Cleaner Multi-Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {assignmentType === 'team' ? 'Team Members (editable for this job)' : 'Select Cleaners'}
          </label>
          {cleaners.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No active cleaners found.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {cleaners.map(cleaner => (
                <label
                  key={cleaner.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    formData.selectedCleaners.includes(cleaner.id)
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.selectedCleaners.includes(cleaner.id)}
                      onChange={(e) => toggleCleaner(cleaner.id, e.target.checked)}
                      className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{cleaner.fields.Name}</div>
                      <div className="text-sm text-gray-500">
                        {cleaner.fields['Experience Level'] || 'Junior'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${cleaner.fields['Hourly Rate'] || 0}/hr
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Payout Preview for Multi-Cleaner */}
        {formData.selectedCleaners.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users2 className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Team Job Payout Preview</span>
            </div>
            <div className="text-sm text-blue-800">
              <p>Each cleaner receives their <strong>full hourly rate</strong> for this job.</p>
              <p className="mt-1">
                Total team payout: ${combinedHourlyRate.toFixed(2)}/hr × {formData.durationHours} hrs =
                <strong> ${(combinedHourlyRate * formData.durationHours).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Date & Time Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Schedule</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Service Details Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Service Details</h3>

        <div className="grid grid-cols-2 gap-4">
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
              <option value="Move-In-Out">Move-In/Out</option>
            </select>
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
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(address) => handleChange('address', address)}
              onAddressSelect={(components) => {
                if (components.city) handleChange('city', components.city);
                if (components.state) handleChange('state', components.state);
                if (components.zipCode) handleChange('zipCode', components.zipCode);
              }}
              placeholder="Start typing address..."
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
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="CA"
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zip Code
            </label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              placeholder="90210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <input
              type="number"
              min="0"
              value={formData.bedrooms}
              onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Pricing</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (Hours)
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={formData.durationHours}
              onChange={(e) => handleChange('durationHours', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Hourly Rate
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.clientHourlyRate}
              onChange={(e) => handleChange('clientHourlyRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Charged
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amountCharged}
              onChange={(e) => handleChange('amountCharged', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Recurring Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Recurring Settings</h3>

        <div>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => handleChange('isRecurring', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Recurring Job</span>
          </label>

          {formData.isRecurring && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.recurrenceFrequency || ''}
                  onChange={(e) => handleChange('recurrenceFrequency', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select frequency...</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {/* Day of Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.recurringDay === day
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {formData.recurringDay && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {formData.recurringDay}
                  </p>
                )}
              </div>

              {/* Schedule Summary */}
              {formData.recurrenceFrequency && formData.recurringDay && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Schedule: </span>
                    {formData.recurrenceFrequency} on {formData.recurringDay}s
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Notes</h3>

        <div>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any special requests, access instructions, or notes..."
            rows={4}
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
          {loading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}
