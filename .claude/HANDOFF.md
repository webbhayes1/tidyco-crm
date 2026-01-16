# Session 28 Handoff - 2026-01-15

## Session Summary
Implemented lead fee expense tracking feature with Airtable integration and updated CLAUDE.md with mandatory MCP tool usage rules.

## What Was Accomplished

### 1. Lead Fee Expense Tracking (Full Feature)
**Purpose**: Track Angi lead fees as business expenses, with ability to mark refunds

**Airtable Fields Created** (via MCP tools):
- `Lead Fee` (currency) - Fee paid for the lead
- `Refunded` (checkbox) - Whether fee was refunded
- `Refund Date` (date) - When refund occurred

**CRM Changes**:
- **Webhook** (`app/api/leads/webhook/route.ts`) - Now saves Lead Fee from Angi payload
- **Finances Page** (`app/(dashboard)/finances/overview/page.tsx`) - Includes non-refunded lead fees in expense calculations, shows "Lead Fees" as separate category (rose/pink color)
- **Lead Detail Page** (`app/(dashboard)/leads/[id]/page.tsx`) - Shows Lead Fee card with "Mark as Refunded" button
- **TypeScript Types** (`types/airtable.ts`) - Added Lead Fee, Refunded, Refund Date fields

### 2. CLAUDE.md Updates - Mandatory MCP Tool Usage
Added explicit rule requiring MCP tools for ALL Airtable modifications:
- Located at lines 626-648 in CLAUDE.md
- Labeled as "MANDATORY" with critical warning
- Lists all applicable scenarios (fields, tables, records, etc.)
- Includes Base ID and key tool names

## Files Modified
- `custom/app/api/leads/webhook/route.ts` - Save Lead Fee field
- `custom/app/(dashboard)/finances/overview/page.tsx` - Include lead fees in expenses
- `custom/app/(dashboard)/leads/[id]/page.tsx` - Lead Fee display and refund button
- `custom/types/airtable.ts` - Lead interface updated
- `crm/CLAUDE.md` - Added mandatory MCP tools rule
- `crm/.claude/decisions/airtable-changelog.md` - Logged Lead Fee fields

## Airtable Changes
See `crm/.claude/decisions/airtable-changelog.md` entry for 2026-01-15:
- Added 3 fields to Leads table via MCP tools
- All field IDs documented

## Commits Pushed
- None this session - changes need to be committed

## Deployment Status
- Local: Not running
- Production: https://tidyco-crm.vercel.app (needs redeploy after push)

## Known Issues
- None identified this session

## Next Session Recommendations
1. **Commit and push** all changes from this session
2. **Test** lead fee feature end-to-end:
   - Send test Angi lead with fee
   - Verify fee shows on lead detail page
   - Test refund functionality
   - Check Finances page shows lead fees
3. **Verify** Google Places API works on production (from Session 27)
4. **Follow up with Angi** - Switch from test to live mode

## Files to Read Next Session
1. This file (`custom/.claude/HANDOFF.md`)
2. `crm/.claude/STATUS.md`
3. `crm/.claude/decisions/airtable-changelog.md`