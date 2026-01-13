'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Team } from '@/types/airtable';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const teamColumns: Column<Team>[] = [
    {
      key: 'Team Name',
      label: 'Team Name',
      render: (team) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="font-medium text-gray-900">{team.fields['Team Name']}</div>
        </div>
      ),
    },
    {
      key: 'Members',
      label: 'Members',
      render: (team) => {
        const memberNames = team.fields['Member Names'] || [];
        const memberCount = team.fields['Member Count'] || memberNames.length || 0;
        return (
          <div>
            <div className="font-medium">{memberCount} cleaner{memberCount !== 1 ? 's' : ''}</div>
            {memberNames.length > 0 && (
              <div className="text-sm text-gray-500">
                {memberNames.slice(0, 3).join(', ')}
                {memberNames.length > 3 && ` +${memberNames.length - 3} more`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'Team Lead',
      label: 'Team Lead',
      render: (team) => {
        const leadName = team.fields['Team Lead'];
        if (!leadName || leadName.length === 0) {
          return <span className="text-gray-400">Not assigned</span>;
        }
        return <span className="text-gray-900">{leadName}</span>;
      },
    },
    {
      key: 'Total Hourly Rate',
      label: 'Combined Rate',
      render: (team) => {
        const rate = team.fields['Total Hourly Rate'];
        if (!rate) return '-';
        return <span className="font-medium">{formatCurrency(rate)}/hr</span>;
      },
    },
    {
      key: 'Status',
      label: 'Status',
      render: (team) => <StatusBadge status={team.fields.Status || 'Active'} />,
    },
  ];

  const filteredTeams = teams.filter((team) => {
    if (filter === 'active') return team.fields.Status === 'Active' || !team.fields.Status;
    if (filter === 'inactive') return team.fields.Status === 'Inactive';
    return true; // 'all'
  });

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description={`${filteredTeams.length} cleaner team${filteredTeams.length !== 1 ? 's' : ''}`}
        actions={
          <Link
            href="/cleaners/teams/new"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Team
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <div className="flex space-x-2">
          {['all', 'active', 'inactive'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === filterOption
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filteredTeams}
        columns={teamColumns}
        getRowHref={(team) => `/cleaners/teams/${team.id}`}
        emptyMessage="No teams found. Create your first team to group cleaners together for jobs."
      />
    </div>
  );
}
