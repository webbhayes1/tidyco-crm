# Custom CRM Session Handoff

**Date**: 2026-01-13
**Session**: 11 (Teams Feature Implementation)
**Implementation**: Custom (Next.js)
**Focus Area**: Multi-cleaner teams support for group jobs

---

## Session Summary

Implemented comprehensive Teams feature enabling multi-cleaner job assignments. Teams serve as reusable templates that auto-populate cleaners on jobs, with per-job flexibility to swap members if unavailable. Each cleaner receives their full hourly rate (not split), and tips are split evenly.

---

## What Was Accomplished

### 1. Airtable Teams Table
**Table ID**: `tblBO0GPVEy3tOl7a`

Created new Teams table with fields:
- `Team Name` (required) - e.g., "Sarah & Maria"
- `Members` (multipleRecordLinks → Cleaners)
- `Team Lead` (optional, single cleaner)
- `Status` (Active/Inactive)
- `Notes`
- `Member Names` (Lookup - created manually)
- `Member Phones` (Lookup - created manually)
- `Member Count` (Count - created manually)
- `Total Hourly Rate` (Rollup SUM - created manually)

### 2. Jobs Table Update
- Added `Team` field (fldAXamLgTIWEvOE7) linking to Teams table
- Jobs.Cleaner field already supported multiple linked records

### 3. TypeScript Types Update
**File**: `types/airtable.ts`
- Added `Team` interface
- Added `Team` field to `Job` interface

### 4. Teams CRUD Functions
**File**: `lib/airtable.ts`
- `getTeams()`, `getTeam()`, `createTeam()`, `updateTeam()`, `deleteTeam()`
- `getActiveTeams()` helper function

### 5. Teams API Routes
- `app/api/teams/route.ts` - GET (list), POST (create)
- `app/api/teams/[id]/route.ts` - GET, PUT, PATCH, DELETE

### 6. Teams UI (Under Cleaners Tab)
**Per user request, Teams is a subtab under Cleaners navigation**

New files created:
- `app/(dashboard)/cleaners/layout.tsx` - Tab navigation (Cleaners | Teams)
- `app/(dashboard)/cleaners/teams/page.tsx` - Teams list page
- `app/(dashboard)/cleaners/teams/new/page.tsx` - New team form
- `app/(dashboard)/cleaners/teams/[id]/page.tsx` - Team detail page
- `app/(dashboard)/cleaners/teams/[id]/edit/page.tsx` - Edit team form
- `components/TeamForm.tsx` - Team form with multi-cleaner selection

### 7. JobForm Multi-Cleaner Update
**File**: `components/JobForm.tsx`
- Assignment type toggle: "Individual Cleaners" vs "Team"
- Team dropdown that auto-populates cleaners (but list is editable)
- Multi-select checkboxes for individual cleaner selection
- Combined hourly rate and payout preview

### 8. Job Detail Page Multi-Cleaner Support
**File**: `app/(dashboard)/jobs/[id]/page.tsx`
- Shows all cleaners with individual payout breakdown
- Each cleaner: Rate, Base Pay, Tip (split), Total Payout
- Team summary: Total Team Payout
- Tip split info when multiple cleaners

### 9. MarkCompleteButton Tip Distribution
**File**: `components/MarkCompleteButton.tsx`
- Added `cleanerCount` prop
- Shows tip split info for team jobs
- Displays per-cleaner tip amount as you type

### 10. Jobs List Multi-Cleaner Display
**Files**: `app/api/jobs/route.ts`, `app/(dashboard)/jobs/page.tsx`
- API returns `cleanerNames` array and `cleanerCount`
- List shows "2 cleaners" with names preview for team jobs

---

## Files Created

