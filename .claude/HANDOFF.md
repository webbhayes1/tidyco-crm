# Session 34 Handoff - 2026-01-16

## Session Summary
Fixed dashboard profit calculations to match finances page, added expected profit display to KPI cards, and fixed client address display to show full address.

## What Was Accomplished

### 1. Full Address Display on Client Detail Page
- Updated client detail page to show complete address
- Now displays: Street, Address Line 2 (if exists), City, State, Zip Code
- Previously only showed street and zip

### 2. Expected Profit on Dashboard KPI Cards
- Added profit line (green text) to "This Week" and "This Month" cards
- Shows expected profit calculated as: Revenue - (Duration Hours × Cleaner Hourly Rate)
- Matches the calculation used on the Finances page

### 3. Fixed Profit Calculation (safeNumber Helper)
- Added `safeNumber()` helper to dashboard metrics function
- Handles Airtable lookup fields that return arrays (e.g., `[25]` instead of `25`)
- `Cleaner Hourly Rate` is a lookup field - was returning `[25]` not `25`
- Now properly extracts the value from arrays

### 4. Fixed Date Filtering (Timezone Issue)
- **Root Cause**: Airtable formula `{Date} <= '2026-01-31'` was missing the last day of the month
- Jobs on Jan 31 were being excluded due to timezone/string comparison issues
- **Fix**: Changed `getJobsThisWeek()` and `getJobsThisMonth()` to:
  - Fetch ALL jobs from Airtable
  - Filter client-side using JavaScript Date objects
  - Matches how the Finances page filters (which was correct)
- Dashboard now shows same job count and profit as Finances page

### 5. Equal Height KPI Cards
- Added `h-full` class to all 4 dashboard KPI cards
- Cards now stretch to match the tallest card in the row

## Files Modified This Session

| File | Changes |
|------|---------|
| `app/(dashboard)/page.tsx` | Added profit display, h-full for equal card heights |
| `app/(dashboard)/clients/[id]/page.tsx` | Full address display (City, State, Zip) |
| `lib/airtable.ts` | safeNumber helper, client-side date filtering for getJobsThisWeek/getJobsThisMonth |

## Airtable Changes This Session
None - only code changes.

## Commits Pushed
- `ac1633f` - Show full address on client detail page
- Session 33 changes: `2e9e62e` - Add 3-part time picker and Entry Instructions/Preferences for jobs

## Pending Commits
- Dashboard profit display and calculation fixes (needs to be committed)

## Deployment Status
- Local: Running on http://localhost:3002
- Production: https://tidyco-crm.vercel.app (needs redeploy after push)

## Known Issues / Notes
- Dev server was using port 3002 (ports 3000/3001 were in use)
- Airtable date formulas have timezone issues - always filter client-side for accuracy

## Next Session Recommendations

1. **Commit and push** dashboard changes from this session
2. **Test** that dashboard numbers match finances page exactly
3. **Outstanding from previous sessions**:
   - Add missing Airtable single select options (see airtable-changelog.md)
   - Twilio A2P 10DLC campaign still pending approval

## Technical Notes

### Why Dashboard Numbers Were Wrong
1. `Cleaner Hourly Rate` is a **lookup field** - Airtable returns `[25]` not `25`
2. Airtable date formula `{Date} <= '2026-01-31'` excluded Jan 31 jobs
3. Dashboard was missing 1 job ($315 revenue, $215 profit) compared to Finances page

### Fix Applied
```javascript
// safeNumber helper for lookup arrays
const safeNumber = (value) => {
  if (Array.isArray(value)) return value[0] || 0;
  return value || 0;
};

// Client-side date filtering instead of Airtable formula
const allJobs = await getJobs();
return allJobs.filter(job => {
  const jobDate = new Date(job.fields.Date + 'T12:00:00');
  return jobDate >= startOfMonth && jobDate <= endOfMonth;
});
```

## Files to Read Next Session
1. This file (`custom/.claude/HANDOFF.md`)
2. `crm/.claude/STATUS.md`
3. `crm/.claude/decisions/airtable-changelog.md`