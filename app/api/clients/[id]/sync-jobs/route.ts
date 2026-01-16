import { NextResponse } from 'next/server';
import { getClient, getJobs, updateJob, createJob, getCleaner } from '@/lib/airtable';
import { addDays, addWeeks, format, parseISO, isAfter, startOfDay } from 'date-fns';

// Helper to parse time string (e.g., "9:00 AM") to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Helper to calculate duration in hours from start/end time strings
function calculateDurationHours(startTime: string, endTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  return durationMinutes > 0 ? durationMinutes / 60 : 0;
}

// Helper to get the next occurrence of a specific day of week
function getNextDayOfWeek(dayName: string, startDate: Date): Date {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(dayName);
  if (targetDay === -1) return startDate;

  const currentDay = startDate.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;

  return addDays(startDate, daysToAdd);
}

// GET: Count future jobs for this client
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const allJobs = await getJobs();
    const today = startOfDay(new Date());

    // Find future jobs for this client
    const futureJobs = allJobs.filter(job => {
      if (!job.fields.Client?.includes(params.id)) return false;
      if (!job.fields.Date) return false;

      const jobDate = parseISO(job.fields.Date);
      return isAfter(jobDate, today) || format(jobDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });

    return NextResponse.json({ count: futureJobs.length, jobs: futureJobs });
  } catch (error) {
    console.error('Error counting future jobs:', error);
    return NextResponse.json({ error: 'Failed to count future jobs' }, { status: 500 });
  }
}

