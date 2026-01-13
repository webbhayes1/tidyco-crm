'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Settings, Mail, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import type { Job, Cleaner } from '@/types/airtable';

interface EnrichedJob extends Job {
  clientName: string;
  cleanerName: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm
const CLEANER_COLORS = {
  'Alice': '#4285F4',
  'Bob': '#0B8043',
  'Charlie': '#F6BF26',
  'Diana': '#E67C73',
  'Evan': '#9E69AF',
};

export default function CalendarDailyPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showCleaners, setShowCleaners] = useState<Record<string, boolean>>({});
  const [showJobTypes, setShowJobTypes] = useState({
    'General Clean': true,
    'Deep Clean': true,
    'Move-In-Out': true,
  });
  const [showStatuses, setShowStatuses] = useState({
    scheduled: true,
    inProgress: true,
    unassigned: true,
    completed: false,
  });

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

      // Initialize cleaner visibility
      const cleanerVisibility: Record<string, boolean> = {};
      cleanersData.forEach((cleaner: Cleaner) => {
        cleanerVisibility[cleaner.id] = true;
      });
      setShowCleaners(cleanerVisibility);

      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load calendar data:', error);
      setLoading(false);
    });
  }, []);

  // Filter jobs for selected date with all filters applied
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayJobs = jobs.filter(job => {
    // Date filter
    if (!job.fields.Date) return false;
    const jobDate = format(new Date(job.fields.Date), 'yyyy-MM-dd');
    if (jobDate !== dateStr) return false;

    // Job type filter
    const serviceType = job.fields['Service Type'] || '';
    const typeKey = serviceType.includes('Deep') ? 'Deep Clean'
      : serviceType.includes('Move') ? 'Move-In-Out'
      : 'General Clean';
    if (!showJobTypes[typeKey as keyof typeof showJobTypes]) return false;

    // Status filter
    const status = job.fields.Status || '';
    const isUnassigned = !job.fields.Cleaner || job.fields.Cleaner.length === 0;
    const isCompleted = status === 'Completed';
    const isInProgress = status === 'In Progress';
    const isScheduled = status === 'Pending' || (!isCompleted && !isInProgress);

    if (isUnassigned && !showStatuses.unassigned) return false;
    if (isCompleted && !showStatuses.completed) return false;
    if (isInProgress && !showStatuses.inProgress) return false;
    if (isScheduled && !isUnassigned && !showStatuses.scheduled) return false;

    return true;
  });

  // Get unassigned jobs
  const unassignedJobs = todayJobs.filter(job =>
    !job.fields.Cleaner || job.fields.Cleaner.length === 0
  );

  // Get assigned jobs by cleaner
  const jobsByCleaner = new Map<string, EnrichedJob[]>();
  todayJobs.forEach(job => {
    if (job.fields.Cleaner && job.fields.Cleaner.length > 0) {
      const cleanerId = job.fields.Cleaner[0];
      if (!jobsByCleaner.has(cleanerId)) {
        jobsByCleaner.set(cleanerId, []);
      }
      jobsByCleaner.get(cleanerId)!.push(job);
    }
  });

  // Filter cleaners
  const visibleCleaners = cleaners.filter(cleaner =>
    showCleaners[cleaner.id] && cleaner.fields.Status === 'Active'
  );

  // Navigation handlers
  const goToPrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Parse time string (handles both "10:00 AM" and "14:00" formats)
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;

    // Check for AM/PM format
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');

    // Remove AM/PM and trim
    const cleanTime = timeStr.replace(/\s*(am|pm)\s*/i, '').trim();
    const [hoursStr, minutesStr] = cleanTime.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr || '0', 10);

    // Convert 12-hour to 24-hour
    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours + minutes / 60;
  };

  // Get job position and width
  const getJobPosition = (job: EnrichedJob) => {
    const startTime = job.fields.Time;
    const endTime = job.fields['End Time'];
    if (!startTime) return { left: 0, width: 0 };

    const startHour = parseTime(startTime);
    const endHour = endTime ? parseTime(endTime) : startHour + (job.fields['Duration Hours'] || 2);
    const duration = endHour - startHour;

    // Calculate position (each hour column is ~7.7% of width)
    const left = ((startHour - 7) / 13) * 100; // 7am = 0%, 8pm = 100%
    const width = (duration / 13) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get cleaner color
  const getCleanerColor = (cleanerName: string): string => {
    const colors = Object.keys(CLEANER_COLORS);
    const matchedColor = colors.find(name => cleanerName.includes(name));
    if (matchedColor) {
      return CLEANER_COLORS[matchedColor as keyof typeof CLEANER_COLORS];
    }
    return '#6B7280'; // Default gray
  };

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
        title="Calendar - Daily View"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/calendar/weekly">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Weekly
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

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={goToPrevDay}
          className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-5 py-2.5 text-tidyco-blue hover:bg-blue-50 rounded-lg font-semibold transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-3 text-xl font-bold text-tidyco-navy">
            <CalendarIcon className="w-6 h-6 text-tidyco-blue" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        <button
          onClick={goToNextDay}
          className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex gap-6">
        {/* Main Timeline Grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
          <div className="min-w-[1200px]">
            {/* Hour Headers */}
            <div className="flex border-b-2 border-gray-200 sticky top-0 bg-gradient-to-b from-gray-50 to-white z-10">
              <div className="w-40 flex-shrink-0 p-4 font-bold text-tidyco-navy border-r border-gray-200">
                Cleaner
              </div>
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="flex-1 min-w-[70px] p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                >
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
          </div>

          {/* Cleaner Rows */}
          {visibleCleaners.map(cleaner => {
            const cleanerJobs = jobsByCleaner.get(cleaner.id) || [];
            const cleanerName = cleaner.fields.Name || 'Unknown';
            const rating = typeof cleaner.fields['Average Quality Score'] === 'number'
              ? cleaner.fields['Average Quality Score']
              : 0;

            return (
              <div key={cleaner.id} className="flex border-b border-gray-200 last:border-b-0 hover:bg-gray-50/30 transition-colors">
                {/* Cleaner Info Column */}
                <div className="w-40 flex-shrink-0 p-4 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="font-bold text-sm text-tidyco-navy">{cleanerName}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                    <span>⭐</span>
                    <span className="font-semibold">{rating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5 font-medium">
                    {cleanerJobs.length} {cleanerJobs.length === 1 ? 'job' : 'jobs'}
                  </div>
                </div>

                {/* Timeline Column */}
                <div className="flex-1 relative h-28 bg-white">
                  {/* Hour Grid Lines */}
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: `${(idx / HOURS.length) * 100}%` }}
                    />
                  ))}

                  {/* Lunch Break (12-1pm) */}
                  <div
                    className="absolute top-0 bottom-0 bg-gray-100 opacity-50"
                    style={{
                      left: `${((12 - 7) / 13) * 100}%`,
                      width: `${(1 / 13) * 100}%`
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-xs text-gray-500">
                      LUNCH
                    </div>
                  </div>

                  {/* Job Blocks */}
                  {cleanerJobs.map(job => {
                    const position = getJobPosition(job);
                    const serviceType = job.fields['Service Type'];
                    const clientName = job.clientName || 'Unknown Client';
                    const price = job.fields['Amount Charged'] || 0;
                    const startTime = job.fields.Time;
                    const endTime = job.fields['End Time'];
                    const color = getCleanerColor(cleanerName);

                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="absolute top-2 bottom-2 rounded-lg p-2 text-white text-xs hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: color,
                          minWidth: '100px',
                        }}
                      >
                        <div className="font-semibold truncate">{clientName}</div>
                        <div className="truncate">
                          {serviceType === 'General Clean' ? 'General' :
                           serviceType === 'Deep Clean' ? 'Deep' :
                           serviceType === 'Move-In-Out' ? 'Move-In-Out' : serviceType}
                        </div>
                        <div className="truncate text-xs opacity-90">
                          ${price} • {startTime}-{endTime}
                        </div>
                      </Link>
                    );
                  })}

                  {/* Empty State - Available */}
                  {cleanerJobs.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                      Available (All Day)
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty State - No Cleaners */}
          {visibleCleaners.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No active cleaners available
            </div>
          )}
          </div>
        </div>

        {/* Right Sidebar - Filters & Actions */}
        <div className="w-80 space-y-4">
          {/* Cleaners Filter */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-tidyco-navy mb-4">Show Cleaners</h3>
            <div className="space-y-2">
              {cleaners.map(cleaner => {
                const todayJobCount = jobsByCleaner.get(cleaner.id)?.length || 0;
                return (
                  <label key={cleaner.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showCleaners[cleaner.id]}
                      onChange={(e) => setShowCleaners({
                        ...showCleaners,
                        [cleaner.id]: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span>
                      {cleaner.fields.Name}
                      <span className="text-gray-500 ml-1">
                        ({todayJobCount} {todayJobCount === 1 ? 'job' : 'jobs'})
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Job Types Filter */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-tidyco-navy mb-4">Job Types</h3>
            <div className="space-y-2.5">
              {Object.entries(showJobTypes).map(([type, checked]) => (
                <label key={type} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setShowJobTypes({
                      ...showJobTypes,
                      [type]: e.target.checked
                    })}
                    className="rounded text-tidyco-blue focus:ring-tidyco-blue"
                  />
                  <span className="font-medium text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-tidyco-navy mb-4">Status Filters</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showStatuses.scheduled}
                  onChange={(e) => setShowStatuses({
                    ...showStatuses,
                    scheduled: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Scheduled jobs</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showStatuses.inProgress}
                  onChange={(e) => setShowStatuses({
                    ...showStatuses,
                    inProgress: e.target.checked
                  })}
                  className="rounded"
                />
                <span>In-progress jobs</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showStatuses.unassigned}
                  onChange={(e) => setShowStatuses({
                    ...showStatuses,
                    unassigned: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Unassigned jobs</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showStatuses.completed}
                  onChange={(e) => setShowStatuses({
                    ...showStatuses,
                    completed: e.target.checked
                  })}
                  className="rounded"
                />
                <span>Completed jobs</span>
              </label>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/jobs/new')}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                New Job
              </button>
              <button
                onClick={() => router.push('/cleaners')}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg text-sm"
              >
                <Settings className="w-4 h-4" />
                Manage Cleaners
              </button>
              <button
                onClick={() => alert('Email feature coming soon!')}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg text-sm text-gray-400"
              >
                <Mail className="w-4 h-4" />
                Send Schedule Email
              </button>
              <button
                onClick={() => alert('PDF export coming soon!')}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded-lg text-sm text-gray-400"
              >
                <FileDown className="w-4 h-4" />
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unassigned Jobs Section */}
      {unassignedJobs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-4">
            ⚠️ Unassigned Jobs (Need Cleaner Assignment)
          </h3>
          <div className="space-y-4">
            {unassignedJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                <div>
                  <div className="font-medium">{job.clientName}</div>
                  <div className="text-sm text-gray-600">
                    {job.fields['Service Type']} • ${job.fields['Amount Charged']} •
                    {job.fields.Time} • {job.fields.Address}
                  </div>
                </div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onChange={async (e) => {
                    const cleanerId = e.target.value;
                    if (!cleanerId) return;

                    try {
                      const response = await fetch(`/api/jobs/${job.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ Cleaner: [cleanerId] }),
                      });

                      if (response.ok) {
                        // Update local state to reflect the change
                        const cleanerName = cleaners.find(c => c.id === cleanerId)?.fields.Name || 'Unknown';
                        setJobs(prev => prev.map(j =>
                          j.id === job.id
                            ? { ...j, fields: { ...j.fields, Cleaner: [cleanerId] }, cleanerName }
                            : j
                        ));
                      } else {
                        alert('Failed to assign cleaner. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error assigning cleaner:', error);
                      alert('Failed to assign cleaner. Please try again.');
                    }
                  }}
                >
                  <option value="">Assign to...</option>
                  {cleaners.filter(c => c.fields.Status === 'Active').map(cleaner => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.fields.Name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
