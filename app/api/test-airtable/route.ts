import { NextResponse } from 'next/server';
import { getClients, getCleaners, getJobs } from '@/lib/airtable';

export async function GET() {
  try {
    console.log('Testing Airtable connection...');

    const [clients, cleaners, jobs] = await Promise.all([
      getClients(),
      getCleaners(),
      getJobs(),
    ]);

    console.log(`Fetched ${clients.length} clients, ${cleaners.length} cleaners, ${jobs.length} jobs`);

    return NextResponse.json({
      success: true,
      counts: {
        clients: clients.length,
        cleaners: cleaners.length,
        jobs: jobs.length,
      },
      sampleClient: clients[0] || null,
      sampleCleaner: cleaners[0] || null,
      sampleJob: jobs[0] || null,
    });
  } catch (error: any) {
    console.error('Airtable test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
