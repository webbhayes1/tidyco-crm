import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteJobButton } from '@/components/DeleteJobButton';
import { getJob } from '@/lib/airtable';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job) {
    notFound();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const qualityScore = job.fields['Quality Score'] || 0;
  const qualityColor = qualityScore >= 80 ? 'text-green-600' : qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={`Job #${job.fields['Job ID'] || job.id.slice(0, 8)}`}
          description={job.fields.Date ? format(new Date(job.fields.Date), 'MMMM d, yyyy') : 'No date set'}
          actions={
            <div className="flex gap-2">
              <Link
                href={`/jobs/${job.id}/edit`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <DeleteJobButton
                jobId={job.id}
                jobTitle={`Job #${job.fields['Job ID'] || job.id.slice(0, 8)}`}
              />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.fields['Service Type']}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={job.fields.Status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.fields.Date && format(new Date(job.fields.Date), 'MMMM d, yyyy')}
                    {job.fields.Time && ` at ${job.fields.Time}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.fields['Duration Hours'] || '-'} hours
                    {job.fields['Actual Hours'] && ` (Actual: ${job.fields['Actual Hours']}h)`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.fields.Address || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.fields.Bedrooms || 0} bed, {job.fields.Bathrooms || 0} bath
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Client Rate</dt>
                  <dd className="text-sm text-gray-900">
                    {formatCurrency(job.fields['Client Hourly Rate'] || 0)}/hr × {job.fields['Duration Hours'] || 0}h
                  </dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt>Amount Charged</dt>
                  <dd>{formatCurrency(job.fields['Amount Charged'] || 0)}</dd>
                </div>
                <div className="border-t border-gray-200 pt-3" />
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Cleaner Base Pay</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(job.fields['Cleaner Base Pay'] || 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Tips</dt>
                  <dd className="text-sm text-gray-900">{formatCurrency(job.fields['Tip Amount'] || 0)}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total Cleaner Payout</dt>
                  <dd>{formatCurrency(job.fields['Total Cleaner Payout'] || 0)}</dd>
                </div>
                <div className="border-t border-gray-200 pt-3" />
                <div className="flex justify-between text-base font-semibold text-green-600">
                  <dt>Profit</dt>
                  <dd>{formatCurrency(job.fields['Profit'] || 0)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quality Score */}
          {job.fields['Quality Score'] !== undefined && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Score</h3>
                <div className="text-center mb-4">
                  <div className={`text-5xl font-bold ${qualityColor}`}>
                    {qualityScore}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">out of 100</div>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Checklist</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {job.fields['Checklist Items Completed'] || 0}/{job.fields['Checklist Items Total'] || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Client Rating</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {job.fields['Client Rating'] || '-'}/5
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Photos</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {job.fields.Photos?.length || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">On-Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {job.fields['On-Time Arrival'] ? '✓ Yes' : '✗ No'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Notes */}
          {(job.fields.Notes || job.fields['Completion Notes'] || job.fields['Client Review']) && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes & Feedback</h3>
                <div className="space-y-4">
                  {job.fields.Notes && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Job Notes</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{job.fields.Notes}</dd>
                    </div>
                  )}
                  {job.fields['Completion Notes'] && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Completion Notes</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{job.fields['Completion Notes']}</dd>
                    </div>
                  )}
                  {job.fields['Client Review'] && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Client Feedback</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{job.fields['Client Review']}</dd>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Payment Status</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client Payment</dt>
                  <dd className="mt-1">
                    <StatusBadge status={job.fields['Payment Status'] || 'Pending'} />
                  </dd>
                  {job.fields['Client Paid Date'] && (
                    <dd className="mt-1 text-xs text-gray-500">
                      Paid on {format(new Date(job.fields['Client Paid Date']), 'MMM d, yyyy')}
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cleaner Payout</dt>
                  <dd className="mt-1">
                    {job.fields['Cleaner Paid'] ? (
                      <StatusBadge status="Paid" />
                    ) : (
                      <StatusBadge status="Pending" />
                    )}
                  </dd>
                  {job.fields['Cleaner Paid Date'] && (
                    <dd className="mt-1 text-xs text-gray-500">
                      Paid on {format(new Date(job.fields['Cleaner Paid Date']), 'MMM d, yyyy')}
                    </dd>
                  )}
                </div>
              </dl>
            </div>
          </div>

          {/* Confirmation Status */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4">Notifications</h3>
              <dl className="space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Client Confirmed</dt>
                  <dd className="text-sm">{job.fields['Confirmed to Client'] ? '✓' : '✗'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Cleaner Confirmed</dt>
                  <dd className="text-sm">{job.fields['Confirmed to Cleaner'] ? '✓' : '✗'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Reminder Sent</dt>
                  <dd className="text-sm">{job.fields['Reminder Sent'] ? '✓' : '✗'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Review Requested</dt>
                  <dd className="text-sm">{job.fields['Review Requested'] ? '✓' : '✗'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Photos */}
          {job.fields.Photos && job.fields.Photos.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Completion Photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {job.fields.Photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo.url}
                      alt={`Completion photo ${index + 1}`}
                      className="rounded-lg object-cover h-24 w-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}