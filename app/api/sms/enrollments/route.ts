import { NextResponse } from 'next/server';
import { getCampaignEnrollments, getActiveEnrollments, getScheduledEnrollments, createCampaignEnrollment } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const scheduled = searchParams.get('scheduled');

    let enrollments;
    if (scheduled === 'true') {
      enrollments = await getScheduledEnrollments();
    } else if (status === 'Active') {
      enrollments = await getActiveEnrollments();
    } else {
      enrollments = await getCampaignEnrollments();
    }

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching campaign enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.Lead || !body.Campaign) {
      return NextResponse.json(
        { error: 'Lead and Campaign are required' },
        { status: 400 }
      );
    }

    const enrollment = await createCampaignEnrollment({
      'Enrollment Name': body['Enrollment Name'],
      Lead: Array.isArray(body.Lead) ? body.Lead : [body.Lead],
      Campaign: Array.isArray(body.Campaign) ? body.Campaign : [body.Campaign],
      Status: 'Active',
      'Current Step': 1,
      'Enrolled Date': new Date().toISOString().split('T')[0],
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error creating campaign enrollment:', error);
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
  }
}
