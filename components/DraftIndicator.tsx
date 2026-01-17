'use client';

import { FileText, RotateCcw, Trash2 } from 'lucide-react';

interface DraftIndicatorProps {
  entityType: string; // e.g., "client", "job", "lead"
  hasDraft: boolean;
  onRestore: () => void;
  onDelete: () => void;
}

export function DraftIndicator({
  entityType,
  hasDraft,
  onRestore,
  onDelete,
}: DraftIndicatorProps) {
  if (!hasDraft) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Draft available
            </p>
            <p className="text-xs text-amber-600">
              You have a saved draft for this {entityType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRestore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restore
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
