import { NextResponse } from 'next/server';
import { getLead, updateLead, createClient } from '@/lib/airtable';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the lead
    const lead = await getLead(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create client from lead data
    const clientFields = {
      'Name': lead.fields.Name,
      'Email': lead.fields.Email || '',
      'Phone': lead.fields.Phone || '',
      'Address': lead.fields.Address || '',
      'City': lead.fields.City,
      'State': lead.fields.State,
      'Zip Code': lead.fields['Zip Code'],
      'Lead Source': lead.fields['Lead Source'],
      'Owner': lead.fields.Owner,
      'Status': 'Active' as const,
      'Notes': lead.fields.Notes,
      'Bedrooms': lead.fields.Bedrooms,
      'Bathrooms': lead.fields.Bathrooms,
    };

    const client = await createClient(clientFields);

    // Update lead status to Won and link to converted client
    await updateLead(id, {
      'Status': 'Won',
      'Converted Client': [client.id],
    });

    return NextResponse.json({
      success: true,
      clientId: client.id,
      client,
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 });
  }
}
