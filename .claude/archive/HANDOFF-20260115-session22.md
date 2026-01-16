# Custom CRM Session Handoff

**Date**: 2026-01-15
**Session**: 22 (Auto-Generate Jobs Feature)
**Implementation**: Custom (Next.js)
**Focus Area**: Job generation from client recurring schedule

---

## Session Summary

Implemented the auto-generate jobs feature (Issue #7 from Session 21). When editing a client with no future jobs but with recurring days configured, the system now offers to generate jobs for the next 8 weeks. Jobs are created with proper pricing fields including Duration Hours, Actual Hours (for Cleaner Base Pay formula), Client Hourly Rate, Amount Charged, and Profit.

---

## What Was Accomplished

### 1. Auto-Generate Jobs API Endpoint

**Enhanced `/api/clients/[id]/sync-jobs/route.ts`**:
- Added `mode` parameter: `'sync'` (update existing) or `'generate'` (create new)
- Added time parsing helpers to calculate duration from start/end times
- Added pricing calculation based on client's pricing type (Per Cleaning vs Hourly)
- Added cleaner hourly rate lookup for profit calculation

**Job fields now populated**:
- Duration Hours (rounded integer from start/end time)
- Actual Hours (same as Duration Hours - enables Cleaner Base Pay formula)
- Client Hourly Rate
- Amount Charged (based on pricing type)
- Profit (Amount Charged - Cleaner Pay)
- Bedrooms, Bathrooms, Address

### 2. Schedule Sync Modal Enhancement

**Updated `components/ScheduleSyncModal.tsx`**:
- Added `mode` prop to toggle between sync/generate UI
- Different messaging for generate mode ("Generate Jobs?")
- Different button text ("Yes, Generate Jobs" vs "Yes, Update Jobs")

### 3. Client Form Integration

**Updated `components/ClientForm.tsx`**:
- Added `syncMode` state to track sync vs generate mode
- Passes mode to sync-jobs API and modal
- Detects when client has no future jobs but has recurring schedule

### 4. Bug Fixes During Development

**Fixed Unknown Field "City" error**:
- Removed City, State, Zip Code fields from job creation (these are lookups from Client, not direct fields on Jobs)

**Fixed Duration Hours not saving**:
- Airtable field has precision 0 (integer only)
- Added `Math.round()` to duration calculation

**Fixed Cleaner Base Pay showing $0**:
- Root cause: Cleaner Base Pay is a formula `Cleaner Hourly Rate * Actual Hours`
- Fix: Now setting `Actual Hours` = `Duration Hours` on job creation
- The formula auto-calculates once Actual Hours is populated

**Fixed Profit showing $0**:
- Profit is a regular currency field, not a formula
- Now calculating and setting Profit = Amount Charged - (Cleaner Hourly Rate * Duration Hours)

---

## Technical Details

### Jobs Table Schema Notes

From schema analysis, these fields are important for job pricing:

| Field | Type | Notes |
|-------|------|-------|
| Duration Hours | Number (precision 0) | Must be integer |
| Actual Hours | Number (precision 0) | Used by Cleaner Base Pay formula |
| Client Hourly Rate | Currency | Client's rate per hour |
| Amount Charged | Currency | Total to charge client |
| Cleaner Hourly Rate | Lookup | Auto-populated from Cleaner record |
| Cleaner Base Pay | Formula | `Cleaner Hourly Rate * Actual Hours` |
| Profit | Currency | Must be calculated and set manually |

### Code Flow

1. User edits client with recurring schedule
2. On save, system checks future jobs count
3. If 0 future jobs but recurring days exist → show "Generate Jobs?" modal
4. If user confirms → POST to `/api/clients/[id]/sync-jobs` with `mode: 'generate'`
5. API fetches client, calculates pricing, creates 8 weeks of jobs
6. Jobs include all pricing fields for immediate financial visibility

---

## Files Modified

| File | Changes |
|------|---------|
| `app/api/clients/[id]/sync-jobs/route.ts` | Added generate mode, pricing calculations, cleaner rate lookup |
| `components/ClientForm.tsx` | Added syncMode state, mode passing to modal |
| `components/ScheduleSyncModal.tsx` | Added mode prop for sync/generate UI variants |
| `lib/airtable.ts` | Added getCleaner import (already existed) |

---

## Testing Notes

Tested with client "David Oken" (ID: reca8UFYU4rfdbMFW):
- Generated 8 weekly jobs successfully
- All pricing fields populated correctly:
  - Duration Hours: 3
  - Actual Hours: 3
  - Client Hourly Rate: $35
  - Charge Per Cleaning: $100
  - Amount Charged: $100 (Per Cleaning pricing)
  - Cleaner Hourly Rate: $20/hr (lookup from cleaner)
  - Cleaner Base Pay: $60 (formula: 20 * 3)
  - Profit: $40 (100 - 60)

---

## Known Issues / Limitations

1. **Cleaner rate fetched per job**: Currently fetches cleaner record for each job in loop. Could optimize by caching cleaner data for batch creation.

2. **8 weeks hardcoded**: The `weeksToGenerate` parameter is hardcoded to 8. Could be made configurable.

3. **No job notes**: Generated jobs don't include notes explaining they were auto-generated (unlike n8n-created jobs).

---

## Build Status

Dev server running successfully. All changes compile without errors.

---

## Next Session Recommendations

1. **Test edge cases**:
   - Client with bi-weekly/monthly frequency
   - Client with multiple recurring days (e.g., Tuesday, Friday)
   - Client without preferred cleaner assigned

2. **Optimize cleaner lookup**: Cache cleaner data instead of fetching per job

3. **Add "Is Auto-Generated" flag or note**: Similar to n8n-created jobs

4. **Continue n8n workflows**: Still have remaining workflow work

5. **Consider "Sync" mode improvements**: When client changes schedule and has existing future jobs, offer to update them

---

**Session End**: 2026-01-15
**Status**: Auto-generate jobs feature complete and working
