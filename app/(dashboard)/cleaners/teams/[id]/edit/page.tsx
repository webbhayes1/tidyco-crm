'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { TeamForm } from '@/components/TeamForm';
import type { Team } from '@/types/airtable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditTeamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const response = await fetch(`/api/teams/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch team');
        const data = await response.json();
        setTeam(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [params.id]);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch(`/api/teams/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update team');
      }

      // Success - redirect to team detail
      router.push(`/cleaners/teams/${params.id}`);
      router.refresh();
    } catch (err: any) {
      console.error('Failed to update team:', err);
      setError(err.message);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading team...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/cleaners/teams" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PageHeader title="Error" description="" />
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h1 className="text-xl font-bold text-red-800 mb-2">Error</h1>
          <p className="text-red-700">{error || 'Team not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/cleaners/teams/${params.id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title="Edit Team"
          description={team.fields['Team Name']}
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <TeamForm
        team={team}
        onSave={handleSave}
        onCancel={() => router.push(`/cleaners/teams/${params.id}`)}
      />
    </div>
  );
}
