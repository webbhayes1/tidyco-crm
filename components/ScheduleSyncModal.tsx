'use client';

import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ScheduleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  futureJobsCount: number;
  clientName: string;
  mode?: 'sync' | 'generate';
}

export function ScheduleSyncModal({
  isOpen,
  onClose,
  onConfirm,
  futureJobsCount,
  clientName,
  mode = 'sync',
}: ScheduleSyncModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSyncing(true);
    try {
      await onConfirm();
      // Don't call onClose here - parent handles navigation
    } catch (error) {
      console.error('Failed to sync jobs:', error);
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {mode === 'generate' ? 'Generate Jobs?' : 'Update Future Jobs?'}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">
            You&apos;ve {mode === 'generate' ? 'set up' : 'changed'} the recurring schedule for <strong>{clientName}</strong>.
          </p>

          {mode === 'generate' ? (
            <p className="text-sm text-gray-600 mb-6">
              Would you like to generate jobs for the next 8 weeks based on this schedule?
            </p>
          ) : futureJobsCount > 0 ? (
            <p className="text-sm text-gray-600 mb-6">
              Would you like to update <strong>{futureJobsCount} future job{futureJobsCount !== 1 ? 's' : ''}</strong> to match the new schedule?
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-6">
              No future jobs found for this client. The new schedule will apply to jobs created going forward.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSyncing}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {mode === 'generate' ? 'No, Skip' : futureJobsCount > 0 ? 'No, Keep Existing Jobs' : 'OK'}
            </button>
            {(futureJobsCount > 0 || mode === 'generate') && (
              <button
                onClick={handleConfirm}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {mode === 'generate' ? 'Generating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'generate' ? 'Yes, Generate Jobs' : 'Yes, Update Jobs'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
