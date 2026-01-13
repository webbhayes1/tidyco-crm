import { NextResponse } from 'next/server';
import { getClients, createClient, createJob } from '@/lib/airtable';
import { addWeeks, addMonths, format } from 'date-fns';
import type { Job } from '@/types/airtable';

// Parse time string like "9:00 AM" or "1:30 PM" to hours since midnight
function parseTimeToHours(timeStr: string): number {
  if (!timeStr) return 9; // Default to 9 AM

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 9;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours + (minutes / 60);
}

// Calculate duration in hours between two time strings
function calculateDurationHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 3; // Default to 3 hours

  const startHours = parseTimeToHours(startTime);
  const endHours = parseTimeToHours(endTime);

  const duration = endHours - startHours;
  return duration > 0 ? duration : 3; // Fallback to 3 hours if invalid
}

// Generate recurring job dates for the next 6 months
function generateRecurringDates(
  startDate: string,
  frequency: string,
  monthsAhead: number = 6
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T12:00:00'); // Noon to avoid timezone issues
  const endDate = addMonths(new Date(), monthsAhead);

  let currentDate = start;

  while (currentDate <= endDate) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));

    // Calculate next date based on frequency
    switch (frequency) {
      case 'Weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'Bi-weekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'Monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      default:
        currentDate = addWeeks(currentDate, 2); // Default to bi-weekly
    }
  }

  return dates;
}

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await createClient(body);

    // Auto-create recurring jobs if client is recurring with a cleaner and first cleaning date
    if (
      body['Is Recurring'] &&
      body['First Cleaning Date'] &&
      body['Preferred Cleaner'] &&
      body['Preferred Cleaner'].length > 0
    ) {
      // Generate dates for the next 6 months
      const recurringDates = generateRecurringDates(
        body['First Cleaning Date'],
        body['Recurrence Frequency'] || 'Bi-weekly'
      );

      // Calculate duration and hourly rate
      const startTime = body['Recurring Start Time'] || '9:00 AM';
      const endTime = body['Recurring End Time'] || '12:00 PM';
      const durationHours = calculateDurationHours(startTime, endTime);

      // Calculate hourly rate based on pricing type
      let clientHourlyRate: number | undefined;
      let amountCharged: number | undefined;

      if (body['Pricing Type'] === 'Per Cleaning' && body['Charge Per Cleaning']) {
        // Flat rate: calculate implied hourly rate
        const flatRate = body['Charge Per Cleaning'] as number;
        amountCharged = flatRate;
        clientHourlyRate = Math.round((flatRate / durationHours) * 100) / 100;
      } else if (body['Pricing Type'] === 'Hourly Rate' && body['Client Hourly Rate']) {
        // Hourly rate: calculate total amount
        const hourlyRate = body['Client Hourly Rate'] as number;
        clientHourlyRate = hourlyRate;
        amountCharged = Math.round(hourlyRate * durationHours * 100) / 100;
      }

      // Create a job for each date
      const jobPromises = recurringDates.map((date) => {
        const jobFields: Job['fields'] = {
          'Client': [client.id],
          'Cleaner': body['Preferred Cleaner'],
          'Date': date,
          'Time': startTime,
          'End Time': endTime,
          'Duration Hours': durationHours,
          'Address': body['Address'],
          'Bedrooms': body['Bedrooms'],
          'Bathrooms': body['Bathrooms'],
          'Service Type': 'General Clean',
          'Status': 'Scheduled',
          'Is Recurring': true,
          'Recurrence Frequency': body['Recurrence Frequency'],
          'Client Hourly Rate': clientHourlyRate,
          'Amount Charged': amountCharged,
          'Notes': `Auto-created. Schedule: ${body['Recurrence Frequency']} on ${body['Recurring Days'] || body['Recurring Day'] || 'Not specified'}`,
        };

        return createJob(jobFields).catch((err) => {
          console.error(`Error creating job for ${date}:`, err);
          return null; // Don't fail the whole batch
        });
      });

      try {
        await Promise.all(jobPromises);
        console.log(`Created ${recurringDates.length} recurring jobs for client ${client.id}`);
      } catch (jobError) {
        console.error('Error creating recurring jobs:', jobError);
      }
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
