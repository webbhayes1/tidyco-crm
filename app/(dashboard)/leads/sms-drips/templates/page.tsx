'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { SMSTemplate } from '@/types/airtable';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  MessageSquare,
  X
} from 'lucide-react';

type TemplateCategory = SMSTemplate['fields']['Category'];

const CATEGORIES: { value: TemplateCategory; label: string; color: string }[] = [
  { value: 'Lead Nurture', label: 'Lead Nurture', color: 'bg-blue-100 text-blue-800' },
  { value: 'Booking', label: 'Booking', color: 'bg-green-100 text-green-800' },
  { value: 'Payment', label: 'Payment', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Re-engagement', label: 'Re-engagement', color: 'bg-purple-100 text-purple-800' },
  { value: 'Custom', label: 'Custom', color: 'bg-gray-100 text-gray-800' },
];

const AVAILABLE_VARIABLES = [
  { key: 'client_name', label: 'Client Name', sample: 'John' },
  { key: 'owner_name', label: 'Owner Name', sample: 'Sean' },
  { key: 'owner_phone', label: 'Owner Phone', sample: '408.442.6702' },
  { key: 'service_type', label: 'Service Type', sample: 'Deep Clean' },
  { key: 'price', label: 'Price', sample: '150' },
  { key: 'date', label: 'Date', sample: 'January 15th' },
  { key: 'time', label: 'Time', sample: '10:00 AM' },
  { key: 'address', label: 'Address', sample: '123 Main St' },
  { key: 'cleaner_name', label: 'Cleaner Name', sample: 'Maria' },
  { key: 'cleaner_payout', label: 'Cleaner Payout', sample: '80' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sms/templates');
      if (response.ok) {
        setTemplates(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'active') return t.fields.Active;
    return t.fields.Category === filter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/sms/templates/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicate = async (template: SMSTemplate) => {
    try {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: `${template.fields.Name} (Copy)`,
          Body: template.fields.Body,
          Category: template.fields.Category,
          Active: false,
          'Created By': 'Webb',
        }),
      });
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const getCategoryColor = (category: TemplateCategory) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-800';
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
          title="SMS Templates"
          description={`${templates.length} templates`}
          actions={
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowModal(true);
              }}
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </button>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          All ({templates.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Active ({templates.filter(t => t.fields.Active).length})
        </button>
        <div className="border-l border-gray-300 mx-2" />
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setFilter(category.value || '')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              filter === category.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {category.label} ({templates.filter(t => t.fields.Category === category.value).length})
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {template.fields.Name}
                </h4>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getCategoryColor(template.fields.Category)}`}>
                  {template.fields.Category || 'Uncategorized'}
                </span>
              </div>
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

            <div className="p-3 bg-gray-50 rounded-md mb-3 max-h-32 overflow-y-auto">
              <p className="text-xs text-gray-600 whitespace-pre-wrap">
                {template.fields.Body}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>Used {template.fields['Use Count'] || 0} times</span>
              <span>By {template.fields['Created By'] || 'Unknown'}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingTemplate(template);
                  setShowModal(true);
                }}
                className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDuplicate(template)}
                className="px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="px-3 py-1.5 text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'Create your first SMS template to get started.' : 'No templates match this filter.'}
          </p>
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}

// Template Edit/Create Modal
function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template: SMSTemplate | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(template?.fields.Name || '');
  const [body, setBody] = useState(template?.fields.Body || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.fields.Category || 'Custom');
  const [active, setActive] = useState(template?.fields.Active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertVariable = (variable: string) => {
    const cursorPos = (document.getElementById('template-body') as HTMLTextAreaElement)?.selectionStart || body.length;
    const newBody = body.slice(0, cursorPos) + `{{${variable}}}` + body.slice(cursorPos);
    setBody(newBody);
  };

  const getPreview = () => {
    let preview = body;
    AVAILABLE_VARIABLES.forEach((v) => {
      preview = preview.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.sample);
    });
    return preview;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      setError('Name and body are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = template ? `/api/sms/templates/${template.id}` : '/api/sms/templates';
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: name,
          Body: body,
          Category: category,
          Active: active,
          'Created By': template?.fields['Created By'] || 'Webb',
        }),
      });

      if (!response.ok) throw new Error('Failed to save template');
      onSave();
    } catch (err) {
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {template ? 'Edit Template' : 'New Template'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lead Follow-Up Day 1"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category || ''}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Message Body
                </label>
                <span className="text-xs text-gray-500">
                  {body.length} characters {body.length > 160 && '(multi-part SMS)'}
                </span>
              </div>

              {/* Variable Buttons */}
              <div className="flex flex-wrap gap-1 mb-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                    title={`Insert {{${v.key}}}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <textarea
                id="template-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi {{client_name}}, this is {{owner_name}} from TidyCo..."
                rows={6}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
              />
            </div>

            {/* Preview */}
            {body && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview
                </label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {getPreview()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Template is active
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
