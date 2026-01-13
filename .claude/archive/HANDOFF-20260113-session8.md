# Custom CRM Session Handoff

**Date**: 2026-01-13
**Session**: 8 (Reschedule Feature, Name Split, Pricing Calculations)
**Implementation**: Custom (Next.js)
**Focus Area**: Job rescheduling, client name fields, job pricing automation

---

## Session Summary

Added job reschedule functionality with single/all-future options, split client name into separate First Name / Last Name fields for personalized auto-texts, and improved duration/pricing calculations for auto-generated recurring jobs.

---

## Features Completed

### 1. Reschedule Feature
**Files**:
- `components/RescheduleButton.tsx` - Button component (already existed)
- `components/RescheduleModal.tsx` - Modal with date picker and scope options
- `app/api/jobs/reschedule/route.ts` - API endpoint for rescheduling
- `app/(dashboard)/jobs/[id]/page.tsx` - Added RescheduleButton to job detail page

**Functionality**:
- User can reschedule a single job OR all future jobs for that client
- Calculates day offset from current date to new date
- "All future" option applies offset to every job from the selected date forward
- Jobs that are Cancelled or Completed are excluded from batch rescheduling

---

### 2. First Name / Last Name Split
**Files**:
- `types/airtable.ts` - Added 'First Name' and 'Last Name' to Client interface
- `components/ClientForm.tsx` - Split single name input into firstName/lastName

**Airtable Changes**:
- Added "First Name" field (singleLineText, optional)
- Added "Last Name" field (singleLineText, optional)

**Implementation Details**:
```typescript
// ClientForm now parses existing Name into first/last for backwards compatibility
const parseExistingName = () => {
  if (client?.fields['First Name']) {
    return {
      firstName: client.fields['First Name'],
      lastName: client.fields['Last Name'] || ''
    };
  }
  const fullName = client?.fields.Name || '';
  const parts = fullName.trim().split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
};
```

- Form saves both First Name/Last Name AND combined Name field
- Last Name is optional (no `required` attribute) per user request
- Purpose: Enable personalized auto-texts like "Hi [First Name]!"

---

### 3. Duration and Pricing Calculations
**File**: `app/api/clients/route.ts`

**Added helper functions**:
```typescript
// Parse time string like "9:00 AM" or "1:30 PM" to hours since midnight
function parseTimeToHours(timeStr: string): number {
  if (!timeStr) return 9; // Default to 9 AM
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 9;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours + (minutes / 60);
}

// Calculate duration in hours between two time strings
function calculateDurationHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 3; // Default to 3 hours
  const startHours = parseTimeToHours(startTime);
  const endHours = parseTimeToHours(endTime);
  const duration = endHours - startHours;
  return duration > 0 ? duration : 3;
}
```

**Bidirectional Pricing**:
- **Per Cleaning**: If client has flat rate (e.g., $150/cleaning), system calculates implied hourly rate: `$150 / 3 hours = $50/hr`
- **Hourly Rate**: If client has hourly rate (e.g., $50/hr), system calculates total: `$50 × 3 hours = $150`

Both `Client Hourly Rate` and `Amount Charged` are now populated on auto-generated recurring jobs.

---

## Files Modified This Session

### Modified
1. `app/(dashboard)/jobs/[id]/page.tsx` - Added RescheduleButton import and usage
2. `types/airtable.ts` - Added 'First Name' and 'Last Name' to Client interface
3. `components/ClientForm.tsx` - Split name field into firstName/lastName with parsing
4. `app/api/clients/route.ts` - Added time parsing, duration calc, and bidirectional pricing

---

## Current State

### Working Features
- Job detail page has Reschedule button with modal
- Reschedule can apply to single job or all future jobs
- Client form captures First Name and Last Name separately
- Recurring job auto-generation includes proper Duration Hours
- Jobs get both hourly rate and total amount calculated

### Known Remaining Work
- Re-enable Clerk authentication
- Quotes page implementation
- Calendar filter wiring
- Quick action button wiring

---

## Quality Score Formula (Reference)

User asked about this during session. The Quality Score on Jobs is calculated via Airtable formula:

```
Quality Score = (Checklist/Total × 40) + (Rating/5 × 30) + (min(Photos,3)/3 × 15) + (OnTime × 15)
```

**Components**:
- Checklist Completion: 40 points (% of items completed)
- Client Rating: 30 points (rating out of 5)
- Photos Uploaded: 15 points (up to 3 photos)
- On-Time Arrival: 15 points (boolean)

---

## Next Session Recommendations

### Priority 1: Test New Features
1. Create a new recurring client with First Name / Last Name
2. Verify jobs are auto-generated with correct Duration Hours and pricing
3. Test reschedule functionality (single and all-future)

### Priority 2: Re-enable Clerk Authentication
Follow steps in STATUS.md to restore authentication.

### Priority 3: Push Changes to Vercel
Current changes are local - need to commit and deploy:
```bash
git add .
git commit -m "Add reschedule feature, name split, pricing calculations"
git push origin main
```

---

## Important Patterns

### Timezone-Safe Date Parsing
Always append 'T12:00:00' to date-only strings:
```typescript
const date = new Date(dateStr + 'T12:00:00');
```

### Time String Parsing
Use the `parseTimeToHours()` function for "9:00 AM" style times:
```typescript
const hours = parseTimeToHours('9:00 AM'); // Returns 9
const hours = parseTimeToHours('1:30 PM'); // Returns 13.5
```

---

**Session End**: 2026-01-13
**Status**: All features implemented, ready for testing and deployment