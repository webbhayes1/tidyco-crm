'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { SMSTemplate, DripCampaign, CampaignEnrollment, Lead } from '@/types/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Clock,
  FileText,
  Zap,
  Users,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';

export default function SMSDripsPage() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [enrollments, setEnrollments] = useState<CampaignEnrollment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick send state
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showQuickSend, setShowQuickSend] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [templatesRes, campaignsRes, enrollmentsRes, leadsRes] = await Promise.all([
          fetch('/api/sms/templates'),
          fetch('/api/sms/campaigns'),
          fetch('/api/sms/enrollments?status=Active'),
          fetch('/api/leads'),
        ]);

        if (templatesRes.ok) setTemplates(await templatesRes.json());
        if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
        if (enrollmentsRes.ok) setEnrollments(await enrollmentsRes.json());
        if (leadsRes.ok) setLeads(await leadsRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Stats calculations
  const activeTemplates = templates.filter(t => t.fields.Active).length;
  const activeCampaigns = campaigns.filter(c => c.fields.Status === 'Active').length;
  const activeEnrollments = enrollments.length;

  // Get scheduled messages (from active enrollments with Next Message Date)
  const scheduledMessages = enrollments
    .filter(e => e.fields['Next Message Date'])
    .sort((a, b) => {
      const dateA = a.fields['Next Message Date'] || '';
      const dateB = b.fields['Next Message Date'] || '';
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Drips"
        description="Manage SMS templates, drip campaigns, and message history"
        actions={
          <div className="flex space-x-2">
            <Link
              href="/leads/sms-drips/templates"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Link>
            <Link
              href="/leads/sms-drips/campaigns"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <Zap className="mr-2 h-4 w-4" />
              Campaigns
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Templates</dt>
                  <dd className="text-lg font-semibold text-gray-900">{activeTemplates}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/leads/sms-drips/templates" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
              Manage templates <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                  <dd className="text-lg font-semibold text-gray-900">{activeCampaigns}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/leads/sms-drips/campaigns" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
              Manage campaigns <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Enrollments</dt>
                  <dd className="text-lg font-semibold text-gray-900">{activeEnrollments}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <span className="text-sm text-gray-500">Leads in drip campaigns</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Send Card */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Send className="h-5 w-5 text-primary-600 mr-2" />
                Quick Send
              </h3>
            </div>

            {!showQuickSend ? (
              <button
                onClick={() => setShowQuickSend(true)}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-700">
                  Send a quick SMS to a lead
                </span>
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Lead
                  </label>
                  <select
                    value={selectedLead}
                    onChange={(e) => setSelectedLead(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Choose a lead...</option>
                    {leads
                      .filter(l => l.fields.Phone)
                      .map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.fields.Name} - {lead.fields.Phone}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Choose a template...</option>
                    {templates
                      .filter(t => t.fields.Active)
                      .map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.fields.Name}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {templates.find(t => t.id === selectedTemplate)?.fields.Body}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowQuickSend(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedLead || !selectedTemplate}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send SMS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Messages Card */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 text-primary-600 mr-2" />
                Upcoming Messages
              </h3>
            </div>

            {scheduledMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm">No scheduled messages</p>
                <p className="text-xs">Enroll leads in campaigns to schedule automatic follow-ups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledMessages.map((enrollment) => {
                  const lead = leads.find(l => l.id === enrollment.fields.Lead?.[0]);
                  const campaign = campaigns.find(c => c.id === enrollment.fields.Campaign?.[0]);
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {lead?.fields.Name || 'Unknown Lead'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {campaign?.fields.Name || 'Unknown Campaign'} - Step {enrollment.fields['Current Step'] || 1}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.fields['Next Message Date'] &&
                            format(new Date(enrollment.fields['Next Message Date']), 'MMM d')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {enrollment.fields['Next Message Date'] &&
                            format(new Date(enrollment.fields['Next Message Date']), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Templates */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">SMS Templates</h3>
            <Link
              href="/leads/sms-drips/templates"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.slice(0, 6).map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {template.fields.Name}
                  </h4>
                  {template.fields.Active ? (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {template.fields.Body}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {template.fields.Category || 'Uncategorized'}
                  </span>
                  <span className="text-xs text-gray-400">
                    Used {template.fields['Use Count'] || 0}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
