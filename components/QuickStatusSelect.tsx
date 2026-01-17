'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2, RotateCcw, AlertCircle, X } from 'lucide-react';

type StatusType = 'job' | 'client' | 'cleaner' | 'lead';

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
  lead: [
    { value: 'New', label: 'New', color: 'text-blue-800', bgColor: 'bg-blue-100', hoverColor: 'hover:bg-blue-200' },
    { value: 'Contacted', label: 'Contacted', color: 'text-yellow-800', bgColor: 'bg-yellow-100', hoverColor: 'hover:bg-yellow-200' },
    { value: 'Qualified', label: 'Qualified', color: 'text-purple-800', bgColor: 'bg-purple-100', hoverColor: 'hover:bg-purple-200' },
    { value: 'Quote Sent', label: 'Quote Sent', color: 'text-indigo-800', bgColor: 'bg-indigo-100', hoverColor: 'hover:bg-indigo-200' },
    { value: 'Won', label: 'Won', color: 'text-green-800', bgColor: 'bg-green-100', hoverColor: 'hover:bg-green-200' },
    { value: 'Lost', label: 'Lost', color: 'text-red-800', bgColor: 'bg-red-100', hoverColor: 'hover:bg-red-200' },
    { value: 'Churned', label: 'Churned', color: 'text-gray-800', bgColor: 'bg-gray-100', hoverColor: 'hover:bg-gray-200' },
  ],
};

interface QuickStatusSelectProps {
  recordId: string;
  currentStatus: string;
  statusType: StatusType;
  apiEndpoint: string; // e.g., '/api/jobs', '/api/clients', '/api/cleaners'
  onSuccess?: () => void;
  // Lead-specific props for refund action
  leadFee?: number;
  isRefundRequested?: boolean;
  isRefunded?: boolean;
}

export function QuickStatusSelect({
  recordId,
  currentStatus,
  statusType,
  apiEndpoint,
  onSuccess,
  leadFee,
  isRefundRequested,
  isRefunded,
}: QuickStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [showNoteModal, setShowNoteModal] = useState<'request' | 'refund' | null>(null);
  const [noteText, setNoteText] = useState('');
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

  // Show refund options for leads with a fee
  const hasLeadFee = statusType === 'lead' && leadFee && leadFee > 0;
  const showRequestRefundOption = hasLeadFee && !isRefundRequested && !isRefunded;
  const showMarkRefundedOption = hasLeadFee && !isRefunded;

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
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestRefund = () => {
    setIsOpen(false);
    setNoteText('');
    setShowNoteModal('request');
  };

  const handleMarkRefunded = () => {
    setIsOpen(false);
    setNoteText('');
    setShowNoteModal('refund');
  };

  const submitRefundAction = async () => {
    if (!noteText.trim()) {
      alert('Please enter a reason for the refund.');
      return;
    }

    setIsUpdating(true);

    try {
      const payload = showNoteModal === 'request'
        ? {
            'Refund Requested': true,
            'Refund Request Date': new Date().toISOString().split('T')[0],
            'Refund Request Note': noteText.trim(),
          }
        : {
            Refunded: true,
            'Refund Date': new Date().toISOString().split('T')[0],
            'Refund Note': noteText.trim(),
          };

      const response = await fetch(`${apiEndpoint}/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update refund status');
      }

      setShowNoteModal(null);
      setNoteText('');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update refund status:', error);
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
        <div className="absolute left-0 z-50 mt-1 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5" style={{ minWidth: '160px' }}>
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
            {/* Refund options for leads with a fee */}
            {(showRequestRefundOption || showMarkRefundedOption) && (
              <>
                <div className="border-t border-gray-100 my-1" />
                {showRequestRefundOption && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRequestRefund();
                    }}
                    className="block w-full text-left px-3 py-2 text-sm whitespace-nowrap text-orange-700 hover:bg-orange-50"
                    style={{ display: 'block' }}
                  >
                    <AlertCircle className="inline-block w-3 h-3 mr-2" />
                    Request Refund
                  </button>
                )}
                {showMarkRefundedOption && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMarkRefunded();
                    }}
                    className="block w-full text-left px-3 py-2 text-sm whitespace-nowrap text-emerald-700 hover:bg-emerald-50"
                    style={{ display: 'block' }}
                  >
                    <RotateCcw className="inline-block w-3 h-3 mr-2" />
                    Mark Refunded
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Note Modal for Refund Actions */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showNoteModal === 'request' ? 'Request Refund' : 'Mark as Refunded'}
              </h3>
              <button
                onClick={() => {
                  setShowNoteModal(null);
                  setNoteText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {showNoteModal === 'request'
                ? 'Please provide a reason for requesting this refund.'
                : 'Please provide details about this refund.'}
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={showNoteModal === 'request' ? 'e.g., Lead was invalid, wrong contact info...' : 'e.g., Refund approved by Angi on 1/15...'}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNoteModal(null);
                  setNoteText('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitRefundAction}
                disabled={isUpdating || !noteText.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  showNoteModal === 'request'
                    ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showNoteModal === 'request' ? (
                  'Request Refund'
                ) : (
                  'Mark Refunded'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
