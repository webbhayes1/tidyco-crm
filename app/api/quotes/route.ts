import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/airtable';

export async function GET() {
  try {
    const quotes = await getQuotes();
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}