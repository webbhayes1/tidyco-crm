'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ClientForm } from '@/components/ClientForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create client');
      }

      // Success - redirect to clients list
      router.push('/clients');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to save client:', err);
      setError(err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="New Client"
          description="Add a new client to your database"
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <ClientForm
        onSave={handleSave}
        onCancel={() => router.push('/clients')}
      />
    </div>
  );
}
