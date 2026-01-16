import { NextRequest, NextResponse } from 'next/server';
import { createLead, getLeads } from '@/lib/airtable';

// Map Angi's field names to our schema (based on Angi Lead Integration API docs)
function normalizeLeadData(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  // Name - Angi sends 'name' (always), plus 'firstName'/'lastName' (sometimes)
  let name = data.name || data.customer_name || data.full_name || data.Name;

  // If no full name, try to combine first + last name
  if (!name) {
    const firstName = data.firstName || data.first_name || data.customer_first_name || '';
    const lastName = data.lastName || data.last_name || data.customer_last_name || '';

    if (firstName || lastName) {
      name = [firstName, lastName].filter(Boolean).join(' ');
    }
  }

  if (name) normalized.Name = String(name).trim();

  // Email - Angi sends 'email'
  const email = data.email || data.customer_email || data.Email;
  if (email) normalized.Email = String(email);

  // Phone - Angi sends 'primaryPhone'
  const phone = data.primaryPhone || data.phone || data.customer_phone || data.Phone;
  if (phone) normalized.Phone = String(phone);

  // Address - Angi sends 'address'
  const address = data.address || data.street_address || data.Address;
  if (address) normalized.Address = String(address);

  // City - Angi sends 'city'
  const city = data.city || data.City;
  if (city) normalized.City = String(city);

  // State - Angi sends 'stateProvince'
  const state = data.stateProvince || data.state || data.State;
  if (state) normalized.State = String(state);

  // Zip - Angi sends 'postalCode'
  const zip = data.postalCode || data.zip || data.zip_code || data['Zip Code'];
  if (zip) normalized['Zip Code'] = String(zip);

  // Lead source - Angi sends 'leadSource' (e.g., "HomeAdvisor", "Angi")
  // If from Angi/HomeAdvisor, set to "Angi"
  const leadSource = data.leadSource || data.lead_source || data['Lead Source'];
  if (leadSource) {
    const src = String(leadSource).toLowerCase();
    if (src.includes('angi') || src.includes('homeadvisor') || src.includes('home advisor')) {
      normalized['Lead Source'] = 'Angi';
    } else if (['referral', 'direct', 'google', 'facebook', 'thumbtack', 'other'].includes(src)) {
      normalized['Lead Source'] = src.charAt(0).toUpperCase() + src.slice(1);
    }
  }

  // Auto-detect Angi source from leadOid or srOid presence
  if (!normalized['Lead Source'] && (data.leadOid || data.srOid)) {
    normalized['Lead Source'] = 'Angi';
  }

  // Angi Lead ID - use 'leadOid' for deduplication (unique lead ID from Angi)
  const angiLeadId = data.leadOid || data.angi_lead_id || data['Angi Lead ID'];
  if (angiLeadId) {
    normalized['Angi Lead ID'] = String(angiLeadId);
    // If we have a leadOid, this is definitely from Angi
    if (!normalized['Lead Source']) {
      normalized['Lead Source'] = 'Angi';
    }
  }

  // Service type - Angi sends 'taskName' (e.g., "House Cleaning Service")
  const taskName = data.taskName || data.service_type || data.service || data.category;
  if (taskName) {
    const task = String(taskName).toLowerCase();
    if (task.includes('deep') || task.includes('heavy') || task.includes('spring')) {
      normalized['Service Type Interested'] = 'Deep Clean';
    } else if (task.includes('move') || task.includes('moving')) {
      normalized['Service Type Interested'] = 'Move-In-Out';
    } else {
      normalized['Service Type Interested'] = 'General Clean';
    }
  }

  // Notes - Angi sends 'comments'
  // Also build notes from interview Q&A if present
  let notes = data.comments || data.notes || data.message || data.Notes || '';

  // Process interview array if present (Angi sends Q&A about the service)
  const interview = data.interview as Array<{ question: string; answer: string }> | undefined;
  if (interview && Array.isArray(interview)) {
    const interviewText = interview
      .map(qa => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join('\n\n');
    if (interviewText) {
      notes = notes ? `${notes}\n\n--- Interview Details ---\n${interviewText}` : interviewText;
    }
  }

  // Add lead fee info if present
  const fee = data.fee;
  if (fee !== undefined && fee !== null) {
    const feeNote = `Lead Fee: $${fee}`;
    notes = notes ? `${notes}\n\n${feeNote}` : feeNote;
  }

  if (notes) normalized.Notes = String(notes);

  // Owner - default to Webb for external leads
  normalized.Owner = data.owner || data.Owner || 'Webb';

  // Always set status to New
  normalized.Status = 'New';

  return normalized;
}

// Check for duplicate by Angi Lead ID
async function isDuplicate(angiLeadId: string): Promise<boolean> {
  try {
    const leads = await getLeads();
    return leads.some(lead => lead.fields['Angi Lead ID'] === angiLeadId);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming data
    let data: Record<string, unknown>;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      // Try JSON first, fallback to text
      try {
        data = await request.json();
      } catch {
        const text = await request.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Angi expects {"status":"success"} format - return error in same format
          return NextResponse.json({ status: 'error', message: 'Invalid request format' }, { status: 400 });
        }
      }
    }

    // Log incoming payload for debugging (will show in Vercel logs)
    console.log('Webhook received:', JSON.stringify(data, null, 2));

    // Handle if data is wrapped in a body object
    if (data.body && typeof data.body === 'object') {
      data = data.body as Record<string, unknown>;
    }

    // Normalize the lead data
    const normalizedData = normalizeLeadData(data);

    // Validate required fields
    if (!normalizedData.Name) {
      return NextResponse.json({ status: 'error', message: 'Missing required field: name' }, { status: 400 });
    }

    // Check for duplicates by Angi Lead ID
    if (normalizedData['Angi Lead ID']) {
      const duplicate = await isDuplicate(String(normalizedData['Angi Lead ID']));
      if (duplicate) {
        // Angi expects {"status":"success"} even for duplicates
        console.log('Duplicate lead detected:', normalizedData['Angi Lead ID']);
        return NextResponse.json({ status: 'success' });
      }
    }

    // Create the lead in Airtable
    const lead = await createLead(normalizedData as Parameters<typeof createLead>[0]);

    console.log('Lead created:', lead.id, normalizedData.Name);

    // Angi requires exactly {"status":"success"} response
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to process lead' }, { status: 500 });
  }
}

// Also support GET for testing the endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'TidyCo Lead Webhook is active and Angi-compatible',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      angiFields: [
        'name', 'firstName', 'lastName', 'address', 'city', 'stateProvince',
        'postalCode', 'primaryPhone', 'email', 'leadOid', 'srOid', 'taskName',
        'comments', 'leadSource', 'interview', 'fee'
      ],
      response: { status: 'success' },
    },
  });
}
