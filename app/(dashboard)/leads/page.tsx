'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Lead } from '@/types/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus, Upload, Phone, Mail, Link2, Copy, Check, ExternalLink } from 'lucide-react';

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Quote Sent' | 'Won' | 'Lost' | 'Churned';

const STATUS_ORDER: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Quote Sent', 'Won', 'Lost', 'Churned'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  const leadColumns: Column<Lead>[] = [
    {
      key: 'Name',
      label: 'Name',
      render: (lead) => (
        <div>
          <div className="font-medium text-gray-900">{lead.fields.Name}</div>
          {lead.fields['Lead Source'] && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getSourceBadgeColor(lead.fields['Lead Source'])}`}>
              {lead.fields['Lead Source']}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'Contact',
      label: 'Contact',
      render: (lead) => (
        <div className="space-y-1">
          {lead.fields.Phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {lead.fields.Phone}
            </div>
          )}
          {lead.fields.Email && (
            <div className="flex items-center text-sm text-gray-500">
              <Mail className="h-3 w-3 mr-1" />
              {lead.fields.Email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'Service',
      label: 'Service',
      render: (lead) => (
        <div>
          <div className="text-sm text-gray-900">{lead.fields['Service Type Interested'] || '-'}</div>
          {(lead.fields.Bedrooms || lead.fields.Bathrooms) && (
            <div className="text-xs text-gray-500">
              {lead.fields.Bedrooms && `${lead.fields.Bedrooms} bed`}
              {lead.fields.Bedrooms && lead.fields.Bathrooms && ' / '}
              {lead.fields.Bathrooms && `${lead.fields.Bathrooms} bath`}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'Times Contacted',
      label: 'Contacted',
      render: (lead) => (
        <div className="text-center">
          <div className="text-sm font-medium">{lead.fields['Times Contacted'] || 0}</div>
          {lead.fields['Last Contact Date'] && (
            <div className="text-xs text-gray-500">
              {format(new Date(lead.fields['Last Contact Date']), 'MMM d')}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'Next Follow-Up',
      label: 'Follow-Up',
      render: (lead) => {
        if (!lead.fields['Next Follow-Up Date']) return <span className="text-gray-400">-</span>;
        const date = new Date(lead.fields['Next Follow-Up Date']);
        const isOverdue = date < new Date();
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {format(date, 'MMM d')}
          </span>
        );
      },
    },
    {
      key: 'Status',
      label: 'Status',
      render: (lead) => <StatusBadge status={lead.fields.Status || 'New'} />,
    },
  ];

  // Filter leads based on selected filter
  const filteredLeads = leads.filter((lead) => {
    const status = lead.fields.Status || 'New';
    if (filter === 'active') {
      return !['Won', 'Lost', 'Churned'].includes(status);
    }
    if (filter === 'all') return true;
    return status === filter;
  });

  // Sort by status order, then by created date
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const statusA = a.fields.Status || 'New';
    const statusB = b.fields.Status || 'New';
    const orderA = STATUS_ORDER.indexOf(statusA as LeadStatus);
    const orderB = STATUS_ORDER.indexOf(statusB as LeadStatus);
    if (orderA !== orderB) return orderA - orderB;
    // Secondary sort by created date (newest first)
    const dateA = a.fields['Created Date'] || '';
    const dateB = b.fields['Created Date'] || '';
    return dateB.localeCompare(dateA);
  });

  // Count by status for filter badges
  const statusCounts = leads.reduce((acc, lead) => {
    const status = lead.fields.Status || 'New';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = leads.filter(l => !['Won', 'Lost', 'Churned'].includes(l.fields.Status || 'New')).length;

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${filteredLeads.length} leads`}
        actions={
          <div className="flex space-x-2">
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Connect Lead Source
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </button>
            <Link
              href="/leads/new"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Link>
          </div>
        }
      />

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          All ({leads.length})
        </button>
        <div className="border-l border-gray-300 mx-2" />
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {status} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      <DataTable
        data={sortedLeads}
        columns={leadColumns}
        getRowHref={(lead) => `/leads/${lead.id}`}
        emptyMessage="No leads found. Add your first lead or import from CSV."
      />

      {/* Import Modal */}
      {showImportModal && (
        <ImportLeadsModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setShowImportModal(false);
            fetchLeads();
          }}
        />
      )}

      {/* Connect Lead Source Modal */}
      {showConnectModal && (
        <ConnectLeadSourceModal onClose={() => setShowConnectModal(false)} />
      )}
    </div>
  );
}

