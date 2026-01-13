'use client';

import { useState } from 'react';
import type { Cleaner } from '@/types/airtable';

interface CleanerFormProps {
  cleaner?: Cleaner;
  onSave: (data: Partial<Cleaner['fields']>) => Promise<void>;
  onCancel: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type DayOfWeek = typeof DAYS_OF_WEEK[number];

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'
];

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type WeekSchedule = Record<DayOfWeek, DaySchedule>;

// Parse existing preferred hours string into schedule
function parsePreferredHours(preferredHours: string | undefined, existingDays: DayOfWeek[] | undefined): WeekSchedule {
  const defaultSchedule: WeekSchedule = {} as WeekSchedule;

  DAYS_OF_WEEK.forEach(day => {
    const isEnabled = existingDays?.includes(day) || false;
    defaultSchedule[day] = {
      enabled: isEnabled,
      startTime: '8:00 AM',
      endTime: '5:00 PM'
    };
  });

  // Try to parse existing preferred hours (format: "Mon: 8:00 AM - 5:00 PM, Tue: 9:00 AM - 3:00 PM")
  if (preferredHours) {
    const dayAbbrevs: Record<string, DayOfWeek> = {
      'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
      'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
    };

    const parts = preferredHours.split(', ');
    parts.forEach(part => {
      const match = part.match(/^(\w{3}):\s*(.+)\s*-\s*(.+)$/);
      if (match) {
        const [, abbrev, start, end] = match;
        const day = dayAbbrevs[abbrev];
        if (day && defaultSchedule[day]) {
          defaultSchedule[day].startTime = start.trim();
          defaultSchedule[day].endTime = end.trim();
        }
      }
    });
  }

  return defaultSchedule;
}

// Format phone number as (XXX) XXX-XXXX
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Convert schedule to preferred hours string
function scheduleToString(schedule: WeekSchedule): string {
  const dayAbbrevs: Record<DayOfWeek, string> = {
    'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
    'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
  };

  return DAYS_OF_WEEK
    .filter(day => schedule[day].enabled)
    .map(day => `${dayAbbrevs[day]}: ${schedule[day].startTime} - ${schedule[day].endTime}`)
    .join(', ');
}

export function CleanerForm({ cleaner, onSave, onCancel }: CleanerFormProps) {
  const [loading, setLoading] = useState(false);

  // Form state - matching actual Airtable schema
  const [formData, setFormData] = useState({
    name: cleaner?.fields.Name || '',
    email: cleaner?.fields.Email || '',
    phone: cleaner?.fields.Phone || '',
    zellePaymentInfo: cleaner?.fields['Zelle Payment Info'] || '',
    language: cleaner?.fields.Language || 'English',
    status: cleaner?.fields.Status || 'Active',
    hourlyRate: cleaner?.fields['Hourly Rate'] || 25,
    experienceLevel: cleaner?.fields['Experience Level'] || 'Junior',
    serviceAreaZipCodes: cleaner?.fields['Service Area Zip Codes'] || '',
    notes: cleaner?.fields.Notes || '',
  });

  const [schedule, setSchedule] = useState<WeekSchedule>(() =>
    parsePreferredHours(cleaner?.fields['Preferred Hours'], cleaner?.fields.Availability)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get enabled days for Availability array
      const enabledDays = DAYS_OF_WEEK.filter(day => schedule[day].enabled);

      const cleanerData: Partial<Cleaner['fields']> = {
        Name: formData.name,
        Phone: formData.phone,
        'Zelle Payment Info': formData.zellePaymentInfo,
        Language: formData.language as 'English' | 'Spanish' | 'Both',
        Status: formData.status as 'Active' | 'Inactive' | 'On Leave',
        'Hourly Rate': formData.hourlyRate,
        'Experience Level': formData.experienceLevel as 'Junior' | 'Mid-Level' | 'Senior',
        Availability: enabledDays,
        'Preferred Hours': scheduleToString(schedule),
        'Service Area Zip Codes': formData.serviceAreaZipCodes,
        Notes: formData.notes,
      };

      // Only include email if provided
      if (formData.email) {
        cleanerData.Email = formData.email;
      }

      await onSave(cleanerData);
    } catch (error) {
      console.error('Failed to save cleaner:', error);
      alert('Failed to save cleaner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: DayOfWeek) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateDayTime = (day: DayOfWeek, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  // Quick preset buttons
  const applyPreset = (preset: 'weekdays' | 'fullWeek' | 'weekends' | 'clear') => {
    const newSchedule = { ...schedule };
    DAYS_OF_WEEK.forEach(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      switch (preset) {
        case 'weekdays':
          newSchedule[day] = { ...newSchedule[day], enabled: !isWeekend };
          break;
        case 'fullWeek':
          newSchedule[day] = { ...newSchedule[day], enabled: true };
          break;
        case 'weekends':
          newSchedule[day] = { ...newSchedule[day], enabled: isWeekend };
          break;
        case 'clear':
          newSchedule[day] = { ...newSchedule[day], enabled: false };
          break;
      }
    });
    setSchedule(newSchedule);
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
            placeholder="Alice Johnson"
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
              placeholder="alice@example.com"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zelle Payment Info *
            </label>
            <input
              type="text"
              required
              value={formData.zellePaymentInfo}
              onChange={(e) => handleChange('zellePaymentInfo', e.target.value)}
              placeholder="Phone number or email for Zelle payments"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language *
            </label>
            <select
              required
              value={formData.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Employment Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level *
            </label>
            <select
              required
              value={formData.experienceLevel}
              onChange={(e) => handleChange('experienceLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hourly Rate * ($)
          </label>
          <input
            type="number"
            required
            min="15"
            max="50"
            step="0.5"
            value={formData.hourlyRate}
            onChange={(e) => handleChange('hourlyRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Typical range: $20-30/hr</p>
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Availability</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset('weekdays')}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Weekdays
            </button>
            <button
              type="button"
              onClick={() => applyPreset('fullWeek')}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Full Week
            </button>
            <button
              type="button"
              onClick={() => applyPreset('weekends')}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Weekends
            </button>
            <button
              type="button"
              onClick={() => applyPreset('clear')}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <label className="flex items-center gap-3 w-32">
                <input
                  type="checkbox"
                  checked={schedule[day].enabled}
                  onChange={() => toggleDay(day)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${schedule[day].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day}
                </span>
              </label>

              {schedule[day].enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={schedule[day].startTime}
                    onChange={(e) => updateDayTime(day, 'startTime', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <span className="text-gray-500">to</span>
                  <select
                    value={schedule[day].endTime}
                    onChange={(e) => updateDayTime(day, 'endTime', e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">Not available</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Service Areas */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Service Areas</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Area Zip Codes
          </label>
          <input
            type="text"
            value={formData.serviceAreaZipCodes}
            onChange={(e) => handleChange('serviceAreaZipCodes', e.target.value)}
            placeholder="e.g., 90266, 90254, 90277"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated zip codes</p>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-lg">Notes</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any notes about the cleaner (strengths, areas for improvement, etc.)"
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
          {loading ? 'Saving...' : cleaner ? 'Update Cleaner' : 'Create Cleaner'}
        </button>
      </div>
    </form>
  );
}