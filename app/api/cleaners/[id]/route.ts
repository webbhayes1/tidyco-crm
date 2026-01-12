import { NextResponse } from 'next/server';
import { updateCleaner, deleteCleaner } from '@/lib/airtable';

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