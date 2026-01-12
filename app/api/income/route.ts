import { NextResponse } from 'next/server';
import { getIncome } from '@/lib/airtable';

export async function GET() {
  try {
    const income = await getIncome();
    return NextResponse.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    return NextResponse.json({ error: 'Failed to fetch income' }, { status: 500 });
  }
}