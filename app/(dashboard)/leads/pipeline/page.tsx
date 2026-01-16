'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { QuickStatusSelect } from '@/components/QuickStatusSelect';
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
      render: (lead) => (
        <QuickStatusSelect
          recordId={lead.id}
          currentStatus={lead.fields.Status || 'New'}
          statusType="lead"
          apiEndpoint="/api/leads"
          onSuccess={fetchLeads}
        />
      ),
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
    // Leads without dates are treated as newest (appear first)
    const dateA = a.fields['Created Date'] || '';
    const dateB = b.fields['Created Date'] || '';
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1; // A has no date, put it first
    if (!dateB) return 1;  // B has no date, put it first
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

    // Auto-detect delimiter: tab vs comma
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = tabCount > commaCount ? '\t' : ',';

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const leads: Lead['fields'][] = [];

    // Detect if this is an Angi export (has Angi-specific headers)
    const isAngiExport = headers.some(h =>
      h.toLowerCase().includes('lead number') ||
      h.toLowerCase().includes('lead fee') ||
      h.toLowerCase().includes('customer first name')
    );

    // Helper to check if header matches any of the patterns
    const headerMatches = (header: string, patterns: string[]): boolean => {
      const h = header.toLowerCase().replace(/[_-]/g, ' ').trim();
      return patterns.some(p => h === p || h.includes(p));
    };

    // Helper to add to notes
    const addToNotes = (lead: Lead['fields'], note: string) => {
      if (lead.Notes) {
        lead.Notes = `${lead.Notes}\n${note}`;
      } else {
        lead.Notes = note;
      }
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      const lead: Lead['fields'] = { Name: '' };

      // Track first/last name separately for combining
      let firstName = '';
      let lastName = '';

      // If this is an Angi export, auto-set lead source
      if (isAngiExport) {
        lead['Lead Source'] = 'Angi';
      }

      headers.forEach((header, index) => {
        const value = values[index];
        if (!value) return;

        // NAME FIELDS - Handle various formats
        // Full name patterns
        if (headerMatches(header, ['full name', 'fullname', 'name', 'customer name', 'client name', 'contact name', 'lead name'])) {
          lead.Name = value;
        }
        // First name patterns (from Angi, Thumbtack, etc.)
        else if (headerMatches(header, ['first name', 'firstname', 'customer first name', 'client first name', 'fname', 'given name'])) {
          firstName = value;
        }
        // Last name patterns
        else if (headerMatches(header, ['last name', 'lastname', 'customer last name', 'client last name', 'lname', 'surname', 'family name'])) {
          lastName = value;
        }

        // EMAIL FIELDS
        else if (headerMatches(header, ['email', 'email address', 'e mail', 'customer email', 'client email', 'contact email'])) {
          lead.Email = value;
        }

        // PHONE FIELDS
        else if (headerMatches(header, ['phone', 'phone number', 'mobile', 'cell', 'telephone', 'tel', 'customer phone', 'client phone', 'contact phone', 'primary phone', 'home phone', 'cell phone', 'mobile phone'])) {
          lead.Phone = value;
        }

        // ADDRESS FIELDS
        else if (headerMatches(header, ['address', 'street address', 'street', 'address line 1', 'address1', 'customer address', 'service address', 'property address'])) {
          lead.Address = value;
        }
        else if (headerMatches(header, ['address line 2', 'address2', 'apt', 'unit', 'suite'])) {
          // Append to existing address
          if (lead.Address) {
            lead.Address = `${lead.Address}, ${value}`;
          } else {
            lead.Address = value;
          }
        }

        // CITY
        else if (headerMatches(header, ['city', 'town', 'customer city', 'service city'])) {
          lead.City = value;
        }

        // STATE
        else if (headerMatches(header, ['state', 'province', 'region', 'customer state', 'service state'])) {
          lead.State = value;
        }

        // ZIP CODE
        else if (headerMatches(header, ['zip', 'zip code', 'zipcode', 'postal', 'postal code', 'postcode', 'customer zip', 'service zip'])) {
          lead['Zip Code'] = value;
        }

        // LEAD SOURCE
        else if (headerMatches(header, ['source', 'lead source', 'referral source', 'how did you hear', 'marketing source', 'channel'])) {
          // Try to match to our known sources
          const v = value.toLowerCase();
          if (v.includes('angi') || v.includes('angie')) {
            lead['Lead Source'] = 'Angi';
          } else if (v.includes('thumbtack')) {
            lead['Lead Source'] = 'Thumbtack';
          } else if (v.includes('google')) {
            lead['Lead Source'] = 'Google';
          } else if (v.includes('facebook') || v.includes('fb') || v.includes('meta')) {
            lead['Lead Source'] = 'Facebook';
          } else if (v.includes('referral') || v.includes('friend') || v.includes('word of mouth')) {
            lead['Lead Source'] = 'Referral';
          } else if (v.includes('yelp')) {
            lead['Lead Source'] = 'Yelp' as Lead['fields']['Lead Source'];
          } else if (v.includes('nextdoor')) {
            lead['Lead Source'] = 'Nextdoor' as Lead['fields']['Lead Source'];
          } else if (['Angi', 'Referral', 'Direct', 'Google', 'Facebook', 'Thumbtack', 'Yelp', 'Nextdoor', 'Other'].includes(value)) {
            lead['Lead Source'] = value as Lead['fields']['Lead Source'];
          } else {
            lead['Lead Source'] = 'Other';
          }
        }

        // SERVICE TYPE / LEAD TYPE (Angi uses "Lead Type")
        else if (headerMatches(header, ['service', 'service type', 'service interested', 'service needed', 'type of service', 'cleaning type', 'job type', 'project type', 'category', 'lead type'])) {
          const v = value.toLowerCase();
          if (v.includes('deep') || v.includes('thorough') || v.includes('detailed')) {
            lead['Service Type Interested'] = 'Deep Clean';
          } else if (v.includes('move') || v.includes('moving') || v.includes('move out') || v.includes('move in')) {
            lead['Service Type Interested'] = 'Move-In-Out';
          } else if (v.includes('general') || v.includes('standard') || v.includes('regular') || v.includes('basic') || v.includes('routine') || v.includes('house cleaning') || v.includes('home cleaning')) {
            lead['Service Type Interested'] = 'General Clean';
          } else if (['General Clean', 'Deep Clean', 'Move-In-Out'].includes(value)) {
            lead['Service Type Interested'] = value as Lead['fields']['Service Type Interested'];
          } else if (value) {
            // Store the original lead type in notes if we can't map it
            addToNotes(lead, `Service requested: ${value}`);
          }
        }

        // LEAD STATUS (from source - map to our status if possible)
        else if (headerMatches(header, ['lead status', 'status', 'lead state'])) {
          const v = value.toLowerCase();
          // Map common source statuses to our statuses
          if (v.includes('new') || v.includes('unread') || v.includes('pending')) {
            lead.Status = 'New';
          } else if (v.includes('contact') || v.includes('reach') || v.includes('call')) {
            lead.Status = 'Contacted';
          } else if (v.includes('quote') || v.includes('estimate') || v.includes('bid')) {
            lead.Status = 'Quote Sent';
          } else if (v.includes('book') || v.includes('schedul') || v.includes('confirm') || v.includes('won')) {
            lead.Status = 'Won';
          } else if (v.includes('lost') || v.includes('dead') || v.includes('closed') || v.includes('decline')) {
            lead.Status = 'Lost';
          } else {
            // Store original status in notes
            addToNotes(lead, `Original status: ${value}`);
          }
        }

        // LEAD DESCRIPTION (Angi specific - goes to notes)
        else if (headerMatches(header, ['lead description', 'description', 'project description', 'job description', 'work description', 'service description'])) {
          addToNotes(lead, value);
        }

        // LEAD NUMBER / LEAD ID (Angi specific)
        else if (headerMatches(header, ['lead number', 'lead num', 'lead #', 'angi lead id', 'angi id', 'lead id', 'homeadvisor id', 'ha id', 'external id', 'reference id', 'ref id', 'ref #', 'reference #', 'id'])) {
          lead['Angi Lead ID'] = value;
        }

        // LEAD FEE (Angi specific - store in notes for reference)
        else if (headerMatches(header, ['lead fee', 'fee', 'cost', 'lead cost', 'price', 'lead price'])) {
          addToNotes(lead, `Lead fee: ${value}`);
        }

        // BEDROOMS
        else if (headerMatches(header, ['bedrooms', 'beds', 'bed', 'bedroom count', 'num bedrooms', 'number of bedrooms', 'br'])) {
          const num = parseInt(value.replace(/[^0-9]/g, ''));
          if (num > 0) lead.Bedrooms = num;
        }

        // BATHROOMS
        else if (headerMatches(header, ['bathrooms', 'baths', 'bath', 'bathroom count', 'num bathrooms', 'number of bathrooms', 'ba'])) {
          const num = parseFloat(value.replace(/[^0-9.]/g, ''));
          if (num > 0) lead.Bathrooms = num;
        }

        // SQUARE FOOTAGE (add to notes since not a dedicated field)
        else if (headerMatches(header, ['sqft', 'square feet', 'square footage', 'sq ft', 'size', 'home size', 'property size'])) {
          const num = parseInt(value.replace(/[^0-9]/g, ''));
          if (num > 0) {
            addToNotes(lead, `Square footage: ${num}`);
          }
        }

        // NOTES/COMMENTS
        else if (headerMatches(header, ['notes', 'comments', 'message', 'details', 'additional info', 'additional information', 'special instructions', 'customer notes', 'request', 'customer message', 'inquiry'])) {
          addToNotes(lead, value);
        }

        // DATE FIELDS (for reference/notes)
        else if (headerMatches(header, ['date', 'created', 'submitted', 'lead date', 'inquiry date', 'request date', 'created date', 'submission date'])) {
          addToNotes(lead, `Lead received: ${value}`);
        }
      });

      // Combine first + last name if no full name was found
      if (!lead.Name && (firstName || lastName)) {
        lead.Name = [firstName, lastName].filter(Boolean).join(' ');
      }

      // Only add if we have at least a name
      if (lead.Name) {
        // Set default status if not already set from source
        if (!lead.Status) {
          lead.Status = 'New';
        }
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
        setError('No valid leads found in CSV. Make sure you have a header row with a name column (e.g., "Name", "First Name", "Customer First Name", etc.).');
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
              Upload a CSV file or paste data below. Required: <strong>Name</strong> (or First Name + Last Name)
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Works with exports from Angi, Thumbtack, Yelp, and more. Supports various header formats like &quot;Customer First Name&quot;, &quot;Phone Number&quot;, etc.
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
              <div className="max-h-48 overflow-auto border border-gray-200 rounded-md">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Name</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Phone</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Email</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Address</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">City</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Service</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Source</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((lead, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{lead.Name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{lead.Phone || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate" title={lead.Email}>{lead.Email || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate" title={lead.Address}>{lead.Address || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{lead.City || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{lead['Service Type Interested'] || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{lead['Lead Source'] || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{lead.Status || 'New'}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr className="border-t">
                        <td colSpan={8} className="px-3 py-2 text-gray-500 text-center">
                          ... and {preview.length - 10} more leads
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Show what fields were detected */}
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-medium">Fields detected: </span>
                {Object.keys(preview[0] || {}).filter(k => preview[0][k as keyof Lead['fields']]).join(', ')}
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Generate the webhook URL based on current host
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/leads/webhook`
    : 'https://tidyco-crm.vercel.app/api/leads/webhook';

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const leadSources = [
    {
      id: 'angi',
      name: 'Angi / HomeAdvisor',
      logo: '🏠',
      color: 'bg-red-500',
      category: 'Lead Marketplaces',
      integrationMethod: 'email',
      difficulty: 'Easy',
      setupTime: '1-2 business days',
      description: 'Angi (formerly Angie\'s List) and HomeAdvisor are now merged. Integration is set up by emailing their team.',
      instructions: [
        'Copy the webhook URL below',
        'Send an email to crmintegrations@angi.com',
        'Include: Your business name, Angi account email, phone number, and the webhook URL',
        'Request that all new leads be sent to this webhook URL',
        'Wait 1-2 business days for confirmation',
      ],
      additionalInfo: {
        contactEmail: 'crmintegrations@angi.com',
        note: 'Angi does NOT have a self-service integration portal. All webhook setups are handled manually by their CRM integrations team.',
        docs: 'https://intercom.help/angi/en/articles/10288125-setting-up-api-integration-with-angi',
      },
      emailTemplate: `Subject: CRM Webhook Integration Request

Hello Angi CRM Team,

I would like to set up a webhook integration to receive my leads automatically.

Business Name: [YOUR BUSINESS NAME]
Account Email: [YOUR ANGI ACCOUNT EMAIL]
Phone: [YOUR PHONE NUMBER]

Webhook URL: ${typeof window !== 'undefined' ? window.location.origin : 'https://tidyco-crm.vercel.app'}/api/leads/webhook
Method: POST
Content-Type: application/json

Please configure my account to send all new leads to this webhook.

Thank you!`,
    },
    {
      id: 'thumbtack',
      name: 'Thumbtack',
      logo: '📌',
      color: 'bg-blue-600',
      category: 'Lead Marketplaces',
      integrationMethod: 'zapier',
      difficulty: 'Medium',
      setupTime: '15-30 minutes',
      description: 'Thumbtack\'s Partner API requires OAuth credentials. Most pros use Zapier for integration.',
      instructions: [
        'Go to zapier.com and create a free account',
        'Create a new Zap with trigger: "Thumbtack → New Lead"',
        'Connect your Thumbtack Pro account when prompted',
        'Set action: "Webhooks by Zapier → POST"',
        'Enter our webhook URL in the URL field',
        'Map the lead fields (name, email, phone, etc.)',
        'Test and enable your Zap',
      ],
      additionalInfo: {
        zapierLink: 'https://zapier.com/apps/thumbtack/integrations/webhook',
        note: 'Thumbtack only allows ONE lead integration per account. If you have an existing integration, disconnect it first.',
        docs: 'https://developers.thumbtack.com/docs/negotiations/implementation',
      },
    },
    {
      id: 'yelp',
      name: 'Yelp',
      logo: '⭐',
      color: 'bg-red-600',
      category: 'Lead Marketplaces',
      integrationMethod: 'zapier',
      difficulty: 'Medium',
      setupTime: '15-30 minutes',
      description: 'Yelp offers a Leads API for advertising partners. Most businesses use the Zapier integration.',
      instructions: [
        'Go to zapier.com and create a free account',
        'Create a new Zap with trigger: "Yelp → New Lead"',
        'Connect your Yelp for Business account',
        'Set action: "Webhooks by Zapier → POST"',
        'Enter our webhook URL in the URL field',
        'Map the lead fields appropriately',
        'Test and enable your Zap',
      ],
      additionalInfo: {
        zapierLink: 'https://zapier.com/apps/yelp/integrations',
        note: 'Yelp\'s native Leads API is available to advertising partners with development resources.',
        docs: 'https://docs.developer.yelp.com/docs/leads-api-zapier-integration',
      },
    },
    {
      id: 'facebook',
      name: 'Facebook Lead Ads',
      logo: '📘',
      color: 'bg-blue-700',
      category: 'Advertising Platforms',
      integrationMethod: 'zapier',
      difficulty: 'Medium',
      setupTime: '15-30 minutes',
      description: 'Connect Facebook Lead Ads to automatically import leads from your Facebook ad campaigns.',
      instructions: [
        'Go to zapier.com and create a free account',
        'Create a new Zap with trigger: "Facebook Lead Ads → New Lead"',
        'Connect your Facebook account and select your Page',
        'Choose the Lead Form to monitor',
        'Set action: "Webhooks by Zapier → POST"',
        'Enter our webhook URL and map the fields',
        'Test with a sample lead and enable',
      ],
      additionalInfo: {
        zapierLink: 'https://zapier.com/apps/facebook-lead-ads/integrations/webhook',
        note: 'Requires a Facebook Business Page with Lead Ads enabled. Zapier paid plan may be required.',
        docs: 'https://zapier.com/blog/use-webhooks-with-facebook-lead-ads/',
      },
    },
    {
      id: 'google',
      name: 'Google Local Services',
      logo: '🔍',
      color: 'bg-green-600',
      category: 'Advertising Platforms',
      integrationMethod: 'api',
      difficulty: 'Advanced',
      setupTime: '1-2 hours',
      description: 'Google Local Services Ads can send leads via webhook. Requires Google Ads API access.',
      instructions: [
        'You need a Google Ads Manager Account with Local Services campaigns',
        'Go to Google Ads → Tools & Settings → Lead form extensions',
        'Select your lead form and click "Webhook integration"',
        'Enter our webhook URL in the Webhook URL field',
        'Generate a webhook key for validation',
        'Save and test with a sample submission',
      ],
      additionalInfo: {
        note: 'For simpler setup, consider using Zapier with "Google Ads → New Lead Form Entry" trigger.',
        docs: 'https://support.google.com/google-ads/answer/16729613',
        zapierAlt: 'https://zapier.com/apps/google-ads/integrations/webhook',
      },
    },
    {
      id: 'nextdoor',
      name: 'Nextdoor',
      logo: '🏘️',
      color: 'bg-green-700',
      category: 'Lead Marketplaces',
      integrationMethod: 'zapier',
      difficulty: 'Medium',
      setupTime: '15-30 minutes',
      description: 'Connect your Nextdoor business leads to automatically import neighborhood inquiries.',
      instructions: [
        'Go to zapier.com and create a free account',
        'Create a new Zap with trigger: "Nextdoor → New Lead"',
        'Connect your Nextdoor Business account',
        'Set action: "Webhooks by Zapier → POST"',
        'Enter our webhook URL in the URL field',
        'Map name, email, phone, and message fields',
        'Test and enable your Zap',
      ],
      additionalInfo: {
        zapierLink: 'https://zapier.com/apps/nextdoor/integrations/webhook',
        docs: 'https://developer.nextdoor.com/',
      },
    },
    {
      id: 'porch',
      name: 'Porch',
      logo: '🏗️',
      color: 'bg-teal-600',
      category: 'Lead Marketplaces',
      integrationMethod: 'contact',
      difficulty: 'Medium',
      setupTime: '2-5 business days',
      description: 'Porch offers CRM integrations for home service professionals. Contact their team for setup.',
      instructions: [
        'Log in to your Porch Pro account',
        'Go to Settings or contact Porch support',
        'Request CRM/webhook integration',
        'Provide our webhook URL',
        'Porch will configure the integration on their end',
      ],
      additionalInfo: {
        note: 'Porch has native integrations with some CRMs (like MarketSharp). For custom webhooks, contact their support team.',
        contactEmail: 'support@porch.com',
      },
    },
    {
      id: 'email',
      name: 'Email Forwarding',
      logo: '📧',
      color: 'bg-purple-600',
      category: 'Universal Methods',
      integrationMethod: 'email-parser',
      difficulty: 'Medium',
      setupTime: '20-40 minutes',
      description: 'Forward lead notification emails from ANY source and automatically parse them into leads.',
      instructions: [
        'Go to zapier.com and set up Email Parser by Zapier',
        'Create a unique parsing email (yourname@robot.zapier.com)',
        'Forward a sample lead email to train the parser',
        'Highlight and name fields (name, email, phone, etc.)',
        'Create a Zap: "Email Parser → New Email" → "Webhook → POST"',
        'Enter our webhook URL and map the parsed fields',
        'Set up email forwarding rules in your inbox to auto-forward lead emails',
      ],
      additionalInfo: {
        zapierLink: 'https://zapier.com/apps/email-parser/integrations/webhook',
        note: 'Works with ANY lead source that sends email notifications! Great for sources without direct integrations.',
        alternativeTool: 'mailparser.io - More advanced parsing with free tier',
      },
    },
    {
      id: 'custom',
      name: 'Custom / API',
      logo: '⚙️',
      color: 'bg-gray-600',
      category: 'Universal Methods',
      integrationMethod: 'webhook',
      difficulty: 'Technical',
      setupTime: 'Varies',
      description: 'Direct webhook integration for developers or any service that can send HTTP POST requests.',
      instructions: [
        'Copy the webhook URL below',
        'Configure your lead source to POST JSON to this URL',
        'Required field: "name" (string)',
        'Optional fields: email, phone, address, city, state, zip, service_type, notes, lead_source',
        'Send a test POST request to verify',
      ],
      additionalInfo: {
        method: 'POST',
        contentType: 'application/json',
      },
    },
  ];

  // Group sources by category
  const categories = Array.from(new Set(leadSources.map(s => s.category)));
  const selectedSourceData = leadSources.find(s => s.id === selectedSource);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Connect Lead Source</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {!selectedSource ? (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Connect your lead sources to automatically import leads into your CRM. Select a platform to see setup instructions.
              </p>

              {categories.map((category) => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{category}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {leadSources.filter(s => s.category === category).map((source) => (
                      <button
                        key={source.id}
                        onClick={() => setSelectedSource(source.id)}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
                      >
                        <span className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center text-white text-lg mr-3 flex-shrink-0`}>
                          {source.logo}
                        </span>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 text-sm block truncate">{source.name}</span>
                          <span className="text-xs text-gray-500">{source.difficulty}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-sm text-primary-600 hover:text-primary-700 mb-4 flex items-center"
              >
                ← Back to all sources
              </button>

              <div className="flex items-center mb-4">
                <span className={`w-12 h-12 ${selectedSourceData?.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                  {selectedSourceData?.logo}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{selectedSourceData?.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                      {selectedSourceData?.difficulty}
                    </span>
                    <span>•</span>
                    <span>{selectedSourceData?.setupTime}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6 p-3 bg-gray-50 rounded-lg">
                {selectedSourceData?.description}
              </p>

              {/* Webhook URL - Always show */}
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
                    onClick={() => handleCopy(webhookUrl, 'url')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 flex items-center"
                  >
                    {copiedField === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Email Template for Angi */}
              {selectedSourceData?.emailTemplate && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Template (copy and customize)
                    </label>
                    <button
                      onClick={() => handleCopy(selectedSourceData.emailTemplate!, 'email')}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      Copy template
                    </button>
                  </div>
                  <pre className="p-3 bg-gray-900 text-gray-300 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {selectedSourceData.emailTemplate}
                  </pre>
                  {selectedSourceData.additionalInfo?.contactEmail && (
                    <a
                      href={`mailto:${selectedSourceData.additionalInfo.contactEmail}?subject=CRM%20Webhook%20Integration%20Request`}
                      className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Open email to {selectedSourceData.additionalInfo.contactEmail}
                    </a>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="mb-6">
                <h4 className="font-medium text-sm mb-3">Setup Instructions</h4>
                <ol className="space-y-3">
                  {selectedSourceData?.instructions.map((instruction, i) => (
                    <li key={i} className="flex text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium mr-3">
                        {i + 1}
                      </span>
                      <span className="text-gray-600 pt-0.5">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Additional Info */}
              {selectedSourceData?.additionalInfo && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-sm text-amber-800 mb-2">Important Notes</h4>
                  <div className="space-y-2 text-sm text-amber-700">
                    {selectedSourceData.additionalInfo.note && (
                      <p>{selectedSourceData.additionalInfo.note}</p>
                    )}
                    {selectedSourceData.additionalInfo.zapierLink && (
                      <a
                        href={selectedSourceData.additionalInfo.zapierLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-amber-800 hover:text-amber-900 font-medium"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open Zapier Integration
                      </a>
                    )}
                    {selectedSourceData.additionalInfo.docs && (
                      <a
                        href={selectedSourceData.additionalInfo.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-amber-800 hover:text-amber-900"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Official Documentation
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Sample JSON for Custom */}
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
  "lead_source": "Website",
  "notes": "2 bedroom apartment, pet-friendly"
}`}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">
                    Test with: <code className="bg-gray-100 px-1 rounded">curl -X POST -H &quot;Content-Type: application/json&quot; -d &apos;&#123;&quot;name&quot;:&quot;Test&quot;&#125;&apos; {webhookUrl}</code>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <a
                  href="mailto:support@tidyco.com?subject=Lead Integration Help"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  <Mail className="h-4 w-4 mr-1" />
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
