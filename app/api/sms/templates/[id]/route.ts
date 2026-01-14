import { NextResponse } from 'next/server';
import { getSMSTemplate, updateSMSTemplate, deleteSMSTemplate } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await getSMSTemplate(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching SMS template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const template = await updateSMSTemplate(id, body);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating SMS template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSMSTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SMS template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
