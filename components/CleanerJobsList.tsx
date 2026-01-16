'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';
import type { Job } from '@/types/airtable';

interface CleanerJobsListProps {
  jobs: Job[];
}

export function CleanerJobsList({ jobs }: CleanerJobsListProps) {
  const [timeframe, setTimeframe] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { filteredJobs, counts } = useMemo(() => {
    let upcoming = 0;
    let past = 0;

    jobs.forEach(job => {
      if (!job.fields.Date) return;
      const jobDate = new Date(job.fields.Date);
      jobDate.setHours(0, 0, 0, 0);
      if (jobDate >= today) {
        upcoming++;
      } else {
        past++;
      }
    });

    const filtered = jobs.filter(job => {
      if (!job.fields.Date) return timeframe === 'all';
      const jobDate = new Date(job.fields.Date);
      jobDate.setHours(0, 0, 0, 0);

      if (timeframe === 'upcoming') return jobDate >= today;
      if (timeframe === 'past') return jobDate < today;
      return true;
    }).sort((a, b) => {
      const dateA = a.fields.Date ? new Date(a.fields.Date).getTime() : 0;
      const dateB = b.fields.Date ? new Date(b.fields.Date).getTime() : 0;
      // For upcoming: soonest first (ascending)
      // For past: most recent first (descending)
      // For all: most recent first (descending)
      if (timeframe === 'upcoming') return dateA - dateB;
      return dateB - dateA;
    });

    return {
      filteredJobs: filtered,
      counts: { upcoming, past, all: jobs.length }
    };
  }, [jobs, timeframe, today]);

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Jobs ({filteredJobs.length})
          </h3>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeframe('upcoming')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'upcoming'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming ({counts.upcoming})
            </button>
            <button
              onClick={() => setTimeframe('past')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'past'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past ({counts.past})
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({counts.all})
            </button>
          </div>
        </div>

        {filteredJobs.length > 0 ? (
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
                    Payout
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Link href={`/jobs/${job.id}`} className="text-primary-600 hover:text-primary-500">
                        {job.fields.Date ? format(new Date(job.fields.Date), 'MMM d, yyyy') : '-'}
                      </Link>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.fields['Service Type']}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <StatusBadge status={job.fields.Status} />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(typeof job.fields['Total Cleaner Payout'] === 'number' ? job.fields['Total Cleaner Payout'] : 0)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      {typeof job.fields['Quality Score'] === 'number' ? (
                        <span className={`font-medium ${
                          job.fields['Quality Score'] >= 80 ? 'text-green-600' :
                          job.fields['Quality Score'] >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {job.fields['Quality Score']}
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
          <p className="text-sm text-gray-500">
            {timeframe === 'upcoming' ? 'No upcoming jobs scheduled' :
             timeframe === 'past' ? 'No past jobs' : 'No jobs yet'}
          </p>
        )}
      </div>
    </div>
  );
}
