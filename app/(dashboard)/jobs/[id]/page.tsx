import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteJobButton } from '@/components/DeleteJobButton';
import { RescheduleButton } from '@/components/RescheduleButton';
import { MarkCompleteButton } from '@/components/MarkCompleteButton';
import { MarkPaidButton } from '@/components/MarkPaidButton';
import { CreateInvoiceButton } from '@/components/CreateInvoiceButton';
import { getJob, getClient, getCleaner } from '@/lib/airtable';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Edit, User, Phone, Mail, MapPin } from 'lucide-react';

// Helper to parse date strings correctly (avoids timezone issues)
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');
  }
  return parseISO(dateStr);
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job) {
    notFound();
  }

  // Fetch client and cleaner details
  const clientId = job.fields.Client?.[0];
  const cleanerIds = job.fields.Cleaner || [];

  const [client, ...cleaners] = await Promise.all([
    clientId ? getClient(clientId) : null,
    ...cleanerIds.map(id => getCleaner(id)),
  ]);

  // Filter out null cleaners
  const validCleaners = cleaners.filter(Boolean);
  const isTeamJob = validCleaners.length > 1;

  // Calculate totals for team jobs
  const totalHourlyRate = validCleaners.reduce((sum, c) => sum + (c?.fields['Hourly Rate'] || 0), 0);
  const actualHours = job.fields['Actual Hours'] || job.fields['Duration Hours'] || 0;
  const tipAmount = job.fields['Tip Amount'] || 0;
  const tipPerCleaner = isTeamJob && tipAmount
    ? tipAmount / validCleaners.length
    : tipAmount;

  // Calculate total team payout (sum of all cleaners' base pay + total tips)
  const totalTeamBasePay = totalHourlyRate * actualHours;
  const totalTeamPayout = totalTeamBasePay + tipAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const qualityScore = job.fields['Quality Score'] || 0;
  const qualityColor = qualityScore >= 80 ? 'text-green-600' : qualityScore >= 70 ? 'text-yellow-600' : 'text-red-600';
  const jobTitle = `Job #${job.fields['Job ID'] || job.id.slice(0, 8)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={jobTitle}
          description={job.fields.Date ? format(parseDate(job.fields.Date), 'MMMM d, yyyy') : 'No date set'}
          actions={
            <div className="flex gap-2">
              <MarkCompleteButton
                jobId={job.id}
                jobTitle={jobTitle}
                currentStatus={job.fields.Status}
                currentTip={job.fields['Tip Amount']}
                cleanerCount={validCleaners.length}
              />
              <MarkPaidButton
                jobId={job.id}
                jobTitle={jobTitle}
                currentPaymentStatus={job.fields['Payment Status'] || 'Pending'}
                currentCleanerPaid={job.fields['Cleaner Paid'] || false}
                amountCharged={job.fields['Amount Charged'] || 0}
                cleanerPayout={totalTeamPayout}
              />
              <CreateInvoiceButton
                jobId={job.id}
                clientId={clientId}
                serviceDate={job.fields.Date || ''}
                serviceType={job.fields['Service Type']}
                hours={job.fields['Actual Hours'] || job.fields['Duration Hours'] || 0}
                rate={job.fields['Client Hourly Rate'] || 50}
              />
              <RescheduleButton
                jobId={job.id}
                clientId={job.fields.Client?.[0] || ''}
                currentDate={job.fields.Date || ''}
              />
              <Link
                href={`/jobs/${job.id}/edit`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
              <DeleteJobButton
                jobId={job.id}
                jobTitle={jobTitle}
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
                    {job.fields.Date && format(parseDate(job.fields.Date), 'MMMM d, yyyy')}
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

          {/* Cleaning Checklist */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Cleaning Checklist</h3>
                <span className="text-sm text-gray-500">
                  {job.fields['Checklist Items Completed'] || 0}/{job.fields['Checklist Items Total'] || 0} completed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Standard checklist items based on service type */}
                {(() => {
                  const serviceType = job.fields['Service Type'];
                  const baseItems = [
                    'Kitchen - counters & appliances',
                    'Kitchen - sink & dishes',
                    'Bathrooms - toilets & showers',
                    'Bathrooms - sinks & mirrors',
                    'Bedrooms - dusting & making beds',
                    'Living areas - dusting & tidying',
                    'Floors - vacuum/sweep',
                    'Floors - mop hard surfaces',
                  ];
                  const deepCleanItems = [
                    ...baseItems,
                    'Inside oven',
                    'Inside refrigerator',
                    'Inside cabinets/drawers',
                    'Baseboards & trim',
                  ];
                  const moveOutItems = [
                    ...deepCleanItems,
                    'Inside closets',
                    'Light fixtures',
                    'Window tracks & sills',
                  ];

                  const items = serviceType === 'Move-In-Out' ? moveOutItems :
                               serviceType === 'Deep Clean' ? deepCleanItems : baseItems;
                  const completed = job.fields['Checklist Items Completed'] || 0;

                  return items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                        index < completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {index < completed && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${index < completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item}
                      </span>
                    </div>
                  ));
                })()}
              </div>
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
          {/* Client Info */}
          {client && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">Client</h3>
                  <Link href={`/clients/${client.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                    View Profile
                  </Link>
                </div>
                <dl className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-900">{client.fields.Name}</span>
                  </div>
                  {client.fields.Phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <a href={`tel:${client.fields.Phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                        {client.fields.Phone}
                      </a>
                    </div>
                  )}
                  {client.fields.Email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${client.fields.Email}`} className="text-sm text-blue-600 hover:text-blue-800 break-all">
                        {client.fields.Email}
                      </a>
                    </div>
                  )}
                  {client.fields.Address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900">{client.fields.Address}</span>
                    </div>
                  )}
                </dl>
                {client.fields['Entry Instructions'] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <dt className="text-sm font-medium text-gray-500 mb-1">Entry Instructions</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{client.fields['Entry Instructions']}</dd>
                  </div>
                )}
                {client.fields.Preferences && (
                  <div className={`${client.fields['Entry Instructions'] ? 'mt-3' : 'mt-4 pt-4 border-t border-gray-200'}`}>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Client Preferences</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">{client.fields.Preferences}</dd>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cleaner(s) Info */}
          {validCleaners.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">
                  {isTeamJob ? `Cleaners (${validCleaners.length})` : 'Cleaner'}
                </h3>
                <div className="space-y-4">
                  {validCleaners.map((cleaner, index) => {
                    const cleanerHourlyRate = cleaner?.fields['Hourly Rate'] || 0;
                    const cleanerBasePay = cleanerHourlyRate * actualHours;
                    const cleanerTip = tipPerCleaner;
                    const cleanerTotal = cleanerBasePay + cleanerTip;

                    return (
                      <div key={cleaner?.id || index} className={`${index > 0 ? 'pt-4 border-t border-gray-200' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{cleaner?.fields.Name}</span>
                          </div>
                          <Link href={`/cleaners/${cleaner?.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                            View Profile
                          </Link>
                        </div>
                        <dl className="space-y-2 text-sm">
                          {cleaner?.fields.Phone && (
                            <div className="flex items-start gap-2">
                              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <a href={`tel:${cleaner.fields.Phone}`} className="text-blue-600 hover:text-blue-800">
                                {cleaner.fields.Phone}
                              </a>
                            </div>
                          )}
                          {cleaner?.fields.Email && (
                            <div className="flex items-start gap-2">
                              <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <a href={`mailto:${cleaner.fields.Email}`} className="text-blue-600 hover:text-blue-800 break-all">
                                {cleaner.fields.Email}
                              </a>
                            </div>
                          )}
                        </dl>
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Rate</span>
                            <span className="text-gray-900">{formatCurrency(cleanerHourlyRate)}/hr</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Base Pay</span>
                            <span className="text-gray-900">{formatCurrency(cleanerBasePay)}</span>
                          </div>
                          {(job.fields['Tip Amount'] || 0) > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Tip{isTeamJob ? ' (split)' : ''}</span>
                              <span className="text-gray-900">{formatCurrency(cleanerTip)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-semibold pt-1">
                            <span className="text-gray-700">Payout</span>
                            <span className="text-green-600">{formatCurrency(cleanerTotal)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {isTeamJob && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">Total Team Payout</span>
                      <span className="text-green-600">{formatCurrency(totalTeamPayout)}</span>
                    </div>
                    {(job.fields['Tip Amount'] || 0) > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Tip of {formatCurrency(job.fields['Tip Amount'] || 0)} split evenly between {validCleaners.length} cleaners
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

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
                      Paid on {format(parseDate(job.fields['Client Paid Date']), 'MMM d, yyyy')}
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
                      Paid on {format(parseDate(job.fields['Cleaner Paid Date']), 'MMM d, yyyy')}
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