'use client';

import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import type { Job } from '@/types/airtable';

// Helper to parse date strings correctly (avoids timezone issues)
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');
  }
  return parseISO(dateStr);
};

interface UpcomingJobsTableProps {
  jobs: Job[];
  clientMap: Map<string, string>;
  cleanerMap: Map<string, string>;
}

export function UpcomingJobsTable({ jobs, clientMap, cleanerMap }: UpcomingJobsTableProps) {
  const router = useRouter();

  return (
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
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cleaner
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
          {jobs.slice(0, 10).map((job) => {
            const clientName = job.fields.Client?.[0] ? clientMap.get(job.fields.Client[0]) : null;
            const cleanerName = job.fields.Cleaner?.[0] ? cleanerMap.get(job.fields.Cleaner[0]) : null;

            return (
              <tr
                key={job.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.fields.Date ? format(parseDate(job.fields.Date), 'MM-dd-yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {job.fields.Time || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {clientName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cleanerName ? (
                    <span>{cleanerName}</span>
                  ) : (
                    <span className="text-orange-600 font-medium">Unassigned</span>
                  )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}