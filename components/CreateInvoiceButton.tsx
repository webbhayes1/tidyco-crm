'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, X } from 'lucide-react';
import { InvoiceForm } from './InvoiceForm';
import type { Invoice } from '@/types/airtable';

interface CreateInvoiceButtonProps {
  jobId: string;
  clientId?: string;
  serviceDate: string;
  serviceType: 'General Clean' | 'Deep Clean' | 'Move-In-Out';
  hours: number;
  rate: number;
  hasInvoice?: boolean;
}

export function CreateInvoiceButton({
  jobId,
  clientId,
  serviceDate,
  serviceType,
  hours,
  rate,
  hasInvoice,
}: CreateInvoiceButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async (data: Partial<Invoice['fields']>) => {
    // Include job link in the invoice
    const invoiceData = {
      ...data,
      Job: [jobId],
    };

    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error('Failed to create invoice');
    }

    setIsOpen(false);
    router.refresh();
  };

  // If job already has an invoice, show a different state
  if (hasInvoice) {
    return (
      <button
        disabled
        className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
        title="Invoice already created for this job"
      >
        <FileText className="mr-2 h-4 w-4" />
        Invoice Created
      </button>
    );
  }

  // Pre-populate initial data from job
  const initialData: Partial<Invoice['fields']> = {
    Client: clientId ? [clientId] : undefined,
    'Service Date': serviceDate,
    'Service Type': serviceType,
    Hours: hours,
    Rate: rate,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
      >
        <FileText className="mr-2 h-4 w-4" />
        Create Invoice
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-gray-50 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Create Invoice from Job
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6">
                <InvoiceForm
                  initialData={initialData}
                  onSave={handleSave}
                  onCancel={() => setIsOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
