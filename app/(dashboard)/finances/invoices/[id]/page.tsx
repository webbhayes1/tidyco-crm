'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import type { Invoice, Client } from '@/types/airtable';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const invoiceRes = await fetch(`/api/invoices/${params.id}`);
        if (!invoiceRes.ok) throw new Error('Invoice not found');
        const invoiceData = await invoiceRes.json();
        setInvoice(invoiceData);

        // Fetch client details
        if (invoiceData.fields.Client?.[0]) {
          const clientRes = await fetch(`/api/clients/${invoiceData.fields.Client[0]}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClient(clientData);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  const updateInvoice = async (fields: Partial<Invoice['fields']>) => {
    if (!invoice) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (response.ok) {
        const updated = await response.json();
        setInvoice(updated);
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/finances/invoices');
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const handleDownloadPDF = () => {
    // For now, open in new tab - PDF generation to be implemented
    alert('PDF download will be available after installing @react-pdf/renderer');
  };

  const handleSendEmail = () => {
    // For now, show alert - Email sending to be implemented
    alert('Email sending will be available after configuring Resend');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/finances/invoices" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader title="Error" description="" />
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <p className="text-red-700">{error || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  const amount = (invoice.fields.Hours || 0) * (invoice.fields.Rate || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finances/invoices" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader
            title={invoice.fields['Invoice Number']}
            description={`$${amount.toFixed(2)} - ${invoice.fields.Status}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={handleSendEmail}
            className="flex items-center gap-2 px-4 py-2 bg-tidyco-blue text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            Send Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Preview */}
        <div className="lg:col-span-2">
          <InvoiceTemplate invoice={invoice} client={client || undefined} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/finances/invoices/${invoice.id}/edit`}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Edit className="h-4 w-4" />
                Edit Invoice
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 className="h-4 w-4" />
                Delete Invoice
              </button>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateInvoice({ Status: 'Pending' })}
                disabled={updating || invoice.fields.Status === 'Pending'}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                  invoice.fields.Status === 'Pending'
                    ? 'bg-yellow-100 text-yellow-800 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Clock className="h-4 w-4" />
                Pending
              </button>
              <button
                onClick={() => updateInvoice({ Status: 'Paid', 'Payment Date': new Date().toISOString().split('T')[0] })}
                disabled={updating || invoice.fields.Status === 'Paid'}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                  invoice.fields.Status === 'Paid'
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Paid
              </button>
              <button
                onClick={() => updateInvoice({ Status: 'Voided' })}
                disabled={updating || invoice.fields.Status === 'Voided'}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md ${
                  invoice.fields.Status === 'Voided'
                    ? 'bg-red-100 text-red-800 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <XCircle className="h-4 w-4" />
                Voided
              </button>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Invoice #</dt>
                <dd className="font-medium text-gray-900">{invoice.fields['Invoice Number']}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Service Date</dt>
                <dd className="text-gray-900">
                  {invoice.fields['Service Date']
                    ? format(new Date(invoice.fields['Service Date']), 'MMM d, yyyy')
                    : 'N/A'}
                </dd>
              </div>
              {invoice.fields['Due Date'] && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Due Date</dt>
                  <dd className="text-gray-900">
                    {format(new Date(invoice.fields['Due Date']), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              {invoice.fields['Payment Date'] && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Paid On</dt>
                  <dd className="text-gray-900">
                    {format(new Date(invoice.fields['Payment Date']), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              {invoice.fields['Sent Date'] && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sent On</dt>
                  <dd className="text-gray-900">
                    {format(new Date(invoice.fields['Sent Date']), 'MMM d, yyyy')}
                  </dd>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Amount</dt>
                  <dd className="text-lg font-bold text-tidyco-blue">${amount.toFixed(2)}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Client Link */}
          {client && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Client</h3>
              <Link
                href={`/clients/${client.id}`}
                className="block hover:bg-gray-50 -m-2 p-2 rounded-lg"
              >
                <p className="font-medium text-gray-900">{client.fields.Name}</p>
                {client.fields.Email && (
                  <p className="text-sm text-gray-500">{client.fields.Email}</p>
                )}
                {client.fields.Phone && (
                  <p className="text-sm text-gray-500">{client.fields.Phone}</p>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