| File | Description |
|------|-------------|
| `app/(dashboard)/cleaners/layout.tsx` | Tab navigation for Cleaners/Teams |
| `app/(dashboard)/cleaners/teams/page.tsx` | Teams list page |
| `app/(dashboard)/cleaners/teams/new/page.tsx` | New team form page |
| `app/(dashboard)/cleaners/teams/[id]/page.tsx` | Team detail page |
| `app/(dashboard)/cleaners/teams/[id]/edit/page.tsx` | Edit team page |
| `components/TeamForm.tsx` | Team form with multi-cleaner picker |

---

## Files Modified

| File | Changes |
|------|---------|
| `types/airtable.ts` | Added Team interface, Team field to Job |
| `lib/airtable.ts` | Added team CRUD functions |
| `components/Navigation.tsx` | Removed Teams from top-level nav |
| `components/JobForm.tsx` | Complete rewrite for multi-cleaner/team selection |
| `components/MarkCompleteButton.tsx` | Added cleanerCount prop, tip split info |
| `app/(dashboard)/jobs/[id]/page.tsx` | Multi-cleaner display with payouts |
| `app/(dashboard)/jobs/page.tsx` | Multi-cleaner column display |
| `app/api/jobs/route.ts` | Returns cleanerNames array, cleanerCount |
| `app/api/teams/route.ts` | NEW - Teams list/create API |
| `app/api/teams/[id]/route.ts` | NEW - Team CRUD API |
| `.claude/decisions/airtable-changelog.md` | Logged Teams table creation |

---

## Files Deleted

| File | Reason |
|------|--------|
| `app/(dashboard)/teams/*` | Moved to `/cleaners/teams/*` |

---

## Airtable Changes

Fully logged in `.claude/decisions/airtable-changelog.md`:
- Teams table creation with all fields
- Team field added to Jobs table
- Manual lookup/rollup/count fields verified as created

---

## Business Rules Implemented

1. **Full Hourly Rate**: Each cleaner gets their FULL rate (not split)
2. **Tips Split Evenly**: Tips divided equally between all cleaners
3. **Teams as Templates**: Selecting a team auto-fills cleaners, but list is editable per-job
4. **Per-Job Flexibility**: Can swap out unavailable team members for specific jobs

---

## Testing Status

**Not Yet Tested**:
- Creating a team via UI
- Selecting a team on JobForm
- Multi-cleaner job display
- Tip split calculations
- Team detail page with job history

**All changes are local (not deployed)**

---

## Next Session Recommendations

### Priority 1: Test Teams Feature
1. Start dev server:
   ```bash
   cd "/Users/webbhayes/n8n : notion : claude/cleaning-business/crm/custom" && unset AIRTABLE_BASE_ID AIRTABLE_API_TOKEN && ./node_modules/.bin/next dev
   ```
2. Create a test team with 2 cleaners
3. Create a job using that team
4. Verify cleaners auto-populate
5. Test modifying cleaner list per-job
6. Test Mark Complete with tip split

### Priority 2: Deploy to Production
```bash
cd "/Users/webbhayes/n8n : notion : claude/cleaning-business/crm/custom"
./node_modules/.bin/next build
git add -A
git commit -m "Add Teams feature for multi-cleaner jobs

- Teams as subtab under Cleaners navigation
- Team templates with reusable cleaner groups
- Multi-cleaner job assignment with per-job flexibility
- Each cleaner gets full hourly rate
- Tips split evenly with preview in Mark Complete modal
- Job detail shows all cleaners with individual payouts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push origin main
```

### Priority 3: n8n Workflow Updates
Update SMS workflows to loop through all cleaners:
- `booking-intake-confirmation.json` - Send to all assigned cleaners
- `night-before-reminders.json` - Remind all cleaners

---

## Important Notes

- **Teams are under Cleaners**: Navigate to Cleaners → Teams tab (not top-level nav)
- **Airtable Manual Fields**: User created lookup/rollup/count fields manually (verified)
- **JobForm Rewritten**: Major changes to support multi-cleaner - review if issues

---

**Session End**: 2026-01-13
**Status**: Teams feature complete, ready for testing and deployment.
