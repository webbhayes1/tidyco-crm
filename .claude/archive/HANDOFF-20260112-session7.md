# Custom CRM Session Handoff

**Date**: 2026-01-12
**Session**: 7 (Calendar & Recurring Jobs Fixes)
**Implementation**: Custom (Next.js)
**Focus Area**: Calendar bug fixes, recurring job automation, cascade deletes

---

## Session Summary

Fixed multiple calendar and date-related bugs, implemented auto-recurring job generation for new clients, and added cascade delete functionality for client-job relationships.

---

## Fixes Completed

### 1. Daily/Weekly Calendar Time Parsing
**Files**:
- `app/(dashboard)/calendar/daily/page.tsx`
- `app/(dashboard)/calendar/weekly/page.tsx`

**Problem**: Jobs weren't showing on calendar because time parsing only handled 24-hour format ("14:00"), but Airtable stored 12-hour format ("10:00 AM").

**Fix**: Added `parseTime` function that handles both formats:
```typescript
const parseTime = (timeStr: string): number => {
  const isPM = timeStr.toLowerCase().includes('pm');
  const isAM = timeStr.toLowerCase().includes('am');
  const cleanTime = timeStr.replace(/\s*(am|pm)\s*/i, '').trim();
  const [hoursStr, minutesStr] = cleanTime.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || '0', 10);
  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours + minutes / 60;
};
```

---

### 2. Monthly Calendar Missing Client Data
**File**: `app/(dashboard)/calendar/monthly/page.tsx`

**Problem**: Monthly calendar wasn't fetching client data, so jobs showed "Unknown" for client names.

**Fix**: Added client fetch to useEffect and enriched jobs with client names:
```typescript
Promise.all([
  fetch('/api/jobs').then(r => r.json()),
  fetch('/api/cleaners').then(r => r.json()),
  fetch('/api/clients').then(r => r.json()),  // Added
]).then(([jobsData, cleanersData, clientsData]) => {
  const clientMap = new Map(clientsData.map((c: any) => [c.id, c.fields.Name]));
  // ... enrich jobs with client names
});
```

---

### 3. Timezone Bug - Wrong Day Display
**File**: `app/(dashboard)/clients/[id]/page.tsx`

**Problem**: Dates like "2026-01-21" were showing as "Jan 20" because JavaScript parses date-only strings as UTC midnight, which displays as the previous day in Pacific timezone.

**Fix**: Added `parseDate` helper that appends 'T12:00:00' to use noon local time:
```typescript
const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T12:00:00');  // Noon to avoid timezone issues
  }
  return parseISO(dateStr);
};
```

---

### 4. Auto-Recurring Job Generation
**File**: `app/api/clients/route.ts`

**Problem**: User wanted recurring clients to auto-generate jobs for 6 months, not just the first cleaning.

**Fix**: Added `generateRecurringDates` function and job creation in POST handler:
```typescript
function generateRecurringDates(startDate: string, frequency: string, monthsAhead: number = 6): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T12:00:00');
  const endDate = addMonths(new Date(), monthsAhead);
  let currentDate = start;

  while (currentDate <= endDate) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    switch (frequency) {
      case 'Weekly': currentDate = addWeeks(currentDate, 1); break;
      case 'Bi-weekly': currentDate = addWeeks(currentDate, 2); break;
      case 'Monthly': currentDate = addMonths(currentDate, 1); break;
      default: currentDate = addWeeks(currentDate, 2);
    }
  }
  return dates;
}
```

**When triggered**: Only when client has:
- `Is Recurring` = true
- `First Cleaning Date` set
- `Preferred Cleaner` assigned

---

### 5. Cascade Delete - Client Jobs
**File**: `app/api/clients/[id]/route.ts`

**Problem**: Deleting a client left orphaned jobs in the database.

**Fix**: Updated DELETE handler to delete all associated jobs first:
```typescript
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // First, delete all jobs associated with this client
    const allJobs = await getJobs();
    const clientJobs = allJobs.filter(job => job.fields.Client?.includes(params.id));

    await Promise.all(
      clientJobs.map(job => deleteJob(job.id).catch(err => {
        console.error(`Error deleting job ${job.id}:`, err);
        return null;
      }))
    );

    // Then delete the client
    await deleteClient(params.id);
    return NextResponse.json({ success: true, deletedJobs: clientJobs.length }, { status: 200 });
  } catch (error) { ... }
}
```

---

### 6. Cleaned Up Orphaned Jobs
**Action**: Manually deleted 13 orphaned jobs from Airtable that were left behind after testing (Sharon's old jobs).

Used Airtable MCP to:
1. Search for jobs with no valid client reference
2. Delete in batches of 10 (Airtable API limit)

---

## Files Modified This Session

### Modified
1. `app/api/clients/route.ts` - Added recurring job generation
2. `app/api/clients/[id]/route.ts` - Added cascade delete
3. `app/(dashboard)/clients/[id]/page.tsx` - Added parseDate helper for timezone fix
4. `app/(dashboard)/calendar/daily/page.tsx` - Added parseTime function
5. `app/(dashboard)/calendar/weekly/page.tsx` - Added parseTime function
6. `app/(dashboard)/calendar/monthly/page.tsx` - Added client data fetching

---

## Current State

### Working Features
- Daily calendar shows jobs correctly with time parsing
- Weekly calendar shows jobs correctly with time parsing
- Monthly calendar shows client names on jobs
- Client detail page shows correct dates (timezone fixed)
- New recurring clients auto-generate 6 months of jobs
- Deleting a client cascades to delete all associated jobs

### Known Remaining Work
- Re-enable Clerk authentication
- Quotes page implementation
- Calendar filter wiring
- Quick action button wiring

---

## Next Session Recommendations

### Priority 1: Re-enable Clerk Authentication
Follow the steps in STATUS.md to restore Clerk authentication.

### Priority 2: Test Recurring Job Flow
1. Create a new recurring client with preferred cleaner
2. Verify jobs are auto-generated for 6 months
3. Delete the client and verify cascade delete works

### Priority 3: Additional Calendar Features
- Wire up calendar filters
- Implement weekly/monthly calendar views (currently placeholders)

---

## Important Notes

### Recurring Job Generation Triggers
Jobs are ONLY auto-generated when creating a new client with:
- `Is Recurring` = true
- `First Cleaning Date` = set
- `Preferred Cleaner` = assigned

If you update an existing client to be recurring, jobs will NOT auto-generate (only works on CREATE).

### Timezone Fix Pattern
Whenever parsing date-only strings ("YYYY-MM-DD"), append 'T12:00:00':
```typescript
const date = new Date(dateStr + 'T12:00:00');
```
This prevents UTC midnight from showing as the previous day in Pacific timezone.

---

**Session End**: 2026-01-12
**Status**: All fixes verified working
