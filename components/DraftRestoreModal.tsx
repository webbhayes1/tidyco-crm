'use client';

import { AlertCircle } from 'lucide-react';

interface DraftRestoreModalProps {
  isOpen: boolean;
  entityType: string; // e.g., "client", "job", "lead"
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestoreModal({
  isOpen,
  entityType,
  onRestore,
  onDiscard,
}: DraftRestoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Restore unsaved changes?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              You have an unsaved draft for this {entityType}. Would you like to restore your previous changes or start fresh?
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Start Fresh
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Restore Draft
          </button>
        </div>
      </div>
    </div>
  );
}
