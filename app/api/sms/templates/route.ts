import { NextResponse } from 'next/server';
import { getSMSTemplates, createSMSTemplate } from '@/lib/airtable';

export async function GET() {
  try {
    const templates = await getSMSTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.Name || !body.Body) {
      return NextResponse.json(
        { error: 'Name and Body are required' },
        { status: 400 }
      );
    }

    const template = await createSMSTemplate({
      Name: body.Name,
      Body: body.Body,
      Category: body.Category || 'Custom',
      Active: body.Active ?? true,
      'Use Count': 0,
      'Created By': body['Created By'] || 'System',
      Notes: body.Notes,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating SMS template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
