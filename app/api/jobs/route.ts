import { NextResponse } from 'next/server';
import { getJobs, getClients, getCleaners, createJob } from '@/lib/airtable';

export async function GET() {
  try {
    const [jobs, clients, cleaners] = await Promise.all([
      getJobs(),
      getClients(),
      getCleaners(),
    ]);

    // Create lookup maps for quick access
    const clientMap = new Map(clients.map(c => [c.id, c.fields.Name]));
    const cleanerMap = new Map(cleaners.map(c => [c.id, c.fields.Name]));

    // Enrich jobs with client and cleaner names
    const enrichedJobs = jobs.map(job => {
      const cleanerIds = job.fields.Cleaner || [];
      const cleanerNames = cleanerIds
        .map(id => cleanerMap.get(id))
        .filter(Boolean) as string[];

      return {
        ...job,
        clientName: job.fields.Client?.[0] ? clientMap.get(job.fields.Client[0]) : null,
        cleanerName: cleanerNames.length > 0 ? cleanerNames[0] : null,
        cleanerNames: cleanerNames,
        cleanerCount: cleanerNames.length,
      };
    });

    // Sort by date ascending
    enrichedJobs.sort((a, b) => {
      const dateA = a.fields.Date || '';
      const dateB = b.fields.Date || '';
      return dateA.localeCompare(dateB);
    });

    return NextResponse.json(enrichedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const job = await createJob(body);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}