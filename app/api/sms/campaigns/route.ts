import { NextResponse } from 'next/server';
import { getDripCampaigns, createDripCampaign } from '@/lib/airtable';

export async function GET() {
  try {
    const campaigns = await getDripCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching drip campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.Name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const campaign = await createDripCampaign({
      Name: body.Name,
      Description: body.Description,
      'Trigger Type': body['Trigger Type'] || 'Manual',
      'Trigger Conditions': body['Trigger Conditions'],
      Status: body.Status || 'Draft',
      Sequence: body.Sequence,
      Notes: body.Notes,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating drip campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
