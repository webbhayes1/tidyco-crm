'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DripCampaign } from '@/types/airtable';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Zap,
  Users
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/sms/campaigns');
      if (response.ok) {
        setCampaigns(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleStatusToggle = async (campaign: DripCampaign) => {
    const newStatus = campaign.fields.Status === 'Active' ? 'Paused' : 'Active';
    try {
      const response = await fetch(`/api/sms/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus }),
      });
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to update campaign:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/sms/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const getStatusColor = (status: DripCampaign['fields']['Status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Paused': return 'bg-yellow-100 text-yellow-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerLabel = (trigger: DripCampaign['fields']['Trigger Type']) => {
    switch (trigger) {
      case 'New Lead': return 'When a new lead is created';
      case 'Status Change': return 'When lead status changes';
      case 'No Response': return 'When lead doesn\'t respond';
      case 'Scheduled': return 'On a schedule';
      case 'Manual': return 'Manually enrolled';
      default: return 'Unknown trigger';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads/sms-drips" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Drip Campaigns"
          description={`${campaigns.length} campaigns`}
          actions={
            <button
              disabled
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 opacity-50 cursor-not-allowed"
              title="Campaign builder coming soon"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </button>
          }
        />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Drip campaigns run via n8n automation
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Campaigns are configured here and executed by n8n workflows. Make sure your n8n instance is running for automated messages to be sent.
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Zap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Drip campaigns will be created when you set up n8n workflows.
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {campaign.fields.Name}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(campaign.fields.Status)}`}>
                      {campaign.fields.Status || 'Draft'}
                    </span>
                  </div>

                  {campaign.fields.Description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {campaign.fields.Description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      {getTriggerLabel(campaign.fields['Trigger Type'])}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {campaign.fields['Lead Count'] || 0} leads enrolled
                    </div>
                    {campaign.fields['Conversion Rate'] !== undefined && (
                      <div>
                        {(campaign.fields['Conversion Rate'] * 100).toFixed(1)}% conversion
                      </div>
                    )}
                  </div>

                  {/* Sequence Preview */}
                  {campaign.fields.Sequence && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Sequence:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          try {
                            const sequence = JSON.parse(campaign.fields.Sequence);
                            return sequence.map((step: { step: number; delayMinutes: number }, i: number) => (
                              <div key={i} className="flex items-center">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  Step {step.step}
                                </span>
                                {i < sequence.length - 1 && (
                                  <span className="mx-1 text-gray-400 text-xs">
                                    → {step.delayMinutes >= 1440
                                      ? `${Math.floor(step.delayMinutes / 1440)}d`
                                      : `${step.delayMinutes}m`}
                                  </span>
                                )}
                              </div>
                            ));
                          } catch {
                            return <span className="text-xs text-gray-400">Invalid sequence</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {campaign.fields.Status === 'Active' ? (
                    <button
                      onClick={() => handleStatusToggle(campaign)}
                      className="px-3 py-1.5 text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-md hover:bg-yellow-100"
                      title="Pause campaign"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : campaign.fields.Status !== 'Archived' && (
                    <button
                      onClick={() => handleStatusToggle(campaign)}
                      className="px-3 py-1.5 text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100"
                      title="Activate campaign"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    disabled
                    className="px-3 py-1.5 text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
                    title="Edit (coming soon)"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="px-3 py-1.5 text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
