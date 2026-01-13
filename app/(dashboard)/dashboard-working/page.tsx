import Link from 'next/link';
import { Briefcase, Users, UserCheck, DollarSign, Plus } from 'lucide-react';
import { getDashboardMetrics, getUpcomingJobs } from '@/lib/airtable';

export default async function WorkingDashboardPage() {
  try {
    const [metrics, upcomingJobs] = await Promise.all([
      getDashboardMetrics(),
      getUpcomingJobs(),
    ]);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-tidyco-navy">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Overview of your cleaning business</p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0">
              <Link
                href="/jobs/new"
                className="btn-primary inline-flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* This Week */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-tidyco-navy">
                  {metrics.thisWeekJobsCount}
                </dd>
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(metrics.thisWeekRevenue)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Briefcase className="h-8 w-8 text-tidyco-blue" />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-tidyco-navy">
                  {formatCurrency(metrics.expectedMonthlyRevenue)}
                </dd>
              </div>
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-tidyco-blue" />
              </div>
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Clients</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-tidyco-navy">
                  {metrics.activeClientsCount}
                </dd>
              </div>
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-tidyco-blue" />
              </div>
            </div>
          </div>

          {/* Active Cleaners */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Cleaners</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-tidyco-navy">
                  {metrics.activeCleanersCount}
                </dd>
                <p className="mt-1 text-sm text-gray-500">
                  Avg Score: {metrics.avgQualityScore || 'N/A'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-tidyco-blue" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Jobs Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-tidyco-navy">Upcoming Jobs</h2>
            <Link href="/jobs" className="text-sm font-medium text-tidyco-blue hover:text-tidyco-navy">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingJobs.slice(0, 10).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.fields.Date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.fields.Time || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.fields['Service Type']}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${job.fields.Status === 'Completed' ? 'bg-green-50 text-green-700' :
                          job.fields.Status === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                          job.fields.Status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'}
                      `}>
                        {job.fields.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">✅ Dashboard loaded successfully!</p>
          <p className="text-sm text-green-700 mt-1">
            Showing {metrics.thisMonthJobsCount} jobs, {metrics.activeClientsCount} clients, {metrics.activeCleanersCount} cleaners
          </p>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error Loading Dashboard</h1>
          <p className="text-red-700 mb-2"><strong>Message:</strong> {error.message}</p>
          <pre className="text-xs bg-red-100 p-4 rounded overflow-x-auto text-red-900">
            {error.stack}
          </pre>
        </div>
      </div>
    );
  }
}
