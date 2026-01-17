'use client';

import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onStay,
  onLeave,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onStay} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              You have unsaved changes
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Your changes will be lost if you leave this page. Are you sure you want to leave?
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onStay}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Stay
          </button>
          <button
            onClick={onLeave}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Leave Without Saving
          </button>
        </div>
      </div>
    </div>
  );
}
