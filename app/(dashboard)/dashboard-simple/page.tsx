import { getDashboardMetrics } from '@/lib/airtable';

export default async function SimpleDashboardPage() {
  try {
    const metrics = await getDashboardMetrics();

    return (
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-tidyco-navy">Simple Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Upcoming Jobs</h3>
            <p className="text-3xl font-bold text-tidyco-navy mt-2">{metrics.upcomingJobsCount}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-tidyco-navy mt-2">
              ${metrics.monthlyRevenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Active Clients</h3>
            <p className="text-3xl font-bold text-tidyco-navy mt-2">{metrics.activeClientsCount}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-600">Active Cleaners</h3>
            <p className="text-3xl font-bold text-tidyco-navy mt-2">{metrics.activeCleanersCount}</p>
            <p className="text-sm text-gray-600 mt-1">Avg Score: {metrics.avgQualityScore}</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">✅ Dashboard loaded successfully!</p>
          <p className="text-sm text-green-700 mt-1">Airtable connection is working.</p>
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
