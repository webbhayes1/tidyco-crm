'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { LeadForm } from '@/components/LeadForm';
import { Lead } from '@/types/airtable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLead() {
      try {
        const response = await fetch(`/api/leads/${params.id}`);
        if (!response.ok) throw new Error('Lead not found');
        const data = await response.json();
        setLead(data);
      } catch (err) {
        setError('Failed to load lead');
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [params.id]);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update lead');
      }

      router.push(`/leads/${params.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to update lead:', err);
      setError(err.message);
      throw err;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!lead) {
    return <div className="text-center py-12">Lead not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/leads/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`Edit ${lead.fields.Name}`}
          description="Update lead information"
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <LeadForm
        initialData={lead.fields}
        onSave={handleSave}
        onCancel={() => router.push(`/leads/${params.id}`)}
      />
    </div>
  );
}
