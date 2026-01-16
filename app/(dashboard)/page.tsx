import Link from 'next/link';
import { Briefcase, Users, UserCheck, DollarSign, Plus, UserPlus, Sparkles, AlertTriangle } from 'lucide-react';
import { getDashboardMetrics, getUpcomingJobs, getClients, getCleaners, getJobs } from '@/lib/airtable';
import { UpcomingJobsTable } from '@/components/UpcomingJobsTable';

export default async function WorkingDashboardPage() {
  try {
    const [metrics, upcomingJobs, clients, cleaners, allJobs] = await Promise.all([
      getDashboardMetrics(),
      getUpcomingJobs(),
      getClients(),
      getCleaners(),
      getJobs(),
    ]);

    // Create lookup maps for client and cleaner names
    const clientMap = new Map(clients.map(c => [c.id, c.fields.Name]));
    const cleanerMap = new Map(cleaners.map(c => [c.id, c.fields.Name]));

    // Calculate urgent matters
    const activeClients = clients.filter(c => c.fields.Status === 'Active' || !c.fields.Status);
    const clientsWithoutCleaner = activeClients.filter(c => !c.fields['Preferred Cleaner']?.length);
    const unassignedJobs = upcomingJobs.filter(j => !j.fields.Cleaner?.length);
    const completedUnpaidJobs = allJobs.filter(j =>
      j.fields.Status === 'Completed' &&
      j.fields['Payment Status'] !== 'Paid'
    );

    const hasUrgentMatters = clientsWithoutCleaner.length > 0 || unassignedJobs.length > 0 || completedUnpaidJobs.length > 0;

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
            <div className="mt-4 sm:ml-16 sm:mt-0 flex gap-2">
              <Link
                href="/jobs/new"
                className="inline-flex items-center rounded-md bg-tidyco-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-tidyco-navy"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Link>
              <Link
                href="/clients/new"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-tidyco-navy shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New Client
              </Link>
              <Link
                href="/cleaners/new"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-tidyco-navy shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New Cleaner
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
          <Link href="/finances" className="block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-5 sm:p-6 hover:border-tidyco-blue hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-tidyco-navy">
                    {formatCurrency(metrics.expectedMonthlyRevenue)}
                  </dd>
                  <p className="mt-1 text-sm text-gray-500">
                    {metrics.thisMonthJobsCount} jobs scheduled
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-tidyco-blue" />
                </div>
              </div>
            </div>
          </Link>

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

        {/* Urgent Matters Box */}
        {hasUrgentMatters && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-orange-800">Needs Attention</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {clientsWithoutCleaner.length > 0 && (
                <Link href="/clients?filter=unassigned" className="block">
                  <div className="bg-white p-3 rounded-lg border border-orange-200 hover:border-orange-400 transition-colors">
                    <p className="text-2xl font-bold text-orange-600">{clientsWithoutCleaner.length}</p>
                    <p className="text-sm text-orange-800">Clients need cleaner assigned</p>
                  </div>
                </Link>
              )}
              {unassignedJobs.length > 0 && (
                <Link href="/jobs?filter=unassigned" className="block">
                  <div className="bg-white p-3 rounded-lg border border-orange-200 hover:border-orange-400 transition-colors">
                    <p className="text-2xl font-bold text-orange-600">{unassignedJobs.length}</p>
                    <p className="text-sm text-orange-800">Upcoming jobs unassigned</p>
                  </div>
                </Link>
              )}
              {completedUnpaidJobs.length > 0 && (
                <Link href="/jobs?filter=completed" className="block">
                  <div className="bg-white p-3 rounded-lg border border-red-200 hover:border-red-400 transition-colors">
                    <p className="text-2xl font-bold text-red-600">{completedUnpaidJobs.length}</p>
                    <p className="text-sm text-red-800">Completed jobs awaiting payment</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Jobs Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-tidyco-navy">Upcoming Jobs</h2>
            <Link href="/jobs" className="text-sm font-medium text-tidyco-blue hover:text-tidyco-navy">
              View all →
            </Link>
          </div>

          <UpcomingJobsTable
            jobs={upcomingJobs}
            clientMap={clientMap}
            cleanerMap={cleanerMap}
          />
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