'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { CleanerForm } from '@/components/CleanerForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCleanerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch('/api/cleaners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create cleaner');
      }

      // Success - redirect to cleaners list
      router.push('/cleaners');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to save cleaner:', err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cleaners" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="New Cleaner"
          description="Add a new cleaner to your team"
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <CleanerForm
        onSave={handleSave}
        onCancel={() => router.push('/cleaners')}
      />
    </div>
  );
}
