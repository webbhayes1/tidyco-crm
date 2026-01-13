import { NextResponse } from 'next/server';
import { getJobs, updateJob } from '@/lib/airtable';
import { addDays, format, parseISO } from 'date-fns';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, clientId, currentDate, newDate, scope } = body;

    if (!jobId || !newDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate the day difference
    const currentDateObj = new Date(currentDate + 'T12:00:00');
    const newDateObj = new Date(newDate + 'T12:00:00');
    const dayDiff = Math.round(
      (newDateObj.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (scope === 'single') {
      // Just update this one job
      await updateJob(jobId, { Date: newDate });
      return NextResponse.json({
        success: true,
        message: 'Job rescheduled successfully',
        updatedCount: 1,
      });
    } else if (scope === 'all_future') {
      // Get all jobs for this client
      const allJobs = await getJobs();
      const clientJobs = allJobs.filter(
        (job) =>
          job.fields.Client?.includes(clientId) &&
          job.fields.Date &&
          new Date(job.fields.Date + 'T12:00:00') >= currentDateObj &&
          job.fields.Status !== 'Cancelled' &&
          job.fields.Status !== 'Completed'
      );

      // Update each job by adding the day difference
      const updatePromises = clientJobs.map((job) => {
        const jobDateObj = new Date(job.fields.Date + 'T12:00:00');
        const newJobDate = addDays(jobDateObj, dayDiff);
        const newJobDateStr = format(newJobDate, 'yyyy-MM-dd');

        return updateJob(job.id, { Date: newJobDateStr }).catch((err) => {
          console.error(`Error updating job ${job.id}:`, err);
          return null;
        });
      });

      await Promise.all(updatePromises);

      return NextResponse.json({
        success: true,
        message: `Rescheduled ${clientJobs.length} jobs by ${dayDiff > 0 ? '+' : ''}${dayDiff} days`,
        updatedCount: clientJobs.length,
        dayDiff,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid scope. Must be "single" or "all_future"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error rescheduling job:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule job' },
      { status: 500 }
    );
  }
}