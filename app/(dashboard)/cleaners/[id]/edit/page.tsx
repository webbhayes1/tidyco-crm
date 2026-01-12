'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { CleanerForm } from '@/components/CleanerForm';
import type { Cleaner } from '@/types/airtable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditCleanerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cleaner, setCleaner] = useState<Cleaner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCleaner() {
      try {
        const response = await fetch(`/api/cleaners/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch cleaner');
        const data = await response.json();
        setCleaner(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCleaner();
  }, [params.id]);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch(`/api/cleaners/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update cleaner');
      }

      // Success - redirect to cleaner detail
      router.push(`/cleaners/${params.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to update cleaner:', err);
      setError(err.message);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading cleaner...</div>
      </div>
    );
  }

  if (error || !cleaner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/cleaners" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader title="Error" description="" />
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h1 className="text-xl font-bold text-red-800 mb-2">Error</h1>
          <p className="text-red-700">{error || 'Cleaner not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/cleaners/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Edit Cleaner"
          description={cleaner.fields.Name}
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <CleanerForm
        cleaner={cleaner}
        onSave={handleSave}
        onCancel={() => router.push(`/cleaners/${params.id}`)}
      />
    </div>
  );
}
