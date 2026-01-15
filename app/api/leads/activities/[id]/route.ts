import { NextResponse } from 'next/server';
import { getLeadActivity, updateLeadActivity, deleteLeadActivity } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await getLeadActivity(id);
    if (!activity) {
      return NextResponse.json({ error: 'Lead activity not found' }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching lead activity:', error);
    return NextResponse.json({ error: 'Failed to fetch lead activity' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const activity = await updateLeadActivity(id, body);
    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error updating lead activity:', error);
    return NextResponse.json({ error: 'Failed to update lead activity' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteLeadActivity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead activity:', error);
    return NextResponse.json({ error: 'Failed to delete lead activity' }, { status: 500 });
  }
}
