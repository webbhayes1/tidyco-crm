'use client';

import { FileText } from 'lucide-react';

interface DraftSaveModalProps {
  isOpen: boolean;
  entityType: string;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onStay: () => void;
}

export function DraftSaveModal({
  isOpen,
  entityType,
  onSaveDraft,
  onDiscard,
  onStay,
}: DraftSaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onStay} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Save as draft?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              You have unsaved changes to this {entityType}. Would you like to save them as a draft to continue later?
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
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
          >
            Discard
          </button>
          <button
            onClick={onSaveDraft}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}
