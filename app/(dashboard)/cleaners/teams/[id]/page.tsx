import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteButton } from '@/components/DeleteButton';
import { getTeam, getCleaners, getJobs } from '@/lib/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, Star } from 'lucide-react';

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const team = await getTeam(params.id);

  if (!team) {
    notFound();
  }

  // Fetch all cleaners to get member details
  const allCleaners = await getCleaners();
  const memberIds = team.fields.Members || [];
  const members = allCleaners.filter(c => memberIds.includes(c.id));
  const teamLeadId = team.fields['Team Lead']?.[0];
  const teamLead = teamLeadId ? allCleaners.find(c => c.id === teamLeadId) : null;

  // Calculate combined hourly rate
  const combinedHourlyRate = members.reduce((sum, m) => sum + (m.fields['Hourly Rate'] || 0), 0);

  // Fetch jobs assigned to this team
  const allJobs = await getJobs();
  const teamJobs = allJobs.filter(job => job.fields.Team?.includes(params.id))
    .sort((a, b) => {
      const dateA = a.fields.Date ? new Date(a.fields.Date).getTime() : 0;
      const dateB = b.fields.Date ? new Date(b.fields.Date).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cleaners/teams" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={team.fields['Team Name']}
          description={`${members.length} member${members.length !== 1 ? 's' : ''} • Combined rate: ${formatCurrency(combinedHourlyRate)}/hr`}
          actions={
            <div className="flex gap-2">
              <Link
                href={`/cleaners/teams/${team.id}/edit`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <DeleteButton
                id={team.id}
                type="team"
                name={team.fields['Team Name']}
                redirectTo="/cleaners/teams"
              />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Members */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members</h3>
              <div className="space-y-4">
                {members.length === 0 ? (
                  <p className="text-gray-500">No members in this team.</p>
                ) : (
                  members.map(member => (
                    <Link
                      key={member.id}
                      href={`/cleaners/${member.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary-100 rounded-full">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{member.fields.Name}</span>
                            {member.id === teamLeadId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Team Lead
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.fields['Experience Level'] || 'Junior'} • {member.fields.Phone}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(member.fields['Hourly Rate'] || 0)}/hr
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.fields['Jobs Completed'] || 0} jobs
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Team Jobs History */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job History</h3>
              {teamJobs.length === 0 ? (
                <p className="text-gray-500">No jobs assigned to this team yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teamJobs.slice(0, 10).map(job => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <Link href={`/jobs/${job.id}`} className="hover:text-primary-600">
                              {job.fields.Date ? format(new Date(job.fields.Date + 'T12:00:00'), 'MMM d, yyyy') : '-'}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {job.fields['Service Type']}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={job.fields.Status} />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatCurrency(job.fields['Total Cleaner Payout'] || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {teamJobs.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2 px-4">
                      Showing 10 of {teamJobs.length} jobs
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Status */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Status</h3>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={team.fields.Status || 'Active'} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Members</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {members.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Combined Hourly Rate</dt>
                  <dd className="mt-1 text-lg font-semibold text-green-600">
                    {formatCurrency(combinedHourlyRate)}/hr
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Jobs Completed</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {teamJobs.filter(j => j.fields.Status === 'Completed').length}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {team.fields.Notes && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{team.fields.Notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
