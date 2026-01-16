'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

type StatusType = 'job' | 'client' | 'cleaner';

interface StatusOption {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  hoverColor: string;
}

const STATUS_OPTIONS: Record<StatusType, StatusOption[]> = {
  job: [
    { value: 'Pending', label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100', hoverColor: 'hover:bg-yellow-200' },
    { value: 'Scheduled', label: 'Scheduled', color: 'text-blue-800', bgColor: 'bg-blue-100', hoverColor: 'hover:bg-blue-200' },
    { value: 'In Progress', label: 'In Progress', color: 'text-purple-800', bgColor: 'bg-purple-100', hoverColor: 'hover:bg-purple-200' },
    { value: 'Completed', label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-100', hoverColor: 'hover:bg-green-200' },
    { value: 'Cancelled', label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-100', hoverColor: 'hover:bg-red-200' },
  ],
  client: [
    { value: 'Active', label: 'Active', color: 'text-green-800', bgColor: 'bg-green-100', hoverColor: 'hover:bg-green-200' },
    { value: 'Inactive', label: 'Inactive', color: 'text-orange-800', bgColor: 'bg-orange-100', hoverColor: 'hover:bg-orange-200' },
    { value: 'Churned', label: 'Churned', color: 'text-red-800', bgColor: 'bg-red-100', hoverColor: 'hover:bg-red-200' },
  ],
  cleaner: [
    { value: 'Active', label: 'Active', color: 'text-green-800', bgColor: 'bg-green-100', hoverColor: 'hover:bg-green-200' },
    { value: 'Inactive', label: 'Inactive', color: 'text-orange-800', bgColor: 'bg-orange-100', hoverColor: 'hover:bg-orange-200' },
    { value: 'On Leave', label: 'On Leave', color: 'text-blue-800', bgColor: 'bg-blue-100', hoverColor: 'hover:bg-blue-200' },
  ],
};

interface QuickStatusSelectProps {
  recordId: string;
  currentStatus: string;
  statusType: StatusType;
  apiEndpoint: string; // e.g., '/api/jobs', '/api/clients', '/api/cleaners'
  onSuccess?: () => void;
}

export function QuickStatusSelect({
  recordId,
  currentStatus,
  statusType,
  apiEndpoint,
  onSuccess,
}: QuickStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = STATUS_OPTIONS[statusType];
  const currentOption = options.find(opt => opt.value === status) || options[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsOpen(false);

    try {
      const response = await fetch(`${apiEndpoint}/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update status:', error);
      // Could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()} // Prevent row click navigation
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUpdating) setIsOpen(!isOpen);
        }}
        disabled={isUpdating}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${currentOption.bgColor} ${currentOption.color} ${currentOption.hoverColor} transition-colors cursor-pointer`}
      >
        {isUpdating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            {currentOption.label}
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5" style={{ minWidth: '140px' }}>
          <div className="flex flex-col py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(option.value);
                }}
                className={`block w-full text-left px-3 py-2 text-sm whitespace-nowrap ${
                  option.value === status
                    ? `${option.bgColor} ${option.color} font-medium`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={{ display: 'block' }}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${option.bgColor.replace('100', '500')}`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
