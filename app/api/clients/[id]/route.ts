import { NextResponse } from 'next/server';
import { getClient, updateClient, deleteClient, getJobs, deleteJob } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await getClient(params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const client = await updateClient(params.id, body);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const client = await updateClient(params.id, body);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, delete all jobs associated with this client
    const allJobs = await getJobs();
    const clientJobs = allJobs.filter(job => job.fields.Client?.includes(params.id));

    // Delete each job (in parallel for speed)
    await Promise.all(
      clientJobs.map(job =>
        deleteJob(job.id).catch(err => {
          console.error(`Error deleting job ${job.id}:`, err);
          return null; // Don't fail if one job deletion fails
        })
      )
    );

    console.log(`Deleted ${clientJobs.length} jobs for client ${params.id}`);

    // Then delete the client
    await deleteClient(params.id);
    return NextResponse.json({ success: true, deletedJobs: clientJobs.length }, { status: 200 });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
