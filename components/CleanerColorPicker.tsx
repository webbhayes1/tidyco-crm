'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CLEANER_COLOR_PALETTE = [
  { name: 'Blue', hex: '#4285F4' },
  { name: 'Green', hex: '#0B8043' },
  { name: 'Yellow', hex: '#F6BF26' },
  { name: 'Red', hex: '#E67C73' },
  { name: 'Purple', hex: '#9E69AF' },
  { name: 'Teal', hex: '#039BE5' },
  { name: 'Orange', hex: '#F4511E' },
  { name: 'Pink', hex: '#D81B60' },
  { name: 'Cyan', hex: '#33B679' },
  { name: 'Indigo', hex: '#7986CB' },
  { name: 'Brown', hex: '#8D6E63' },
  { name: 'Gray', hex: '#616161' },
];

const DEFAULT_CLEANER_COLOR = '#6B7280';

interface CleanerColorPickerProps {
  cleanerId: string;
  currentColor: string | undefined;
}

export function CleanerColorPicker({ cleanerId, currentColor }: CleanerColorPickerProps) {
  const router = useRouter();
  const [color, setColor] = useState(currentColor || DEFAULT_CLEANER_COLOR);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    setIsOpen(false);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/cleaners/${cleanerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Color: newColor }),
      });

      if (!response.ok) {
        throw new Error('Failed to update color');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating cleaner color:', error);
      setColor(currentColor || DEFAULT_CLEANER_COLOR);
      alert('Failed to update color. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className="w-6 h-6 rounded-md shadow-sm cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 hover:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: color }}
          title="Change color"
        />
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3 grid grid-cols-4 gap-3 w-[172px]">
              {CLEANER_COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleColorChange(c.hex)}
                  className={`w-7 h-7 rounded cursor-pointer transition-transform hover:scale-110 ${
                    color === c.hex ? 'ring-2 ring-gray-900 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {isUpdating && (
        <span className="text-xs text-gray-500">Saving...</span>
      )}
    </div>
  );
}
