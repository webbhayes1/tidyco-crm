import { NextResponse } from 'next/server';
import { updateJob } from '@/lib/airtable';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { markClientPaid, markCleanerPaid, paymentMethod, tipAmount } = body;

    const today = new Date().toISOString().split('T')[0];

    // Build the update object based on what's being marked
    const updates: Record<string, unknown> = {};

    if (markClientPaid) {
      updates['Payment Status'] = 'Paid';
      updates['Client Paid Date'] = today;
      if (paymentMethod) {
        updates['Payment Method Used'] = paymentMethod;
      }
      // Add tip amount if provided
      if (tipAmount !== undefined && tipAmount >= 0) {
        updates['Tip Amount'] = tipAmount;
      }
    }

    if (markCleanerPaid) {
      updates['Cleaner Paid'] = true;
      updates['Cleaner Paid Date'] = today;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No payment status changes specified' },
        { status: 400 }
      );
    }

    const updatedJob = await updateJob(params.id, updates);

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
