import { NextResponse } from 'next/server';
import { getLeadActivities, getActivitiesForLead, getRecentLeadActivities, createLeadActivity } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const recent = searchParams.get('recent');
    const limit = searchParams.get('limit');

    let activities;
    if (leadId) {
      // Get activities for a specific lead
      activities = await getActivitiesForLead(leadId);
    } else if (recent === 'true') {
      // Get recent activities across all leads
      activities = await getRecentLeadActivities(limit ? parseInt(limit) : 20);
    } else {
      // Get all activities
      activities = await getLeadActivities();
    }

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching lead activities:', error);
    return NextResponse.json({ error: 'Failed to fetch lead activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Set default Activity Date to now if not provided
    if (!body['Activity Date']) {
      body['Activity Date'] = new Date().toISOString();
    }

    const activity = await createLeadActivity(body);
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating lead activity:', error);
    return NextResponse.json({ error: 'Failed to create lead activity' }, { status: 500 });
  }
}
