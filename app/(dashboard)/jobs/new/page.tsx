'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { JobForm } from '@/components/JobForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
      }

      // Success - redirect to jobs list
      router.push('/jobs');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to save job:', err);
      setError(err.message);
      throw err; // Re-throw so JobForm can handle loading state
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="New Job"
          description="Create a new cleaning job and assign it to a cleaner"
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <JobForm
        onSave={handleSave}
        onCancel={() => router.push('/jobs')}
      />
    </div>
  );
}
