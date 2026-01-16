'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Lead, DispositionTag, LeadActivity } from '@/types/airtable';
import { format, formatDistanceToNow } from 'date-fns';
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
  PhoneCall,
  Tag,
  Plus,
  X,
  Clock,
  FileText,
  Send,
  Users,
  CheckCircle,
  XCircle,
  DollarSign,
  RotateCcw
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<'Won' | 'Lost' | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  // Disposition Tags
  const [allTags, setAllTags] = useState<DispositionTag[]>([]);
  const [leadTags, setLeadTags] = useState<DispositionTag[]>([]);

  // Activities
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadRes, tagsRes] = await Promise.all([
          fetch(`/api/leads/${params.id}`),
          fetch('/api/leads/disposition-tags?active=true')
        ]);

        if (!leadRes.ok) throw new Error('Lead not found');
        const leadData = await leadRes.json();
        setLead(leadData);

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setAllTags(tagsData);

          // Filter tags that are assigned to this lead
          if (leadData.fields['Disposition Tags']) {
            const assignedTags = tagsData.filter((tag: DispositionTag) =>
              leadData.fields['Disposition Tags'].includes(tag.id)
            );
            setLeadTags(assignedTags);
          }
        }

        // Fetch activities for this lead
        const activitiesRes = await fetch(`/api/leads/activities?leadId=${params.id}`);
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setActivities(activitiesData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  const handleStatusChange = (status: Lead['fields']['Status']) => {
    if (status === 'Won' || status === 'Lost') {
      setShowStatusModal(status);
    } else {
      updateLead({ Status: status });
      // Log status change activity
      logActivity('Status Change', `Status changed to ${status}`);
    }
  };

  const handleStatusWithReason = async (status: 'Won' | 'Lost', reason: string) => {
    const fields: Partial<Lead['fields']> = { Status: status };
    if (status === 'Won') {
      fields['Won Reason'] = reason as Lead['fields']['Won Reason'];
    } else {
      fields['Lost Reason'] = reason as Lead['fields']['Lost Reason'];
    }
    await updateLead(fields);
    await logActivity('Status Change', `Status changed to ${status}: ${reason}`);
    setShowStatusModal(null);
  };

  const logActivity = async (type: LeadActivity['fields']['Type'], description: string) => {
    try {
      const response = await fetch('/api/leads/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Description: description,
          Type: type,
          Lead: [lead?.id],
          'Activity Date': new Date().toISOString(),
        }),
      });
      if (response.ok) {
        const newActivity = await response.json();
        setActivities(prev => [newActivity, ...prev]);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const logContact = async (type: 'Call' | 'SMS') => {
    const currentCount = lead?.fields['Times Contacted'] || 0;
    await updateLead({
      'Times Contacted': currentCount + 1,
      'Last Contact Date': new Date().toISOString().split('T')[0],
    });
    await logActivity(type, `Logged ${type.toLowerCase()}`);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await logActivity('Note', newNote);
    setNewNote('');
    setAddingNote(false);
  };

  const toggleTag = async (tag: DispositionTag) => {
    if (!lead) return;
    const currentTags = lead.fields['Disposition Tags'] || [];
    let newTags: string[];

    if (currentTags.includes(tag.id)) {
      newTags = currentTags.filter(id => id !== tag.id);
      setLeadTags(prev => prev.filter(t => t.id !== tag.id));
    } else {
      newTags = [...currentTags, tag.id];
      setLeadTags(prev => [...prev, tag]);
    }

    await updateLead({ 'Disposition Tags': newTags });
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

  const getTagColor = (color: DispositionTag['fields']['Color']) => {
    const colors = {
      'Red': 'bg-red-100 text-red-800 border-red-200',
      'Orange': 'bg-orange-100 text-orange-800 border-orange-200',
      'Yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Green': 'bg-green-100 text-green-800 border-green-200',
      'Blue': 'bg-blue-100 text-blue-800 border-blue-200',
      'Purple': 'bg-purple-100 text-purple-800 border-purple-200',
      'Pink': 'bg-pink-100 text-pink-800 border-pink-200',
      'Gray': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[color || 'Gray'];
  };

  const getActivityIcon = (type: LeadActivity['fields']['Type']) => {
    switch (type) {
      case 'Call': return <PhoneCall className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'Meeting': return <Users className="h-4 w-4" />;
      case 'Quote Sent': return <Send className="h-4 w-4" />;
      case 'Status Change': return <CheckCircle className="h-4 w-4" />;
      case 'Follow-up': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
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

      {/* Status & Tags Row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={lead.fields.Status || 'New'} />
        {lead.fields['Lead Source'] && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeColor(lead.fields['Lead Source'])}`}>
            {lead.fields['Lead Source']}
          </span>
        )}
        {leadTags.map(tag => (
          <span
            key={tag.id}
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTagColor(tag.fields.Color)}`}
          >
            <Tag className="h-3 w-3 mr-1" />
            {tag.fields.Name}
            <button
              onClick={() => toggleTag(tag)}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowTagModal(true)}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Tag
        </button>
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

          {/* Activity Timeline */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h3>

              {/* Add Note Form */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                  <button
                    onClick={addNote}
                    disabled={addingNote || !newNote.trim()}
                    className="self-end px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 text-sm font-medium"
                  >
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => logContact('Call')}
                    disabled={updating}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <PhoneCall className="mr-1.5 h-4 w-4" />
                    Log Call
                  </button>
                  <button
                    onClick={() => logContact('SMS')}
                    disabled={updating}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <MessageSquare className="mr-1.5 h-4 w-4" />
                    Log Text
                  </button>
                </div>
              </div>

              {/* Activity List */}
              <div className="flow-root">
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                ) : (
                  <ul className="-mb-8">
                    {activities.map((activity, idx) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {idx !== activities.length - 1 && (
                            <span
                              className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
                              {getActivityIcon(activity.fields.Type)}
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {activity.fields.Description}
                                </p>
                                {activity.fields['Created By'] && (
                                  <p className="text-xs text-gray-500">
                                    by {activity.fields['Created By']}
                                  </p>
                                )}
                              </div>
                              <div className="whitespace-nowrap text-right text-xs text-gray-500">
                                {activity.fields['Activity Date'] && (
                                  <time dateTime={activity.fields['Activity Date']}>
                                    {formatDistanceToNow(new Date(activity.fields['Activity Date']), { addSuffix: true })}
                                  </time>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Notes (legacy, from Notes field) */}
          {lead.fields.Notes && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes (from import)</h3>
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
                    onClick={() => handleStatusChange(status)}
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
                        onClick={async () => {
                          const date = new Date();
                          date.setDate(date.getDate() + days);
                          await updateLead({ 'Next Follow-Up Date': date.toISOString().split('T')[0] });
                          await logActivity('Follow-up', `Follow-up scheduled for ${format(date, 'MMM d')}`);
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

          {/* Contact Stats */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Contact Stats</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Times Contacted</dt>
                  <dd className="text-sm font-medium text-gray-900">{lead.fields['Times Contacted'] || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Last Contact</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {lead.fields['Last Contact Date']
                      ? format(new Date(lead.fields['Last Contact Date']), 'MMM d')
                      : 'Never'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Lead Score</dt>
                  <dd className="text-sm font-medium text-gray-900">{lead.fields['Lead Score'] ?? '-'}</dd>
                </div>
              </dl>
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

          {/* Lead Fee (if exists) */}
          {lead.fields['Lead Fee'] && lead.fields['Lead Fee'] > 0 && (
            <div className={`shadow sm:rounded-lg ${lead.fields.Refunded ? 'bg-gray-50' : 'bg-rose-50'}`}>
              <div className="px-4 py-5 sm:p-6">
                <h3 className={`text-base font-medium mb-3 flex items-center gap-2 ${lead.fields.Refunded ? 'text-gray-700' : 'text-rose-900'}`}>
                  <DollarSign className="h-5 w-5" />
                  Lead Fee
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${lead.fields.Refunded ? 'text-gray-500 line-through' : 'text-rose-700'}`}>
                      ${lead.fields['Lead Fee'].toFixed(2)}
                    </span>
                    {lead.fields.Refunded && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Refunded
                      </span>
                    )}
                  </div>
                  {lead.fields.Refunded && lead.fields['Refund Date'] && (
                    <p className="text-sm text-gray-500">
                      Refunded on {format(new Date(lead.fields['Refund Date']), 'MMM d, yyyy')}
                    </p>
                  )}
                  {!lead.fields.Refunded && (
                    <button
                      onClick={async () => {
                        if (!confirm('Mark this lead fee as refunded? This will remove it from expense calculations.')) return;
                        await updateLead({
                          Refunded: true,
                          'Refund Date': new Date().toISOString().split('T')[0],
                        });
                        await logActivity('Note', `Lead fee of $${lead.fields['Lead Fee']?.toFixed(2)} marked as refunded`);
                      }}
                      disabled={updating}
                      className="w-full inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Mark as Refunded
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Won Reason (if Won) */}
          {lead.fields.Status === 'Won' && lead.fields['Won Reason'] && (
            <div className="bg-green-50 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Won Reason
                </h3>
                <p className="text-sm text-green-700">{lead.fields['Won Reason']}</p>
              </div>
            </div>
          )}

          {/* Lost Reason (if Lost) */}
          {lead.fields.Status === 'Lost' && lead.fields['Lost Reason'] && (
            <div className="bg-red-50 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-red-900 mb-2 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Lost Reason
                </h3>
                <p className="text-sm text-red-700">{lead.fields['Lost Reason']}</p>
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

      {/* Status Change Modal (Won/Lost Reason) */}
      {showStatusModal && (
        <StatusReasonModal
          status={showStatusModal}
          onClose={() => setShowStatusModal(null)}
          onConfirm={(reason) => handleStatusWithReason(showStatusModal, reason)}
        />
      )}

      {/* Tag Selection Modal */}
      {showTagModal && (
        <TagSelectionModal
          allTags={allTags}
          selectedTagIds={lead.fields['Disposition Tags'] || []}
          onToggle={toggleTag}
          onClose={() => setShowTagModal(false)}
          getTagColor={getTagColor}
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

// Status Reason Modal (for Won/Lost)
function StatusReasonModal({
  status,
  onClose,
  onConfirm,
}: {
  status: 'Won' | 'Lost';
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  const wonReasons = [
    'Good Price',
    'Quality Service',
    'Fast Response',
    'Good Reviews',
    'Referral Trust',
    'Availability',
    'Other',
  ];

  const lostReasons = [
    'Price too high',
    'Chose competitor',
    'No response',
    'Not ready',
    'Outside service area',
    'Other',
  ];

  const reasons = status === 'Won' ? wonReasons : lostReasons;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {status === 'Won' ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Mark as Won
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Mark as Lost
              </>
            )}
          </h2>
          <p className="text-gray-600 mb-4">
            {status === 'Won'
              ? 'Great! Why did this lead convert?'
              : 'What was the reason for losing this lead?'}
          </p>

          <div className="space-y-2 mb-6">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-2 rounded-md border transition-colors ${
                  reason === r
                    ? status === 'Won'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => reason && onConfirm(reason)}
              disabled={!reason}
              className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                status === 'Won'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tag Selection Modal
function TagSelectionModal({
  allTags,
  selectedTagIds,
  onToggle,
  onClose,
  getTagColor,
}: {
  allTags: DispositionTag[];
  selectedTagIds: string[];
  onToggle: (tag: DispositionTag) => void;
  onClose: () => void;
  getTagColor: (color: DispositionTag['fields']['Color']) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage Tags
          </h2>

          {allTags.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No tags available. Create tags in Settings.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggle(tag)}
                    className={`w-full text-left px-4 py-3 rounded-md border transition-colors flex items-center justify-between ${
                      isSelected
                        ? `${getTagColor(tag.fields.Color)} border-current`
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="font-medium">{tag.fields.Name}</span>
                      {tag.fields.Description && (
                        <span className="text-sm text-gray-500">- {tag.fields.Description}</span>
                      )}
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
