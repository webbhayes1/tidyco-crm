import { NextResponse } from 'next/server';
import { getDispositionTags, getActiveDispositionTags, createDispositionTag } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const tags = activeOnly
      ? await getActiveDispositionTags()
      : await getDispositionTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching disposition tags:', error);
    return NextResponse.json({ error: 'Failed to fetch disposition tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Set default Active to true if not provided
    if (body['Active'] === undefined) {
      body['Active'] = true;
    }

    const tag = await createDispositionTag(body);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating disposition tag:', error);
    return NextResponse.json({ error: 'Failed to create disposition tag' }, { status: 500 });
  }
}
