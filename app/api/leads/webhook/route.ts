import { NextRequest, NextResponse } from 'next/server';
import { createLead, getLeads } from '@/lib/airtable';

// Map common field names from various lead sources to our schema
function normalizeLeadData(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  // Name variations - check for full name first, then combine first+last
  let name = data.name || data.customer_name || data.full_name || data.Name;

  // If no full name, try to combine first + last name
  if (!name) {
    const firstName = data.first_name || data.firstName || data.customer_first_name ||
      data.customerFirstName || data['Customer First Name'] || '';
    const lastName = data.last_name || data.lastName || data.customer_last_name ||
      data.customerLastName || data['Customer Last Name'] || '';

    if (firstName || lastName) {
      name = [firstName, lastName].filter(Boolean).join(' ');
    }
  }

  if (name) normalized.Name = String(name).trim();

  // Email variations
  const email = data.email || data.customer_email || data.Email || data.emailAddress;
  if (email) normalized.Email = String(email);

  // Phone variations
  const phone = data.phone || data.customer_phone || data.phone_number ||
    data.Phone || data.phoneNumber || data.mobile;
  if (phone) normalized.Phone = String(phone);

  // Address variations
  const address = data.address || data.street_address || data.street ||
    data.Address || data.streetAddress;
  if (address) normalized.Address = String(address);

  // City
  const city = data.city || data.City;
  if (city) normalized.City = String(city);

  // State
  const state = data.state || data.State;
  if (state) normalized.State = String(state);

  // Zip variations
  const zip = data.zip || data.zip_code || data.zipcode || data.postal_code ||
    data['Zip Code'] || data.postalCode;
  if (zip) normalized['Zip Code'] = String(zip);

  // Lead source - try to detect from payload
  let source = data.source || data.lead_source || data.leadSource || data['Lead Source'];
  if (!source) {
    // Try to detect source from other fields
    if (data.angi_lead_id || data['Angi Lead ID'] || data.angiLeadId) {
      source = 'Angi';
    } else if (data.thumbtack_id || data.thumbtackId) {
      source = 'Thumbtack';
    }
  }
  if (source && ['Angi', 'Referral', 'Direct', 'Google', 'Facebook', 'Thumbtack', 'Other'].includes(String(source))) {
    normalized['Lead Source'] = source;
  }

  // Angi Lead ID for deduplication
  const angiId = data.angi_lead_id || data['Angi Lead ID'] || data.angiLeadId ||
    data.lead_id || data.leadId || data.id;
  if (angiId && source === 'Angi') {
    normalized['Angi Lead ID'] = String(angiId);
  }

  // Service type
  const serviceType = data.service_type || data.service || data.category ||
    data['Service Type Interested'] || data.serviceType;
  if (serviceType) {
    const st = String(serviceType).toLowerCase();
    if (st.includes('deep') || st.includes('heavy')) {
      normalized['Service Type Interested'] = 'Deep Clean';
    } else if (st.includes('move') || st.includes('moving')) {
      normalized['Service Type Interested'] = 'Move-In-Out';
    } else {
      normalized['Service Type Interested'] = 'General Clean';
    }
  }

  // Bedrooms/Bathrooms
  const bedrooms = data.bedrooms || data.beds || data.Bedrooms;
  if (bedrooms) normalized.Bedrooms = parseInt(String(bedrooms)) || undefined;

  const bathrooms = data.bathrooms || data.baths || data.Bathrooms;
  if (bathrooms) normalized.Bathrooms = parseFloat(String(bathrooms)) || undefined;

  // Notes/Message
  const notes = data.notes || data.message || data.comments || data.description ||
    data.Notes || data.Message;
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
          return NextResponse.json(
            { success: false, error: 'Invalid request format' },
            { status: 400 }
          );
        }
      }
    }

    // Handle if data is wrapped in a body object
    if (data.body && typeof data.body === 'object') {
      data = data.body as Record<string, unknown>;
    }

    // Normalize the lead data
    const normalizedData = normalizeLeadData(data);

    // Validate required fields
    if (!normalizedData.Name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Check for duplicates by Angi Lead ID
    if (normalizedData['Angi Lead ID']) {
      const duplicate = await isDuplicate(String(normalizedData['Angi Lead ID']));
      if (duplicate) {
        return NextResponse.json(
          { success: true, message: 'Lead already exists', duplicate: true },
          { status: 200 }
        );
      }
    }

    // Create the lead in Airtable
    const lead = await createLead(normalizedData as Parameters<typeof createLead>[0]);

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      lead: {
        id: lead.id,
        name: lead.fields.Name,
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process lead' },
      { status: 500 }
    );
  }
}

// Also support GET for testing the endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'TidyCo Lead Webhook is active',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      requiredFields: ['name'],
      optionalFields: [
        'email', 'phone', 'address', 'city', 'state', 'zip',
        'service_type', 'notes', 'lead_source', 'angi_lead_id'
      ],
    },
  });
}
