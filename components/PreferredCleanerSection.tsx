'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ChevronDown, Check } from 'lucide-react';
import type { Cleaner } from '@/types/airtable';

interface PreferredCleanerSectionProps {
  clientId: string;
  preferredCleanerId?: string;
  preferredCleanerName?: string;
  cleaners: Cleaner[];
}

export function PreferredCleanerSection({
  clientId,
  preferredCleanerId,
  preferredCleanerName,
  cleaners,
}: PreferredCleanerSectionProps) {
  const [selectedCleaner, setSelectedCleaner] = useState(preferredCleanerId || '');
  const [cleanerName, setCleanerName] = useState(preferredCleanerName || '');
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const activeCleaners = cleaners.filter(c => c.fields.Status === 'Active');

  const handleAssign = async (cleanerId: string) => {
    setSaving(true);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'Preferred Cleaner': cleanerId ? [cleanerId] : [],
        }),
      });

      if (response.ok) {
        setSelectedCleaner(cleanerId);
        const cleaner = cleaners.find(c => c.id === cleanerId);
        setCleanerName(cleaner?.fields.Name || '');
      } else {
        alert('Failed to update preferred cleaner');
      }
    } catch (error) {
      console.error('Error updating cleaner:', error);
      alert('Failed to update preferred cleaner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-purple-600" />
          Preferred Cleaner
        </h3>

        {selectedCleaner && cleanerName ? (
          <div className="space-y-3">
            {/* Current Cleaner Display */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-900">{cleanerName}</p>
                  <p className="text-sm text-purple-700">Assigned Cleaner</p>
                </div>
                <Link
                  href={`/cleaners/${selectedCleaner}`}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View
                </Link>
              </div>
            </div>

            {/* Change Cleaner Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={saving}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="text-gray-600">Change cleaner</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  <button
                    onClick={() => handleAssign('')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-500"
                  >
                    Remove cleaner
                  </button>
                  {activeCleaners.map(cleaner => (
                    <button
                      key={cleaner.id}
                      onClick={() => handleAssign(cleaner.id)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        cleaner.id === selectedCleaner ? 'bg-purple-50' : ''
                      }`}
                    >
                      <span>{cleaner.fields.Name}</span>
                      {cleaner.id === selectedCleaner && (
                        <Check className="h-4 w-4 text-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">No preferred cleaner assigned</p>

            {/* Assign Cleaner Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={saving}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <span>{saving ? 'Saving...' : 'Assign Cleaner'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {activeCleaners.length > 0 ? (
                    activeCleaners.map(cleaner => (
                      <button
                        key={cleaner.id}
                        onClick={() => handleAssign(cleaner.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">{cleaner.fields.Name}</span>
                          {cleaner.fields['Average Quality Score'] && (
                            <span className="ml-2 text-gray-500 text-xs">
                              {cleaner.fields['Average Quality Score'].toFixed(1)} rating
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No active cleaners available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
