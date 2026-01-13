'use client';

import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  clientId: string;
  currentDate: string;
  onSuccess: () => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  jobId,
  clientId,
  currentDate,
  onSuccess,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState(currentDate);
  const [scope, setScope] = useState<'single' | 'all_future'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReschedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          clientId,
          currentDate,
          newDate,
          scope,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reschedule');
      }

      const result = await response.json();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  // Calculate day difference for preview
  const currentDateObj = new Date(currentDate + 'T12:00:00');
  const newDateObj = new Date(newDate + 'T12:00:00');
  const dayDiff = Math.round((newDateObj.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reschedule Job</h2>
              <p className="text-sm text-gray-500">
                Current: {format(currentDateObj, 'EEEE, MMM d, yyyy')}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* New Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {dayDiff !== 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {dayDiff > 0 ? `+${dayDiff} days later` : `${dayDiff} days earlier`}
              </p>
            )}
          </div>

          {/* Scope Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Apply to
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  value="single"
                  checked={scope === 'single'}
                  onChange={() => setScope('single')}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-gray-900">Just this job</p>
                  <p className="text-sm text-gray-500">
                    Only reschedule this one cleaning
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  value="all_future"
                  checked={scope === 'all_future'}
                  onChange={() => setScope('all_future')}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-gray-900">This and all future jobs</p>
                  <p className="text-sm text-gray-500">
                    Shift all upcoming cleanings by {dayDiff > 0 ? `+${dayDiff}` : dayDiff} days
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={loading || newDate === currentDate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}