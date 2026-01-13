'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Lead } from '@/types/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  Briefcase,
  Trash2,
  MessageSquare,
  PhoneCall
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    async function fetchLead() {
      try {
        const response = await fetch(`/api/leads/${params.id}`);
        if (!response.ok) throw new Error('Lead not found');
        const data = await response.json();
        setLead(data);
      } catch (error) {
        console.error('Failed to fetch lead:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [params.id]);

  const updateLead = async (fields: Partial<Lead['fields']>) => {
    if (!lead) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (response.ok) {
        const updated = await response.json();
        setLead(updated);
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const logContact = async () => {
    const currentCount = lead?.fields['Times Contacted'] || 0;
    await updateLead({
      'Times Contacted': currentCount + 1,
      'Last Contact Date': new Date().toISOString().split('T')[0],
    });
  };

  const handleDelete = async () => {
    if (!lead) return;
    if (!confirm(`Are you sure you want to delete this lead (${lead.fields.Name})?`)) return;

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/leads');
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!lead) {
    return <div className="text-center py-12">Lead not found</div>;
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'Angi': return 'bg-blue-100 text-blue-800';
      case 'Referral': return 'bg-green-100 text-green-800';
      case 'Google': return 'bg-red-100 text-red-800';
      case 'Facebook': return 'bg-purple-100 text-purple-800';
      case 'Thumbtack': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={lead.fields.Name}
          description={`Lead from ${lead.fields['Lead Source'] || 'Unknown source'}`}
          actions={
            <div className="flex gap-2">
              <Link
                href={`/leads/${lead.id}/edit`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
            </div>
          }
        />
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2">
        <StatusBadge status={lead.fields.Status || 'New'} />
        {lead.fields['Lead Source'] && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeColor(lead.fields['Lead Source'])}`}>
            {lead.fields['Lead Source']}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <dl className="space-y-3">
                {lead.fields.Phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`tel:${lead.fields.Phone}`} className="text-primary-600 hover:text-primary-500">
                          {lead.fields.Phone}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
                {lead.fields.Email && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={`mailto:${lead.fields.Email}`} className="text-primary-600 hover:text-primary-500">
                          {lead.fields.Email}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
                {(lead.fields.Address || lead.fields.City || lead.fields['Zip Code']) && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {lead.fields.Address}
                        {lead.fields.City && `, ${lead.fields.City}`}
                        {lead.fields.State && `, ${lead.fields.State}`}
                        {lead.fields['Zip Code'] && ` ${lead.fields['Zip Code']}`}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Service Interest */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Interest</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.fields['Service Type Interested'] || 'Not specified'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.fields.Bedrooms ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.fields.Bathrooms ?? '-'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Times Contacted</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {lead.fields['Times Contacted'] || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Contact</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.fields['Last Contact Date']
                      ? format(new Date(lead.fields['Last Contact Date']), 'MMM d, yyyy')
                      : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Score</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {lead.fields['Lead Score'] ?? '-'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={logContact}
                  disabled={updating}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Log Call
                </button>
                <button
                  onClick={logContact}
                  disabled={updating}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Log Text
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.fields.Notes && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{lead.fields.Notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Convert to Client
                </button>
                <Link
                  href={`/jobs/new?leadId=${lead.id}&name=${encodeURIComponent(lead.fields.Name)}&phone=${encodeURIComponent(lead.fields.Phone || '')}&address=${encodeURIComponent(lead.fields.Address || '')}`}
                  className="w-full inline-flex items-center justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Create Job
                </Link>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Update Status</h3>
              <div className="space-y-2">
                {(['New', 'Contacted', 'Qualified', 'Quote Sent', 'Won', 'Lost'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateLead({ Status: status })}
                    disabled={updating || lead.fields.Status === status}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      lead.fields.Status === status
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-Up */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                Next Follow-Up
              </h3>
              {lead.fields['Next Follow-Up Date'] ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(new Date(lead.fields['Next Follow-Up Date']), 'EEEE, MMM d')}
                  </p>
                  <button
                    onClick={() => updateLead({ 'Next Follow-Up Date': undefined })}
                    className="mt-2 text-sm text-red-600 hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">No follow-up scheduled</p>
                  <div className="flex flex-wrap gap-2">
                    {[1, 3, 7].map((days) => (
                      <button
                        key={days}
                        onClick={() => {
                          const date = new Date();
                          date.setDate(date.getDate() + days);
                          updateLead({ 'Next Follow-Up Date': date.toISOString().split('T')[0] });
                        }}
                        disabled={updating}
                        className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        +{days}d
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.fields.Owner || '-'}</dd>
                </div>
                {lead.fields['Angi Lead ID'] && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Angi Lead ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.fields['Angi Lead ID']}</dd>
                  </div>
                )}
                {lead.fields['Created Date'] && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(lead.fields['Created Date']), 'MMM d, yyyy')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Lost Reason (if Lost) */}
          {lead.fields.Status === 'Lost' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Lost Reason</h3>
                <select
                  value={lead.fields['Lost Reason'] || ''}
                  onChange={(e) => updateLead({ 'Lost Reason': e.target.value as Lead['fields']['Lost Reason'] })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="">Select reason...</option>
                  <option value="Price too high">Price too high</option>
                  <option value="Chose competitor">Chose competitor</option>
                  <option value="No response">No response</option>
                  <option value="Not ready">Not ready</option>
                  <option value="Outside service area">Outside service area</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Convert to Client Modal */}
      {showConvertModal && (
        <ConvertToClientModal
          lead={lead}
          onClose={() => setShowConvertModal(false)}
          onConverted={(clientId) => {
            router.push(`/clients/${clientId}`);
          }}
        />
      )}
    </div>
  );
}

// Convert to Client Modal
function ConvertToClientModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: Lead;
  onClose: () => void;
  onConverted: (clientId: string) => void;
}) {
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setConverting(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Conversion failed');
      }

      const result = await response.json();
      onConverted(result.clientId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Convert Lead to Client</h2>
          <p className="text-gray-600 mb-4">
            This will create a new client record for <strong>{lead.fields.Name}</strong> with all their information and mark this lead as Won.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Client details:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Name: {lead.fields.Name}</li>
              <li>Phone: {lead.fields.Phone || 'Not provided'}</li>
              <li>Email: {lead.fields.Email || 'Not provided'}</li>
              <li>Address: {lead.fields.Address || 'Not provided'}</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              disabled={converting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50"
            >
              {converting ? 'Converting...' : 'Convert to Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
