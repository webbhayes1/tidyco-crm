# TidyCo CRM - API Implementation Guide

This guide provides complete examples for implementing all CRUD API routes.

---

## 📍 API Routes Architecture

```
app/api/
├── clients/
│   ├── route.ts          # GET list, POST new
│   └── [id]/
│       └── route.ts      # GET one, PUT update, DELETE
├── cleaners/
│   ├── route.ts          # GET list, POST new
│   └── [id]/
│       └── route.ts      # GET one, PUT update, DELETE
├── jobs/
│   ├── route.ts          # GET list, POST new
│   └── [id]/
│       └── route.ts      # GET one, PUT update, DELETE
└── quotes/
    ├── route.ts          # GET list, POST new
    └── [id]/
        └── route.ts      # GET one, PUT update, DELETE
```

---

## 🔧 Helper Functions (Already Exist in lib/airtable.ts)

These functions are already implemented and working:

```typescript
// Reading data
getJobs(view?: string): Promise<Job[]>
getClients(view?: string): Promise<Client[]>
getCleaners(view?: string): Promise<Cleaner[]>
getQuotes(view?: string): Promise<Quote[]>

// Filtering (used by components)
getUpcomingJobs(): Promise<Job[]>  // Next 7 days
getIncomeThisMonth(): Promise<Income[]>
getDashboardMetrics(): Promise<Metrics>
```

**Missing functions to add:**
```typescript
// Create
createJob(data: Partial<Job['fields']>): Promise<Job>
createClient(data: Partial<Client['fields']>): Promise<Client>
createCleaner(data: Partial<Cleaner['fields']>): Promise<Cleaner>

// Update
updateJob(id: string, data: Partial<Job['fields']>): Promise<Job>
updateClient(id: string, data: Partial<Client['fields']>): Promise<Client>
updateCleaner(id: string, data: Partial<Cleaner['fields']>): Promise<Cleaner>

// Delete
deleteJob(id: string): Promise<void>
deleteClient(id: string): Promise<void>
deleteCleaner(id: string): Promise<void>
```

---

## 📝 Implementation Examples

### 1. Add CRUD Functions to lib/airtable.ts

Add these functions at the end of `lib/airtable.ts`:

```typescript
// ============================================================================
// CREATE OPERATIONS
// ============================================================================

export async function createJob(data: Partial<Job['fields']>): Promise<Job> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: data,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create job: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function createClient(data: Partial<Client['fields']>): Promise<Client> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Clients`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: data,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create client: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function createCleaner(data: Partial<Cleaner['fields']>): Promise<Cleaner> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Cleaners`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: data,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create cleaner: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

export async function updateJob(id: string, data: Partial<Job['fields']>): Promise<Job> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs/${id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: data,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update job: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function updateClient(id: string, data: Partial<Client['fields']>): Promise<Client> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Clients/${id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: data,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update client: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

export async function updateCleaner(id: string, data: Partial<Cleaner['fields']>): Promise<Cleaner> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Cleaners/${id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: data,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update cleaner: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result;
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

export async function deleteJob(id: string): Promise<void> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to delete job: ${error.error?.message || response.statusText}`);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Clients/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to delete client: ${error.error?.message || response.statusText}`);
  }
}

export async function deleteCleaner(id: string): Promise<void> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Cleaners/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to delete cleaner: ${error.error?.message || response.statusText}`);
  }
}

// ============================================================================
// GET SINGLE RECORD
// ============================================================================

export async function getJobById(id: string): Promise<Job> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs/${id}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch job');
  }

  return response.json();
}

export async function getClientById(id: string): Promise<Client> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Clients/${id}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch client');
  }

  return response.json();
}

export async function getCleanerById(id: string): Promise<Cleaner> {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Cleaners/${id}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch cleaner');
  }

  return response.json();
}
```

---

### 2. Create API Route: app/api/clients/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getClients, createClient } from '@/lib/airtable';

// GET /api/clients
export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST /api/clients
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await createClient(data);
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
```

---

### 3. Create API Route: app/api/clients/[id]/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getClientById, updateClient, deleteClient } from '@/lib/airtable';

// GET /api/clients/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await getClientById(params.id);
    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Failed to fetch client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const client = await updateClient(params.id, data);
    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Failed to update client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteClient(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete client:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}
```

---

### 4. Create API Route: app/api/cleaners/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getCleaners, createCleaner } from '@/lib/airtable';

// GET /api/cleaners
export async function GET() {
  try {
    const cleaners = await getCleaners();
    return NextResponse.json(cleaners);
  } catch (error: any) {
    console.error('Failed to fetch cleaners:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cleaners' },
      { status: 500 }
    );
  }
}

// POST /api/cleaners
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const cleaner = await createCleaner(data);
    return NextResponse.json(cleaner, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create cleaner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create cleaner' },
      { status: 500 }
    );
  }
}
```

---

### 5. Create API Route: app/api/cleaners/[id]/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getCleanerById, updateCleaner, deleteCleaner } from '@/lib/airtable';

