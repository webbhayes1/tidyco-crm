import { NextResponse } from 'next/server';
import { updateJob } from '@/lib/airtable';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { tipAmount, completionNotes } = body;

    const updateData: Record<string, unknown> = {
      Status: 'Completed',
    };

    if (tipAmount !== undefined && tipAmount >= 0) {
      updateData['Tip Amount'] = tipAmount;
    }

    if (completionNotes) {
      updateData['Completion Notes'] = completionNotes;
    }

    const job = await updateJob(params.id, updateData);
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error marking job complete:', error);
    return NextResponse.json({ error: 'Failed to mark job complete' }, { status: 500 });
  }
}
