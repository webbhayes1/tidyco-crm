import { NextResponse } from 'next/server';
import { getDispositionTag, updateDispositionTag, deleteDispositionTag } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tag = await getDispositionTag(id);
    if (!tag) {
      return NextResponse.json({ error: 'Disposition tag not found' }, { status: 404 });
    }
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching disposition tag:', error);
    return NextResponse.json({ error: 'Failed to fetch disposition tag' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tag = await updateDispositionTag(id, body);
    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating disposition tag:', error);
    return NextResponse.json({ error: 'Failed to update disposition tag' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDispositionTag(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting disposition tag:', error);
    return NextResponse.json({ error: 'Failed to delete disposition tag' }, { status: 500 });
  }
}
