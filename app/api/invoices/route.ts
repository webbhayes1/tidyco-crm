import { NextResponse } from 'next/server';
import { getInvoices, createInvoice, getNextInvoiceNumber } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let options = {};
    if (status && status !== 'all') {
      options = { filterByFormula: `{Status} = '${status}'` };
    }

    const invoices = await getInvoices(options);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate invoice number if not provided
    if (!body['Invoice Number']) {
      body['Invoice Number'] = await getNextInvoiceNumber();
    }

    // Set default status if not provided
    if (!body.Status) {
      body.Status = 'Pending';
    }

    const invoice = await createInvoice(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
