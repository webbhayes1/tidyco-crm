'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Job, Cleaner } from '@/types/airtable';

interface EnrichedJob extends Job {
  clientName: string;
  cleanerName: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm

// Parse time string (handles both "10:00 AM" and "14:00" formats)
const parseTimeToHour = (timeStr: string): number => {
  if (!timeStr) return 0;

  // Check for AM/PM format
  const isPM = timeStr.toLowerCase().includes('pm');
  const isAM = timeStr.toLowerCase().includes('am');

  // Remove AM/PM and trim
  const cleanTime = timeStr.replace(/\s*(am|pm)\s*/i, '').trim();
  const [hoursStr] = cleanTime.split(':');
  let hours = parseInt(hoursStr, 10);

  // Convert 12-hour to 24-hour
  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours;
};

const CLEANER_COLORS: Record<string, string> = {
  'Alice': '#4285F4',
  'Bob': '#0B8043',
  'Charlie': '#F6BF26',
  'Diana': '#E67C73',
  'Evan': '#9E69AF',
};

export default function CalendarWeeklyPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(r => r.json()),
      fetch('/api/cleaners').then(r => r.json()),
    ]).then(([jobsData, cleanersData]) => {
      setJobs(jobsData);
      setCleaners(cleanersData);
      setLoading(false);
    });
  }, []);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter jobs for current week
  const weekJobs = jobs.filter(job => {
    if (!job.fields.Date) return false;
    const jobDate = new Date(job.fields.Date);
    return jobDate >= weekStart && jobDate <= weekEnd;
  });

  // Group jobs by day and hour
  const jobsByDayHour = new Map<string, Map<number, EnrichedJob[]>>();
  weekJobs.forEach(job => {
    const jobDate = new Date(job.fields.Date!);
    const dayKey = format(jobDate, 'yyyy-MM-dd');

    if (!jobsByDayHour.has(dayKey)) {
      jobsByDayHour.set(dayKey, new Map());
    }

    const startTime = job.fields.Time;
    if (startTime) {
      const hours = parseTimeToHour(startTime);
      const hourMap = jobsByDayHour.get(dayKey)!;

      if (!hourMap.has(hours)) {
        hourMap.set(hours, []);
      }
      hourMap.get(hours)!.push(job);
    }
  });

  // Calculate week stats
  const totalJobs = weekJobs.length;
  const totalRevenue = weekJobs.reduce((sum, job) => sum + (job.fields['Amount Charged'] || 0), 0);
  const busiestDay = weekDays.reduce((busiest, day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayJobCount = weekJobs.filter(job =>
      format(new Date(job.fields.Date!), 'yyyy-MM-dd') === dayKey
    ).length;

    const busiestCount = weekJobs.filter(job =>
      format(new Date(job.fields.Date!), 'yyyy-MM-dd') === format(busiest, 'yyyy-MM-dd')
    ).length;

    return dayJobCount > busiestCount ? day : busiest;
  }, weekDays[0]);

  // Get cleaner color
  const getCleanerColor = (cleanerName: string): string => {
    const colors = Object.keys(CLEANER_COLORS);
    const matchedColor = colors.find(name => cleanerName.includes(name));
    if (matchedColor) {
      return CLEANER_COLORS[matchedColor];
    }
    return '#6B7280';
  };

  // Navigation
  const goToPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

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
        title="Calendar - Weekly View"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/calendar/daily">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Daily
              </button>
            </Link>
            <Link href="/calendar/monthly">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Monthly
              </button>
            </Link>
          </div>
        }
      />

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <button
          onClick={goToPrevWeek}
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
            {format(weekStart, 'MMMM d')} - {format(weekEnd, 'd, yyyy')}
          </div>
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Week Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600 font-semibold text-2xl">{totalJobs}</div>
            <div className="text-blue-800">Total Jobs</div>
          </div>
          <div>
            <div className="text-blue-600 font-semibold text-2xl">${totalRevenue}</div>
            <div className="text-blue-800">Total Revenue</div>
          </div>
          <div>
            <div className="text-blue-600 font-semibold text-2xl">
              {format(busiestDay, 'EEEE')}
            </div>
            <div className="text-blue-800">Busiest Day</div>
          </div>
          <div>
            <div className="text-blue-600 font-semibold text-2xl">
              {cleaners.filter(c => c.fields.Status === 'Active').length}
            </div>
            <div className="text-blue-800">Active Cleaners</div>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="grid grid-cols-8 min-w-[1200px]">
          {/* Header Row */}
          <div className="border-b border-gray-200 p-4 bg-gray-50 font-semibold">
            Time
          </div>
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={`border-b border-l border-gray-200 p-4 text-center ${
                isSameDay(day, new Date()) ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="font-semibold">{format(day, 'EEE')}</div>
              <div className={`text-2xl ${
                isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}

          {/* Time Rows */}
          {HOURS.map(hour => (
            <div key={hour} className="contents">
              {/* Hour Label */}
              <div className="border-b border-gray-200 p-4 bg-gray-50 text-sm text-gray-600">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>

              {/* Day Cells */}
              {weekDays.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const hourJobs = jobsByDayHour.get(dayKey)?.get(hour) || [];

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`border-b border-l border-gray-200 p-2 min-h-[100px] relative ${
                      isSameDay(day, new Date()) ? 'bg-blue-50 bg-opacity-30' : ''
                    }`}
                  >
                    {/* Lunch indicator (12pm) */}
                    {hour === 12 && (
                      <div className="absolute inset-0 bg-gray-100 opacity-30 pointer-events-none" />
                    )}

                    {/* Jobs */}
                    <div className="space-y-1">
                      {hourJobs.map(job => {
                        const color = getCleanerColor(job.cleanerName);
                        const duration = job.fields['Duration Hours'] || 2;

                        return (
                          <Link
                            key={job.id}
                            href={`/jobs/${job.id}`}
                            className="block p-2 rounded text-white text-xs hover:shadow-lg transition-shadow"
                            style={{
                              backgroundColor: color,
                              minHeight: `${duration * 20}px`
                            }}
                          >
                            <div className="font-semibold truncate">
                              {job.clientName}
                            </div>
                            <div className="truncate">
                              {job.fields['Service Type']?.replace(' Cleaning', '')}
                            </div>
                            <div className="truncate opacity-90">
                              {job.cleanerName}
                            </div>
                            <div className="truncate opacity-90">
                              ${job.fields['Amount Charged']}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-3">Cleaner Colors</h3>
        <div className="flex flex-wrap gap-4">
          {cleaners.filter(c => c.fields.Status === 'Active').map(cleaner => {
            const color = getCleanerColor(cleaner.fields.Name || '');
            const cleanerJobs = weekJobs.filter(job =>
              job.fields.Cleaner && job.fields.Cleaner[0] === cleaner.id
            );

            return (
              <div key={cleaner.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">
                  {cleaner.fields.Name}
                  <span className="text-gray-500 ml-1">
                    ({cleanerJobs.length} {cleanerJobs.length === 1 ? 'job' : 'jobs'})
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
