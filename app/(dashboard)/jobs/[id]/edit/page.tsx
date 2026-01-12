'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { JobForm } from '@/components/JobForm';
import type { Job } from '@/types/airtable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [params.id]);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update job');
      }

      // Success - redirect to job detail
      router.push(`/jobs/${params.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to update job:', err);
      setError(err.message);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading job...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader title="Error" description="" />
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h1 className="text-xl font-bold text-red-800 mb-2">Error</h1>
          <p className="text-red-700">{error || 'Job not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/jobs/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Edit Job"
          description={`Job #${job.fields['Job ID'] || job.id.slice(0, 8)}`}
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <JobForm
        job={job}
        onSave={handleSave}
        onCancel={() => router.push(`/jobs/${params.id}`)}
      />
    </div>
  );
}