// POST: Sync future jobs with new schedule OR generate new jobs
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      recurringDays,
      recurringStartTime,
      recurringEndTime,
      preferredCleaner,
      frequency,
      mode, // 'sync' (default) or 'generate'
      weeksToGenerate = 8
    } = body;

    // Get the client for verification
    const client = await getClient(params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get all jobs
    const allJobs = await getJobs();
    const today = startOfDay(new Date());

    // Find future jobs for this client (today or later, not completed/cancelled)
    const futureJobs = allJobs.filter(job => {
      if (!job.fields.Client?.includes(params.id)) return false;
      if (!job.fields.Date) return false;
      if (job.fields.Status === 'Completed' || job.fields.Status === 'Cancelled') return false;

      const jobDate = parseISO(job.fields.Date);
      return isAfter(jobDate, today) || format(jobDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });

    // GENERATE MODE: Create new jobs based on recurring schedule
    if (mode === 'generate') {
      const recurringDaysList = recurringDays || client.fields['Recurring Days']?.split(', ') || [];
      const startTime = recurringStartTime || client.fields['Recurring Start Time'] || '9:00 AM';
      const endTime = recurringEndTime || client.fields['Recurring End Time'] || '12:00 PM';
      const cleaner = preferredCleaner || client.fields['Preferred Cleaner'] || [];
      const freq = frequency || client.fields['Recurrence Frequency'] || 'Weekly';

      console.log('GENERATE MODE - Settings:', {
        recurringDaysList,
        startTime,
        endTime,
        cleaner,
        freq,
        clientId: params.id,
      });

      if (recurringDaysList.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No recurring days configured for this client'
        }, { status: 400 });
      }

      let createdCount = 0;
      let skippedCount = 0;
      let currentDate = today;
      const endDate = addWeeks(today, weeksToGenerate);

      // Generate jobs for each recurring day within the date range
      while (currentDate < endDate) {
        for (const dayName of recurringDaysList) {
          const jobDate = getNextDayOfWeek(dayName, currentDate);

          // Skip if this date is beyond our range or in the past
          if (jobDate >= endDate) continue;
          if (jobDate < today) continue;

          // Check if a job already exists for this date
          const existingJob = allJobs.find(j =>
            j.fields.Client?.includes(params.id) &&
            j.fields.Date === format(jobDate, 'yyyy-MM-dd')
          );
          if (existingJob) {
            console.log(`Skipping ${format(jobDate, 'yyyy-MM-dd')} - job already exists`);
            skippedCount++;
            continue;
          }

          // Calculate duration and pricing
          const durationHours = Math.round(calculateDurationHours(startTime, endTime));
          const clientHourlyRate = client.fields['Client Hourly Rate'] || 35;
          const chargePerCleaning = client.fields['Charge Per Cleaning'] || 150;
          const pricingType = client.fields['Pricing Type'] || 'Per Cleaning';

          // Calculate amount charged based on pricing type
          const amountCharged = pricingType === 'Per Cleaning'
            ? chargePerCleaning
            : durationHours * clientHourlyRate;

          // Get cleaner's hourly rate for profit calculation
          let cleanerHourlyRate = 0;
          if (cleaner && cleaner.length > 0) {
            const cleanerRecord = await getCleaner(cleaner[0]);
            if (cleanerRecord) {
              cleanerHourlyRate = cleanerRecord.fields['Hourly Rate'] || 0;
            }
          }

          // Calculate profit (Amount Charged - Cleaner Pay)
          const cleanerPay = cleanerHourlyRate * durationHours;
          const profit = amountCharged - cleanerPay;

          console.log('Creating job with:', {
            startTime,
            endTime,
            durationHours,
            clientHourlyRate,
            chargePerCleaning,
            pricingType,
            amountCharged,
            cleanerHourlyRate,
            cleanerPay,
            profit,
            bedrooms: client.fields.Bedrooms,
            bathrooms: client.fields.Bathrooms,
          });

          // Build job fields - only include defined values
          const jobFields: Record<string, unknown> = {
            Client: [params.id],
            Date: format(jobDate, 'yyyy-MM-dd'),
            Time: startTime,
            'End Time': endTime,
            Status: 'Scheduled',
            'Service Type': 'General Clean',
          };

          // Add optional fields only if they have values
          if (client.fields.Address) {
            jobFields.Address = client.fields.Address;
          }
          if (cleaner && cleaner.length > 0) {
            jobFields.Cleaner = cleaner;
          }
          if (durationHours > 0) {
            jobFields['Duration Hours'] = durationHours;
            jobFields['Actual Hours'] = durationHours; // For Cleaner Base Pay formula
          }
          if (clientHourlyRate > 0) {
            jobFields['Client Hourly Rate'] = clientHourlyRate;
          }
          if (amountCharged > 0) {
            jobFields['Amount Charged'] = amountCharged;
          }
          if (profit > 0) {
            jobFields['Profit'] = profit;
          }
          if (client.fields.Bedrooms) {
            jobFields.Bedrooms = client.fields.Bedrooms;
          }
          if (client.fields.Bathrooms) {
            jobFields.Bathrooms = client.fields.Bathrooms;
          }

          // Create the job
          await createJob(jobFields as any);
          createdCount++;
        }

        // Move to next period based on frequency
        if (freq === 'Weekly') {
          currentDate = addWeeks(currentDate, 1);
        } else if (freq === 'Bi-weekly' || freq === 'Bi-Weekly') {
          currentDate = addWeeks(currentDate, 2);
        } else if (freq === 'Monthly') {
          currentDate = addWeeks(currentDate, 4);
        } else {
          currentDate = addWeeks(currentDate, 1);
        }
      }

      console.log(`GENERATE complete: created ${createdCount}, skipped ${skippedCount}`);
      return NextResponse.json({
        success: true,
        createdCount,
        skippedCount,
        message: `Created ${createdCount} job${createdCount !== 1 ? 's' : ''}${skippedCount > 0 ? ` (${skippedCount} already existed)` : ''}`
      });
    }

    // SYNC MODE (default): Update existing jobs
    if (futureJobs.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        message: 'No future jobs to update'
      });
    }

    // Sort jobs by date
    futureJobs.sort((a, b) => {
      const dateA = parseISO(a.fields.Date!);
      const dateB = parseISO(b.fields.Date!);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate new dates based on the recurring days
    const recurringDaysList = recurringDays || [];
    let updatedCount = 0;
    let currentStartDate = today;

    for (let i = 0; i < futureJobs.length; i++) {
      const job = futureJobs[i];

      // Build update fields
      const updateFields: Record<string, any> = {};

      // Update time if provided
      if (recurringStartTime) {
        updateFields.Time = recurringStartTime;
      }
      if (recurringEndTime) {
        updateFields['End Time'] = recurringEndTime;
      }

      // Update cleaner if provided
      if (preferredCleaner && preferredCleaner.length > 0) {
        updateFields.Cleaner = preferredCleaner;
      }

      // If we have recurring days, reassign dates
      if (recurringDaysList.length > 0) {
        // Get the day index for this job in the cycle
        const dayIndex = i % recurringDaysList.length;
        const targetDay = recurringDaysList[dayIndex];

        // Find the next occurrence of this day
        const newDate = getNextDayOfWeek(targetDay, currentStartDate);
        updateFields.Date = format(newDate, 'yyyy-MM-dd');

        // Move start date forward based on frequency
        if (dayIndex === recurringDaysList.length - 1) {
          // After completing one cycle, move to next week (or next period based on frequency)
          if (frequency === 'Weekly') {
            currentStartDate = addDays(newDate, 1);
          } else if (frequency === 'Bi-Weekly') {
            currentStartDate = addDays(newDate, 8);
          } else if (frequency === 'Monthly') {
            currentStartDate = addDays(newDate, 22);
          } else {
            currentStartDate = addDays(newDate, 1);
          }
        }
      }

      // Only update if there are changes
      if (Object.keys(updateFields).length > 0) {
        await updateJob(job.id, updateFields);
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} job${updatedCount !== 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Error syncing jobs:', error);
    return NextResponse.json({ error: 'Failed to sync jobs' }, { status: 500 });
  }
}