// Import Modal Component
function ImportLeadsModal({
  onClose,
  onImportComplete,
}: {
  onClose: () => void;
  onImportComplete: () => void;
}) {
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Lead['fields'][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string): Lead['fields'][] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const leads: Lead['fields'][] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const lead: Lead['fields'] = { Name: '' };

      headers.forEach((header, index) => {
        const value = values[index];
        if (!value) return;

        // Map common CSV headers to our field names
        switch (header.toLowerCase()) {
          case 'name':
          case 'full name':
          case 'customer name':
            lead.Name = value;
            break;
          case 'email':
          case 'email address':
            lead.Email = value;
            break;
          case 'phone':
          case 'phone number':
          case 'mobile':
            lead.Phone = value;
            break;
          case 'address':
          case 'street address':
            lead.Address = value;
            break;
          case 'city':
            lead.City = value;
            break;
          case 'state':
            lead.State = value;
            break;
          case 'zip':
          case 'zip code':
          case 'zipcode':
            lead['Zip Code'] = value;
            break;
          case 'source':
          case 'lead source':
            if (['Angi', 'Referral', 'Direct', 'Google', 'Facebook', 'Thumbtack', 'Other'].includes(value)) {
              lead['Lead Source'] = value as Lead['fields']['Lead Source'];
            }
            break;
          case 'service':
          case 'service type':
          case 'service interested':
            if (['General Clean', 'Deep Clean', 'Move-In-Out'].includes(value)) {
              lead['Service Type Interested'] = value as Lead['fields']['Service Type Interested'];
            }
            break;
          case 'bedrooms':
          case 'beds':
            lead.Bedrooms = parseInt(value) || undefined;
            break;
          case 'bathrooms':
          case 'baths':
            lead.Bathrooms = parseFloat(value) || undefined;
            break;
          case 'notes':
          case 'comments':
            lead.Notes = value;
            break;
          case 'angi lead id':
          case 'angi id':
            lead['Angi Lead ID'] = value;
            break;
        }
      });

      // Only add if we have at least a name
      if (lead.Name) {
        lead.Status = 'New'; // Default status
        leads.push(lead);
      }
    }

    return leads;
  };

  const handlePreview = () => {
    setError(null);
    try {
      const parsed = parseCSV(csvData);
      if (parsed.length === 0) {
        setError('No valid leads found in CSV. Make sure you have a header row with "Name" column.');
        return;
      }
      setPreview(parsed);
    } catch (e) {
      setError('Failed to parse CSV. Please check the format.');
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      alert(`Successfully imported ${result.count} leads!`);
      onImportComplete();
    } catch (e) {
      setError('Failed to import leads. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Import Leads from CSV</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Upload a CSV file or paste data below. Required column: <strong>Name</strong>
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Supported columns: Name, Email, Phone, Address, City, State, Zip Code, Source, Service Type, Bedrooms, Bathrooms, Notes, Angi Lead ID
            </p>

            {/* File Upload */}
            <div className="mb-3">
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-1" />
                  {fileName ? (
                    <span className="text-sm text-primary-600 font-medium">{fileName}</span>
                  ) : (
                    <span className="text-sm text-gray-500">Click to upload CSV file</span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or paste CSV data</span>
              </div>
            </div>

            <textarea
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value);
                setFileName(null);
              }}
              placeholder="Name,Phone,Email,Source&#10;John Smith,555-123-4567,john@email.com,Angi&#10;Jane Doe,555-987-6543,jane@email.com,Referral"
              className="w-full h-32 border border-gray-300 rounded-md p-3 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Preview ({preview.length} leads)</h3>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((lead, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{lead.Name}</td>
                        <td className="px-3 py-2">{lead.Phone || '-'}</td>
                        <td className="px-3 py-2">{lead['Lead Source'] || '-'}</td>
                      </tr>
                    ))}
                    {preview.length > 5 && (
                      <tr className="border-t">
                        <td colSpan={3} className="px-3 py-2 text-gray-500 text-center">
                          ... and {preview.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {preview.length === 0 ? (
              <button
                onClick={handlePreview}
                disabled={!csvData.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50"
              >
                Preview
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import ${preview.length} Leads`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Connect Lead Source Modal
function ConnectLeadSourceModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Generate the webhook URL based on current host
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/leads/webhook`
    : 'https://tidyco-crm.vercel.app/api/leads/webhook';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leadSources = [
    {
      id: 'angi',
      name: 'Angi (Angie\'s List)',
      logo: '🏠',
      color: 'bg-blue-500',
      instructions: [
        'Log in to your Angi Pro account',
        'Go to Settings → Lead Integrations',
        'Click "Add New Integration"',
        'Enter the webhook URL below',
        'Set Method to POST and Content-Type to application/json',
        'Contact Angi support at crmintegrations@angi.com if needed',
      ],
    },
    {
      id: 'thumbtack',
      name: 'Thumbtack',
      logo: '📌',
      color: 'bg-green-500',
      instructions: [
        'Log in to your Thumbtack Pro account',
        'Go to Settings → Integrations',
        'Look for "Webhook" or "API" settings',
        'Enter the webhook URL below',
        'Contact Thumbtack support for integration help',
      ],
    },
    {
      id: 'homeadvisor',
      name: 'HomeAdvisor',
      logo: '🏡',
      color: 'bg-orange-500',
      instructions: [
        'Log in to your HomeAdvisor Pro account',
        'Navigate to Lead Settings',
        'Find API/Webhook integration options',
        'Enter the webhook URL below',
        'Contact HomeAdvisor support for setup assistance',
      ],
    },
    {
      id: 'custom',
      name: 'Custom / Other',
      logo: '⚙️',
      color: 'bg-gray-500',
      instructions: [
        'Use the webhook URL below in your lead source',
        'Send a POST request with JSON body',
        'Required field: name',
        'Optional: email, phone, address, city, state, zip, service_type, notes',
      ],
    },
  ];

  const selectedSourceData = leadSources.find(s => s.id === selectedSource);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Connect Lead Source</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {!selectedSource ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Connect your lead sources to automatically import leads into your CRM.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {leadSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                  >
                    <span className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center text-white text-xl mr-3`}>
                      {source.logo}
                    </span>
                    <span className="font-medium text-gray-900">{source.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-sm text-primary-600 hover:text-primary-700 mb-4 flex items-center"
              >
                ← Back to sources
              </button>

              <div className="flex items-center mb-4">
                <span className={`w-10 h-10 ${selectedSourceData?.color} rounded-lg flex items-center justify-center text-white text-xl mr-3`}>
                  {selectedSourceData?.logo}
                </span>
                <h3 className="text-lg font-semibold">{selectedSourceData?.name}</h3>
              </div>

              {/* Webhook URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Webhook URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopy(webhookUrl)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 flex items-center"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Provide this URL to your lead vendor for automatic lead import
                </p>
              </div>

              {/* API Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">API Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="text-gray-500 w-24">Method:</span>
                    <span className="font-mono">POST</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 w-24">Content-Type:</span>
                    <span className="font-mono">application/json</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  {selectedSourceData?.instructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>

              {/* Sample JSON */}
              {selectedSource === 'custom' && (
                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-2">Sample JSON Payload</h4>
                  <pre className="p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">
{`{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "address": "123 Main St",
  "city": "Los Angeles",
  "state": "CA",
  "zip": "90210",
  "service_type": "General Clean",
  "notes": "2 bedroom apartment"
}`}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <a
                  href="mailto:support@tidyco.com?subject=Lead Integration Help"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Need help? Contact support
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
