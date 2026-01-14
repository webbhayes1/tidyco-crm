import { NextResponse } from 'next/server';
import { getCleaner, updateCleaner, deleteCleaner } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cleaner = await getCleaner(params.id);
    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
    }
    return NextResponse.json(cleaner);
  } catch (error) {
    console.error('Error fetching cleaner:', error);
    return NextResponse.json({ error: 'Failed to fetch cleaner' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const cleaner = await updateCleaner(params.id, body);
    return NextResponse.json(cleaner);
  } catch (error) {
    console.error('Error updating cleaner:', error);
    return NextResponse.json({ error: 'Failed to update cleaner' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const cleaner = await updateCleaner(params.id, body);
    return NextResponse.json(cleaner);
  } catch (error) {
    console.error('Error updating cleaner:', error);
    return NextResponse.json({ error: 'Failed to update cleaner' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCleaner(params.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting cleaner:', error);
    return NextResponse.json({ error: 'Failed to delete cleaner' }, { status: 500 });
  }
}