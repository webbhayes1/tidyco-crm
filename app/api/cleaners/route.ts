import { NextResponse } from 'next/server';
import { getCleaners, createCleaner } from '@/lib/airtable';

export async function GET() {
  try {
    const cleaners = await getCleaners();
    return NextResponse.json(cleaners);
  } catch (error) {
    console.error('Error fetching cleaners:', error);
    return NextResponse.json({ error: 'Failed to fetch cleaners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleaner = await createCleaner(body);
    return NextResponse.json(cleaner, { status: 201 });
  } catch (error) {
    console.error('Error creating cleaner:', error);
    return NextResponse.json({ error: 'Failed to create cleaner' }, { status: 500 });
  }
}
