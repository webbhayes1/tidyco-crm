'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Team, Cleaner } from '@/types/airtable';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface TeamFormProps {
  team?: Team;
  onSave: (data: Partial<Team['fields']>) => Promise<void>;
  onCancel: () => void;
}

export function TeamForm({ team, onSave, onCancel }: TeamFormProps) {
  const [loading, setLoading] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loadingCleaners, setLoadingCleaners] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    teamName: team?.fields['Team Name'] || '',
    members: team?.fields.Members || [],
    teamLead: team?.fields['Team Lead']?.[0] || '',
    status: team?.fields.Status || 'Active',
    notes: team?.fields.Notes || '',
  });

  // Capture initial data for unsaved changes detection
  const initialData = useMemo(() => ({
    teamName: team?.fields['Team Name'] || '',
    members: team?.fields.Members || [],
    teamLead: team?.fields['Team Lead']?.[0] || '',
    status: team?.fields.Status || 'Active',
    notes: team?.fields.Notes || '',
  }), [team?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if this is a new team
  const isNewTeam = !team;

  // Unsaved changes detection - for both new and existing teams
  const { markClean } = useUnsavedChanges({
    formId: `team-${team?.id || 'new'}`,
    formData,
    initialData,
    enabled: true, // Always enabled
    formType: isNewTeam ? 'draft' : 'edit',
    entityType: 'team',
  });

  // Fetch active cleaners for selection
  useEffect(() => {
    async function fetchCleaners() {
      try {
        const response = await fetch('/api/cleaners');
        const data = await response.json();
        // Filter to only active cleaners
        const activeCleaners = data.filter((c: Cleaner) => c.fields.Status === 'Active');
        setCleaners(activeCleaners);
      } catch (error) {
        console.error('Failed to fetch cleaners:', error);
      } finally {
        setLoadingCleaners(false);
      }
    }

    fetchCleaners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const teamData: Partial<Team['fields']> = {
        'Team Name': formData.teamName,
        Members: formData.members,
        'Team Lead': formData.teamLead ? [formData.teamLead] : undefined,
        Status: formData.status as 'Active' | 'Inactive',
        Notes: formData.notes || undefined,
      };

      markClean(); // Mark form as clean before navigation
      await onSave(teamData);
    } catch (error) {
      console.error('Failed to save team:', error);
      alert('Failed to save team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMember = (cleanerId: string, checked: boolean) => {
    let newMembers: string[];
    if (checked) {
      newMembers = [...formData.members, cleanerId];
    } else {
      newMembers = formData.members.filter(id => id !== cleanerId);
      // If removing the team lead, clear team lead selection
      if (formData.teamLead === cleanerId) {
        setFormData(prev => ({ ...prev, teamLead: '' }));
      }
    }
    handleChange('members', newMembers);
  };

  // Calculate combined hourly rate
  const combinedHourlyRate = formData.members.reduce((sum, memberId) => {
    const cleaner = cleaners.find(c => c.id === memberId);
    return sum + (cleaner?.fields['Hourly Rate'] || 0);
  }, 0);

  // Get selected members for team lead dropdown
  const selectedCleaners = cleaners.filter(c => formData.members.includes(c.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Team Name Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Team Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.teamName}
              onChange={(e) => handleChange('teamName', e.target.value)}
              placeholder="e.g., Sarah & Maria, Deep Clean Crew"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Team Members</h3>
          {formData.members.length > 0 && (
            <span className="text-sm text-gray-600">
              {formData.members.length} selected | Combined rate: ${combinedHourlyRate.toFixed(2)}/hr
            </span>
          )}
        </div>

        {loadingCleaners ? (
          <div className="text-center py-4 text-gray-500">Loading cleaners...</div>
        ) : cleaners.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No active cleaners found. Add cleaners first.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {cleaners.map(cleaner => (
              <label
                key={cleaner.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  formData.members.includes(cleaner.id)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.members.includes(cleaner.id)}
                    onChange={(e) => toggleMember(cleaner.id, e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{cleaner.fields.Name}</div>
                    <div className="text-sm text-gray-500">{cleaner.fields.Phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${cleaner.fields['Hourly Rate'] || 0}/hr
                  </div>
                  <div className="text-xs text-gray-500">
                    {cleaner.fields['Experience Level'] || 'Junior'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {formData.members.length < 2 && (
          <p className="text-sm text-amber-600">
            Select at least 2 cleaners to form a team.
          </p>
        )}
      </div>

      {/* Team Lead Section */}
      {formData.members.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-semibold text-lg">Team Lead (Optional)</h3>
          <p className="text-sm text-gray-600">
            Designate a team lead for larger jobs or commercial clients.
          </p>

          <select
            value={formData.teamLead}
            onChange={(e) => handleChange('teamLead', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">No team lead assigned</option>
            {selectedCleaners.map(cleaner => (
              <option key={cleaner.id} value={cleaner.id}>
                {cleaner.fields.Name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Notes</h3>

        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any notes about this team (e.g., works well together, specializes in deep cleans)..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
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
          disabled={loading || formData.members.length < 2}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </form>
  );
}
