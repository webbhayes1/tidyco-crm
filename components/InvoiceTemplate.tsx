'use client';

import { format } from 'date-fns';
import type { Invoice, Client } from '@/types/airtable';

interface InvoiceTemplateProps {
  invoice: Invoice;
  client?: Client;
}

export function InvoiceTemplate({ invoice, client }: InvoiceTemplateProps) {
  const amount = (invoice.fields.Hours || 0) * (invoice.fields.Rate || 0);
  const clientName = client?.fields.Name || invoice.fields['Client Name'] || 'N/A';
  const clientEmail = client?.fields.Email || invoice.fields['Client Email'] || '';
  const clientAddress = client?.fields.Address || invoice.fields['Client Address'] || '';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-tidyco-navy">TidyCo Cleaning Services</h1>
            <p className="text-gray-500 text-sm mt-1">Manhattan Beach, CA</p>
            <p className="text-gray-500 text-sm">hello@tidyco.com</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">INVOICE</p>
            <p className="text-lg font-semibold text-tidyco-blue mt-1">
              {invoice.fields['Invoice Number']}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details & Bill To */}
      <div className="grid grid-cols-2 gap-6 p-6 border-b border-gray-200">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Bill To
          </h3>
          <p className="font-semibold text-gray-900">{clientName}</p>
          {clientAddress && <p className="text-gray-600 text-sm">{clientAddress}</p>}
          {clientEmail && <p className="text-gray-600 text-sm">{clientEmail}</p>}
        </div>
        <div className="text-right">
          <div className="space-y-2">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Invoice Date
              </span>
              <p className="text-gray-900">
                {invoice.fields['Service Date']
                  ? format(new Date(invoice.fields['Service Date']), 'MMMM d, yyyy')
                  : 'N/A'}
              </p>
            </div>
            {invoice.fields['Due Date'] && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Due Date
                </span>
                <p className="text-gray-900">
                  {format(new Date(invoice.fields['Due Date']), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Service Details
        </h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-sm font-semibold text-gray-600">Description</th>
              <th className="text-center py-2 text-sm font-semibold text-gray-600">Hours</th>
              <th className="text-center py-2 text-sm font-semibold text-gray-600">Rate</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3">
                <p className="font-medium text-gray-900">{invoice.fields['Service Type']}</p>
                <p className="text-sm text-gray-500">
                  {invoice.fields['Service Date']
                    ? format(new Date(invoice.fields['Service Date']), 'MMM d, yyyy')
                    : ''}
                </p>
              </td>
              <td className="text-center py-3 text-gray-900">
                {invoice.fields.Hours?.toFixed(1)}
              </td>
              <td className="text-center py-3 text-gray-900">
                ${invoice.fields.Rate?.toFixed(2)}
              </td>
              <td className="text-right py-3 font-semibold text-gray-900">
                ${amount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-tidyco-blue">${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Payment Info */}
      <div className="p-6 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Payment Status
            </p>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                invoice.fields.Status === 'Paid'
                  ? 'bg-green-100 text-green-800'
                  : invoice.fields.Status === 'Voided'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {invoice.fields.Status}
            </span>
          </div>
          {invoice.fields.Status === 'Pending' && (
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Payment Methods
              </p>
              <p className="text-sm text-gray-600">Zelle: payments@tidyco.com</p>
              <p className="text-sm text-gray-600">Cash or Check</p>
            </div>
          )}
        </div>

        {invoice.fields.Notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Notes
            </p>
            <p className="text-sm text-gray-600">{invoice.fields.Notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