// GET /api/cleaners/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cleaner = await getCleanerById(params.id);
    return NextResponse.json(cleaner);
  } catch (error: any) {
    console.error('Failed to fetch cleaner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cleaner' },
      { status: 500 }
    );
  }
}

// PUT /api/cleaners/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const cleaner = await updateCleaner(params.id, data);
    return NextResponse.json(cleaner);
  } catch (error: any) {
    console.error('Failed to update cleaner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cleaner' },
      { status: 500 }
    );
  }
}

// DELETE /api/cleaners/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCleaner(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete cleaner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete cleaner' },
      { status: 500 }
    );
  }
}
```

---

### 6. Create API Route: app/api/jobs/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getJobs, createJob } from '@/lib/airtable';

// GET /api/jobs
export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const job = await createJob(data);
    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}
```

---

### 7. Create API Route: app/api/jobs/[id]/route.ts

```typescript
import { NextResponse } from 'next/server';
import { getJobById, updateJob, deleteJob } from '@/lib/airtable';

// GET /api/jobs/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Failed to fetch job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const job = await updateJob(params.id, data);
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Failed to update job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteJob(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
```

---

### 8. Create Page: app/(dashboard)/jobs/new/page.tsx

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '@/components/JobForm';

export default function NewJobPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
      }

      // Success - redirect to jobs list
      router.push('/jobs');
    } catch (err: any) {
      console.error('Failed to save job:', err);
      setError(err.message);
      throw err; // Re-throw so JobForm can handle loading state
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tidyco-navy">New Booking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new cleaning job and assign it to a cleaner.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <JobForm
        onSave={handleSave}
        onCancel={() => router.push('/jobs')}
      />
    </div>
  );
}
```

---

### 9. Create Page: app/(dashboard)/jobs/[id]/page.tsx

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '@/components/JobForm';
import type { Job } from '@/types/airtable';

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch job');
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [params.id]);

  const handleSave = async (data: any) => {
    try {
      setError(null);
      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update job');
      }

      router.push('/jobs');
    } catch (err: any) {
      console.error('Failed to update job:', err);
      setError(err.message);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading job...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h1 className="text-xl font-bold text-red-800 mb-2">Error</h1>
        <p className="text-red-700">{error || 'Job not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tidyco-navy">Edit Job</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update job details and assignment.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <JobForm
        job={job}
        onSave={handleSave}
        onCancel={() => router.push('/jobs')}
      />
    </div>
  );
}
```

---

## 🧪 Testing the API

### Test GET endpoints
```bash
curl http://localhost:3000/api/clients | jq .
curl http://localhost:3000/api/cleaners | jq .
curl http://localhost:3000/api/jobs | jq .
```

### Test POST endpoint
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "Client": ["recqD899LrVaPRqmt"],
    "Cleaner": ["recdf3NIIGyWcOD6X"],
    "Date": "2026-01-15",
    "Time": "09:00",
    "End Time": "11:00",
    "Service Type": "General Clean",
    "Duration Hours": 2,
    "Amount Charged": 100,
    "Status": "Scheduled"
  }' | jq .
```

### Test PUT endpoint
```bash
curl -X PUT http://localhost:3000/api/jobs/rec123456 \
  -H "Content-Type: application/json" \
  -d '{
    "Status": "Completed"
  }' | jq .
```

### Test DELETE endpoint
```bash
curl -X DELETE http://localhost:3000/api/jobs/rec123456
```

---

## ⚠️ Important Notes

### Field Name Conversions
JobForm uses different field names than Airtable. It handles conversion on submit (lines 58-80 of JobForm.tsx):

| JobForm Field | Airtable Field |
|---------------|----------------|
| `jobDate` | `Job Date` |
| `startTime` | `Start Time` |
| `endTime` | `End Time` |
| `client` | `Client` |
| `cleaner` | `Cleaner` |

### Linked Records Format
When creating/updating linked records in Airtable, use array of record IDs:
```typescript
{
  "Client": ["recqD899LrVaPRqmt"],  // Array of client record IDs
  "Cleaner": ["recdf3NIIGyWcOD6X"]  // Array of cleaner record IDs
}
```

### Error Handling
All API routes follow this pattern:
1. Try the operation
2. Catch errors and log them
3. Return proper HTTP status codes (200, 201, 500)
4. Return JSON error messages

---

## 📋 Checklist

After implementing all API routes:

- [ ] Add CRUD functions to `lib/airtable.ts`
- [ ] Create `app/api/clients/route.ts`
- [ ] Create `app/api/clients/[id]/route.ts`
- [ ] Create `app/api/cleaners/route.ts`
- [ ] Create `app/api/cleaners/[id]/route.ts`
- [ ] Create `app/api/jobs/route.ts`
- [ ] Create `app/api/jobs/[id]/route.ts`
- [ ] Create `app/(dashboard)/jobs/new/page.tsx`
- [ ] Create `app/(dashboard)/jobs/[id]/page.tsx`
- [ ] Test all endpoints with curl
- [ ] Test creating a job from the UI
- [ ] Test editing a job from the UI
- [ ] Verify data appears in Airtable

---

**Ready to implement!** Start with the CRUD functions in lib/airtable.ts, then build the API routes one by one.
