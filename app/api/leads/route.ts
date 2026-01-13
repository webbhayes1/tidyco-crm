import { NextResponse } from 'next/server';
import { getLeads, createLead, createLeads } from '@/lib/airtable';

export async function GET() {
  try {
    const leads = await getLeads();
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is a bulk import (array of leads)
    if (Array.isArray(body)) {
      const leads = await createLeads(body);
      return NextResponse.json({
        success: true,
        count: leads.length,
        leads
      }, { status: 201 });
    }

    // Single lead creation
    // Set default status if not provided
    if (!body['Status']) {
      body['Status'] = 'New';
    }

    const lead = await createLead(body);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
