'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Job, Cleaner } from '@/types/airtable';

interface EnrichedJob extends Job {
  clientName: string;
  cleanerName: string;
}

const DEFAULT_CLEANER_COLOR = '#6B7280';

export default function CalendarMonthlyPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(r => r.json()),
      fetch('/api/cleaners').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([jobsData, cleanersData, clientsData]) => {
      // Create lookup maps
      const clientMap = new Map(clientsData.map((c: any) => [c.id, c.fields.Name]));
      const cleanerMap = new Map(cleanersData.map((c: any) => [c.id, c.fields.Name]));

      // Enrich jobs with client and cleaner names
      const enrichedJobs = jobsData.map((job: Job) => ({
        ...job,
        clientName: job.fields.Client?.[0] ? clientMap.get(job.fields.Client[0]) || 'Unknown' : 'Unknown',
        cleanerName: job.fields.Cleaner?.[0] ? cleanerMap.get(job.fields.Cleaner[0]) || 'Unassigned' : 'Unassigned',
      }));

      setJobs(enrichedJobs);
      setCleaners(cleanersData);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load calendar data:', error);
      setLoading(false);
    });
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filter jobs for current month
  const monthJobs = jobs.filter(job => {
    if (!job.fields.Date) return false;
    const jobDate = parseISO(job.fields.Date);
    return jobDate >= monthStart && jobDate <= monthEnd;
  });

  // Group jobs by day
  const jobsByDay = new Map<string, EnrichedJob[]>();
  jobs.forEach(job => {
    if (!job.fields.Date) return;
    const dayKey = format(parseISO(job.fields.Date), 'yyyy-MM-dd');
    if (!jobsByDay.has(dayKey)) {
      jobsByDay.set(dayKey, []);
    }
    jobsByDay.get(dayKey)!.push(job);
  });

  // Calculate month stats
  const totalJobs = monthJobs.length;
  const totalRevenue = monthJobs.reduce((sum, job) => sum + (job.fields['Amount Charged'] || 0), 0);
  const avgJobsPerDay = monthJobs.length > 0 ? (monthJobs.length / 30).toFixed(1) : '0.0';
  const unassignedJobs = monthJobs.filter(job => !job.fields.Cleaner || job.fields.Cleaner.length === 0).length;

  // Build cleaner color map from cleaner records
  const cleanerColorMap = new Map<string, string>();
  cleaners.forEach(cleaner => {
    cleanerColorMap.set(cleaner.id, cleaner.fields.Color || DEFAULT_CLEANER_COLOR);
  });

  // Get cleaner color by cleaner ID
  const getCleanerColor = (cleanerId: string | undefined): string => {
    if (!cleanerId) return DEFAULT_CLEANER_COLOR;
    return cleanerColorMap.get(cleanerId) || DEFAULT_CLEANER_COLOR;
  };

  const getCleanerInitial = (cleanerName: string): string => {
    return cleanerName.charAt(0).toUpperCase();
  };

  // Navigation
  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar - Monthly View"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/calendar/daily">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Daily
              </button>
            </Link>
            <Link href="/calendar/weekly">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Weekly
              </button>
            </Link>
          </div>
        }
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
          >
            Today
          </button>
          <div className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          {format(currentMonth, 'MMMM yyyy')} Summary
        </h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600 font-semibold text-2xl">{totalJobs}</div>
            <div className="text-blue-800">Total Jobs</div>
          </div>
          <div>
            <div className="text-blue-600 font-semibold text-2xl">${totalRevenue.toLocaleString()}</div>
            <div className="text-blue-800">Total Revenue</div>
          </div>
          <div>
            <div className="text-blue-600 font-semibold text-2xl">{avgJobsPerDay}</div>
            <div className="text-blue-800">Avg Jobs/Day</div>
          </div>
          <div>
            <div className={`font-semibold text-2xl ${unassignedJobs > 0 ? 'text-yellow-600' : 'text-blue-600'}`}>
              {unassignedJobs}
            </div>
            <div className="text-blue-800">Unassigned Jobs</div>
          </div>
        </div>
      </div>

      {/* Monthly Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayJobs = jobsByDay.get(dayKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const hasUnassigned = dayJobs.some(job => !job.fields.Cleaner || job.fields.Cleaner.length === 0);
            const isOverbooked = dayJobs.length > 6;

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${
                  isToday ? 'bg-blue-50' : ''
                } ${
                  isOverbooked ? 'border-red-300 border-2' : ''
                }`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    !isCurrentMonth ? 'text-gray-400' :
                    isToday ? 'text-blue-600 text-lg' :
                    'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {dayJobs.length > 0 && `${dayJobs.length} ${dayJobs.length === 1 ? 'job' : 'jobs'}`}
                  </span>
                </div>

                {/* Jobs List */}
                <div className="space-y-1">
                  {dayJobs.slice(0, 3).map(job => {
                    const color = getCleanerColor(job.fields.Cleaner?.[0]);
                    const initial = getCleanerInitial(job.cleanerName);
                    const isUnassigned = !job.fields.Cleaner || job.fields.Cleaner.length === 0;

                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="flex items-center gap-1 text-xs hover:bg-gray-100 p-1 rounded group"
                      >
                        {isUnassigned ? (
                          <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span className="truncate">
                          {job.clientName}
                          {!isUnassigned && (
                            <span className="text-gray-500 ml-1">({initial})</span>
                          )}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Show more indicator */}
                  {dayJobs.length > 3 && (
                    <Link
                      href={`/calendar/daily?date=${dayKey}`}
                      className="text-xs text-blue-600 hover:underline block pl-4"
                    >
                      + {dayJobs.length - 3} more
                    </Link>
                  )}
                </div>

                {/* Unassigned indicator */}
                {hasUnassigned && (
                  <div className="mt-1 text-xs text-yellow-700">
                    ⚠️ Unassigned
                  </div>
                )}

                {/* Overbooked indicator */}
                {isOverbooked && (
                  <div className="mt-1 text-xs text-red-700 font-semibold">
                    🔴 Overbooked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-3">Cleaner Legend</h3>
        <div className="flex flex-wrap gap-4">
          {cleaners.filter(c => c.fields.Status === 'Active').map(cleaner => {
            const color = cleaner.fields.Color || DEFAULT_CLEANER_COLOR;
            const initial = getCleanerInitial(cleaner.fields.Name || '');
            const cleanerJobs = monthJobs.filter(job =>
              job.fields.Cleaner && job.fields.Cleaner[0] === cleaner.id
            );

            return (
              <div key={cleaner.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">
                  {cleaner.fields.Name} ({initial})
                  <span className="text-gray-500 ml-1">
                    - {cleanerJobs.length} {cleanerJobs.length === 1 ? 'job' : 'jobs'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold mb-2 text-sm">Indicators</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Unassigned job (needs cleaner)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-300 rounded" />
              <span>🔴 Overbooked day (more than 6 jobs)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 rounded" />
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
