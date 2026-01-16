import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteButton } from '@/components/DeleteButton';
import { CleanerColorPicker } from '@/components/CleanerColorPicker';
import { CleanerJobsList } from '@/components/CleanerJobsList';
import { getCleaner, getJobs, getCleanerTraining } from '@/lib/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Edit, Mail, Phone, DollarSign } from 'lucide-react';

export default async function CleanerDetailPage({ params }: { params: { id: string } }) {
  const cleaner = await getCleaner(params.id);

  if (!cleaner) {
    notFound();
  }

  // Fetch jobs for this cleaner
  const allJobs = await getJobs();
  const cleanerJobs = allJobs.filter(job =>
    job.fields.Cleaner?.includes(params.id)
  ).sort((a, b) => {
    const dateA = a.fields.Date ? new Date(a.fields.Date).getTime() : 0;
    const dateB = b.fields.Date ? new Date(b.fields.Date).getTime() : 0;
    return dateB - dateA; // Most recent first
  });

  // Fetch training records for this cleaner
  const trainingRecords = await getCleanerTraining(params.id);
  const completedTraining = trainingRecords.filter(t => t.fields.Status === 'Completed').length;
  const totalTraining = trainingRecords.length;
  const trainingPercentage = totalTraining > 0 ? Math.round((completedTraining / totalTraining) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle Airtable NaN special values
  const rawScore = cleaner.fields['Average Quality Score'];
  const qualityScore = typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : 0;
  const qualityColor = qualityScore >= 80 ? 'text-green-600' : qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cleaners" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={cleaner.fields.Name}
          description={`${cleaner.fields['Experience Level'] || 'Junior'} Cleaner • ${cleaner.fields['Jobs Completed'] || 0} jobs completed`}
          actions={
            <div className="flex gap-2">
              <Link
                href={`/cleaners/${cleaner.id}/edit`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <DeleteButton
                id={cleaner.id}
                type="cleaner"
                name={cleaner.fields.Name}
                redirectTo="/cleaners"
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
                      <a href={`mailto:${cleaner.fields.Email}`} className="text-primary-600 hover:text-primary-500">
                        {cleaner.fields.Email}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${cleaner.fields.Phone}`} className="text-primary-600 hover:text-primary-500">
                        {cleaner.fields.Phone}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Zelle Payment Info</dt>
                    <dd className="mt-1 text-sm text-gray-900">{cleaner.fields['Zelle Payment Info']}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>

              {/* Quality Score */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Average Quality Score</span>
                  <span className={`text-2xl font-bold ${qualityColor}`}>{qualityScore.toFixed(0)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${qualityScore >= 80 ? 'bg-green-600' : qualityScore >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`}
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Jobs Completed</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {cleaner.fields['Jobs Completed'] || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Average Rating</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {typeof cleaner.fields['Average Rating'] === 'number' ? cleaner.fields['Average Rating'].toFixed(1) : '-'}/5
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Jobs Below 70</dt>
                  <dd className="mt-1 text-2xl font-semibold text-red-600">
                    {typeof cleaner.fields['Jobs Below 70 Score'] === 'number' ? cleaner.fields['Jobs Below 70 Score'] : 0}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Earnings</dt>
                  <dd className="mt-1 text-2xl font-semibold text-green-600">
                    {formatCurrency(typeof cleaner.fields['Total Earnings'] === 'number' ? cleaner.fields['Total Earnings'] : 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pending Payout</dt>
                  <dd className="mt-1 text-2xl font-semibold text-orange-600">
                    {formatCurrency(typeof cleaner.fields['Pending Payout'] === 'number' ? cleaner.fields['Pending Payout'] : 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Avg Tips</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {formatCurrency(typeof cleaner.fields['Average Tip Amount'] === 'number' ? cleaner.fields['Average Tip Amount'] : 0)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Training Progress */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Training Progress</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    {completedTraining} of {totalTraining} modules completed
                  </span>
                  <span className="text-sm font-bold text-primary-600">{trainingPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${trainingPercentage}%` }}
                  />
                </div>
              </div>
              {trainingRecords.length > 0 ? (
                <div className="space-y-2">
                  {trainingRecords.slice(0, 5).map((training) => (
                    <div key={training.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">{training.fields['Training Record']}</span>
                      <StatusBadge status={training.fields.Status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No training records</p>
              )}
            </div>
          </div>

          {/* Jobs */}
          <CleanerJobsList jobs={cleanerJobs} />

          {/* Notes */}
          {cleaner.fields.Notes && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{cleaner.fields.Notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Photo */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {cleaner.fields.Photo && cleaner.fields.Photo.length > 0 && (
                <img
                  src={cleaner.fields.Photo[0].url}
                  alt={cleaner.fields.Name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-base font-medium text-gray-900 mb-2">Status</h3>
              <StatusBadge status={cleaner.fields.Status || 'Active'} />
              {cleaner.fields['Last Job Date'] && (
                <p className="mt-2 text-sm text-gray-500">
                  Last job: {format(new Date(cleaner.fields['Last Job Date']), 'MMM d, yyyy')}
                </p>
              )}
              {/* Calendar Color */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-base font-medium text-gray-900 mb-2">Calendar Color</h3>
                <CleanerColorPicker
                  cleanerId={cleaner.id}
                  currentColor={cleaner.fields.Color}
                />
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Work Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      cleaner.fields['Experience Level'] === 'Senior'
                        ? 'bg-purple-100 text-purple-800'
                        : cleaner.fields['Experience Level'] === 'Mid-Level'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cleaner.fields['Experience Level'] || 'Junior'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(typeof cleaner.fields['Hourly Rate'] === 'number' ? cleaner.fields['Hourly Rate'] : 0)}/hr
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Active Jobs</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {typeof cleaner.fields['Active Jobs Count'] === 'number' ? cleaner.fields['Active Jobs Count'] : 0}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Availability */}
          {cleaner.fields.Availability && cleaner.fields.Availability.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Availability</h3>
                <div className="space-y-1">
                  {cleaner.fields.Availability.map((day) => (
                    <div key={day} className="text-sm text-gray-900">
                      {day}
                    </div>
                  ))}
                </div>
                {cleaner.fields['Preferred Hours'] && (
                  <p className="mt-3 text-sm text-gray-500">
                    Preferred hours: {cleaner.fields['Preferred Hours']}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Service Areas */}
          {cleaner.fields['Service Area Zip Codes'] && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900 mb-2">Service Areas</h3>
                <p className="text-sm text-gray-900">{cleaner.fields['Service Area Zip Codes']}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
