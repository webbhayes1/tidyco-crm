import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteButton } from '@/components/DeleteButton';
import { PreferredCleanerSection } from '@/components/PreferredCleanerSection';
import { getClient, getJobs, getCleaners } from '@/lib/airtable';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Star, Calendar, Clock, DollarSign } from 'lucide-react';

// Helper to parse date strings correctly (avoids timezone issues)
// Adding T12:00:00 ensures the date displays correctly in any timezone
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  // If it's just a date (YYYY-MM-DD), add noon time to avoid timezone shifts
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');
  }
  return parseISO(dateStr);
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id);

  if (!client) {
    notFound();
  }

  // Fetch jobs and cleaners for this client
  const [allJobs, cleaners] = await Promise.all([getJobs(), getCleaners()]);
  const clientJobs = allJobs.filter(job =>
    job.fields.Client?.includes(params.id)
  ).sort((a, b) => {
    const dateA = a.fields.Date ? parseDate(a.fields.Date).getTime() : 0;
    const dateB = b.fields.Date ? parseDate(b.fields.Date).getTime() : 0;
    return dateA - dateB; // Oldest/soonest first, most future at bottom
  });

  // Split jobs into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upcoming jobs (future, not cancelled) - sorted soonest first
  const upcomingJobs = clientJobs
    .filter(job => {
      if (!job.fields.Date) return false;
      const jobDate = parseDate(job.fields.Date);
      return jobDate >= today && job.fields.Status !== 'Cancelled';
    })
    .sort((a, b) => {
      const dateA = parseDate(a.fields.Date!).getTime();
      const dateB = parseDate(b.fields.Date!).getTime();
      return dateA - dateB; // Soonest first
    });
  const nextJob = upcomingJobs[0];

  // Past jobs (before today or completed) - sorted most recent first
  const pastJobs = clientJobs
    .filter(job => {
      if (!job.fields.Date) return false;
      const jobDate = parseDate(job.fields.Date);
      return jobDate < today || job.fields.Status === 'Completed';
    })
    .sort((a, b) => {
      const dateA = parseDate(a.fields.Date!).getTime();
      const dateB = parseDate(b.fields.Date!).getTime();
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
        <Link href="/clients" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={client.fields.Name}
          description={`Client since ${client.fields['First Booking Date'] ? format(parseDate(client.fields['First Booking Date']), 'MMMM yyyy') : 'Unknown'}`}
          actions={
            <div className="flex gap-2">
              <Link
                href={`/clients/${client.id}/edit`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <DeleteButton
                id={client.id}
                type="client"
                name={client.fields.Name}
                redirectTo="/clients"
              />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <dl className="space-y-3">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${client.fields.Email}`} className="text-primary-600 hover:text-primary-500">
                        {client.fields.Email}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${client.fields.Phone}`} className="text-primary-600 hover:text-primary-500">
                        {client.fields.Phone}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {client.fields.Address}
                      {client.fields['Zip Code'] && `, ${client.fields['Zip Code']}`}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Client Stats */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Bookings</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {client.fields['Total Bookings'] || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lifetime Value</dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-600">
                    {formatCurrency(client.fields['Total Lifetime Value'] || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900 flex items-center">
                    {client.fields.Rating?.toFixed(1) || '-'}
                    {client.fields.Rating && <Star className="h-5 w-5 text-yellow-400 ml-1" fill="currentColor" />}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upcoming Bookings ({upcomingJobs.length})
              </h3>
              {upcomingJobs.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {upcomingJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Link href={`/jobs/${job.id}`} className="text-primary-600 hover:text-primary-500">
                              {job.fields.Date ? format(parseDate(job.fields.Date!), 'MMM d, yyyy') : '-'}
                            </Link>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.fields['Service Type']}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <StatusBadge status={job.fields.Status} />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(job.fields['Amount Charged'] || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming bookings</p>
              )}
            </div>
          </div>

          {/* Booking History (Past) */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Booking History ({pastJobs.length})
              </h3>
              {pastJobs.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pastJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Link href={`/jobs/${job.id}`} className="text-primary-600 hover:text-primary-500">
                              {job.fields.Date ? format(parseDate(job.fields.Date!), 'MMM d, yyyy') : '-'}
                            </Link>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.fields['Service Type']}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <StatusBadge status={job.fields.Status} />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(job.fields['Amount Charged'] || 0)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {job.fields['Client Rating'] ? (
                              <span className="flex items-center">
                                {job.fields['Client Rating']}
                                <Star className="h-4 w-4 text-yellow-400 ml-1" fill="currentColor" />
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No past bookings</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {client.fields.Notes && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{client.fields.Notes}</p>
              </div>
            </div>
          )}

          {/* Preferences */}
          {client.fields.Preferences && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{client.fields.Preferences}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preferred Cleaner */}
          <PreferredCleanerSection
            clientId={client.id}
            preferredCleanerId={client.fields['Preferred Cleaner']?.[0]}
            preferredCleanerName={
              client.fields['Preferred Cleaner']?.[0]
                ? cleaners.find(c => c.id === client.fields['Preferred Cleaner']?.[0])?.fields.Name
                : undefined
            }
            cleaners={cleaners}
          />

          {/* Cleaning Schedule */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-tidyco-blue" />
                Cleaning Schedule
              </h3>

              {client.fields['Is Recurring'] ? (
                <div className="space-y-4">
                  {/* Recurring Schedule */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      {client.fields['Recurrence Frequency'] || 'Recurring'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {client.fields['Recurring Days'] || client.fields['Recurring Day'] || 'Days not set'}
                    </p>
                    {(client.fields['Recurring Start Time'] || client.fields['Recurring End Time']) && (
                      <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {client.fields['Recurring Start Time']} - {client.fields['Recurring End Time']}
                      </p>
                    )}
                  </div>

                  {/* Next Scheduled Cleaning */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Next Cleaning</p>
                    {nextJob ? (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(parseDate(nextJob.fields.Date!), 'EEEE, MMM d')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {nextJob.fields.Time}
                              {nextJob.fields['Amount Charged'] && ` • ${formatCurrency(nextJob.fields['Amount Charged'])}`}
                            </p>
                          </div>
                          <Link
                            href={`/jobs/${nextJob.id}/edit`}
                            className="text-tidyco-blue hover:text-tidyco-navy text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <StatusBadge status={nextJob.fields.Status} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No upcoming cleanings scheduled</p>
                    )}
                  </div>

                  {/* Upcoming Jobs List */}
                  {upcomingJobs.length > 1 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        More Upcoming ({upcomingJobs.length - 1})
                      </p>
                      <div className="space-y-2">
                        {upcomingJobs.slice(1, 4).map(job => (
                          <Link
                            key={job.id}
                            href={`/jobs/${job.id}`}
                            className="block text-sm text-gray-600 hover:text-tidyco-blue"
                          >
                            {format(parseDate(job.fields.Date!), 'MMM d')} - {job.fields.Time}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recurring schedule set</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          {(client.fields['Pricing Type'] || client.fields['Charge Per Cleaning'] || client.fields['Client Hourly Rate']) && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Pricing
                </h3>
                <div className="bg-green-50 p-3 rounded-lg">
                  {client.fields['Pricing Type'] === 'Hourly Rate' ? (
                    <>
                      <p className="text-sm font-medium text-green-800">Hourly Rate</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(client.fields['Client Hourly Rate'] || 0)}/hr
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-green-800">Per Cleaning</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(client.fields['Charge Per Cleaning'] || 0)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Client Status */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Status</h3>
              <StatusBadge status={client.fields.Status || 'Active'} />
              {client.fields['Last Booking Date'] && (
                <p className="mt-2 text-sm text-gray-500">
                  Last booking: {format(parseDate(client.fields['Last Booking Date']!), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.fields.Owner || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Source</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.fields['Lead Source'] || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.fields['Preferred Payment Method'] || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Has Left Review</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.fields['Has Left Review'] ? '✓ Yes' : '✗ No'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
