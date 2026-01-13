# Custom CRM Session Handoff

**Date**: 2026-01-13
**Session**: 13 (Leads Section Implementation)
**Implementation**: Custom (Next.js)
**Focus Area**: Complete Leads section with Angi integration prep

---

## Session Summary

Built the complete Leads management section from scratch, including Airtable table creation, full CRUD UI, CSV import for existing leads, and Convert to Client functionality. The section is ready for Angi integration via n8n.

---

## What Was Accomplished

### 1. Airtable Leads Table Created
**Table ID**: `tblQ9aJr02sOwk1hv`

**Fields created**:
- Name, Email, Phone, Address, City, State, Zip Code
- Lead Source (Angi, Referral, Direct, Google, Facebook, Thumbtack, Other)
- Angi Lead ID (for deduplication from Angi imports)
- Service Type Interested (General Clean, Deep Clean, Move-In-Out)
- Bedrooms, Bathrooms
- Status (New, Contacted, Qualified, Quote Sent, Won, Lost, Churned)
- Owner (Sean, Webb)
- Lead Score, Times Contacted, Last Contact Date, Next Follow-Up Date
- Lost Reason
- Converted Client (link to Clients table)
- Original Client (link to Clients - for churned client re-engagement)

### 2. TypeScript & Airtable Functions
**Files modified**:
- `types/airtable.ts` - Added Lead interface
- `lib/airtable.ts` - Added Lead CRUD functions:
  - `getLeads()`, `getLead()`, `createLead()`, `createLeads()` (bulk)
  - `updateLead()`, `deleteLead()`
  - `getLeadsByStatus()`, `getNewLeads()`, `getLeadsNeedingFollowUp()`
  - `findDuplicateLead()` - For Angi deduplication

### 3. Leads List Page (`/leads`)
**File**: `app/(dashboard)/leads/page.tsx`

**Features**:
- Status filter buttons (Active, All, New, Contacted, Qualified, Quote Sent, Won, Lost, Churned)
- Lead source badges with color coding
- Contact info display (phone, email)
- Service interest display (type, beds/baths)
- Times contacted count with last contact date
- Follow-up date with overdue highlighting
- **CSV Import Modal** with:
  - Paste CSV data
  - Column auto-mapping (Name, Phone, Email, Address, etc.)
  - Preview before import
  - Batch import to Airtable

### 4. Lead Detail Page (`/leads/[id]`)
**File**: `app/(dashboard)/leads/[id]/page.tsx`

**Features**:
- Contact info section with click-to-call/email
- Service interest section
- Activity tracking (times contacted, last contact, lead score)
- **Quick Actions**:
  - Convert to Client (creates client, marks lead as Won)
  - Create Job (links to job creation with lead data pre-filled)
- Status management (click to change status)
- Follow-up scheduling with quick buttons (+1d, +3d, +7d)
- Lost reason dropdown (when status is Lost)
- Log Call / Log Text buttons

### 5. Convert to Client API
**File**: `app/api/leads/[id]/convert/route.ts`

**Flow**:
1. Creates new Client record with all lead data
2. Updates Lead status to "Won"
3. Links Lead to Converted Client
4. Redirects to new Client page

### 6. Lead Form Component
**File**: `components/LeadForm.tsx`

Reusable form for creating and editing leads with all fields.

### 7. Navigation Updated
**File**: `components/Navigation.tsx`

Added "Leads" tab with UserPlus icon, positioned between Jobs and Clients.

---

## Files Created

| File | Description |
|------|-------------|
| `app/(dashboard)/leads/page.tsx` | Leads list with filters + CSV import |
| `app/(dashboard)/leads/[id]/page.tsx` | Lead detail with convert/actions |
| `app/(dashboard)/leads/[id]/edit/page.tsx` | Edit lead page |
| `app/(dashboard)/leads/new/page.tsx` | New lead form |
| `app/api/leads/route.ts` | GET list, POST create (single or bulk) |
| `app/api/leads/[id]/route.ts` | GET, PUT, PATCH, DELETE |
| `app/api/leads/[id]/convert/route.ts` | POST convert to client |
| `components/LeadForm.tsx` | Reusable lead form component |

## Files Modified

| File | Changes |
|------|---------|
| `types/airtable.ts` | Added Lead interface, expanded Client Lead Source |
| `lib/airtable.ts` | Added LEADS table + all lead functions |
| `components/Navigation.tsx` | Added Leads nav item |
| `.claude/plan/leads-section.md` | Updated with implementation status |

---

## Angi Integration - Next Steps

### Recommended Approach: Email Parsing via n8n

Since Angi sends email notifications for new leads, the easiest integration is:

1. **n8n Email Trigger**: Monitor inbox for emails from Angi
2. **Parse Email**: Extract lead details (name, phone, address, service)
3. **Check Duplicate**: Call `findDuplicateLead()` API endpoint
4. **Create Lead**: POST to `/api/leads` with Lead Source = "Angi"
5. **Send Notifications**: SMS to owner, auto-response to lead

### n8n Workflow to Build

```
Trigger: IMAP/Gmail - New email from angi.com
  ↓
Parse: Extract fields from email body (regex or AI)
  ↓
Check: GET /api/leads?phone={phone} (dedup check)
  ↓
Create: POST /api/leads (if not duplicate)
  ↓
Notify: Twilio SMS to owner
  ↓
Respond: Twilio SMS to lead (auto-response)
```

### API Endpoint for n8n

The `/api/leads` endpoint already supports bulk import:
- POST with single object → creates one lead
- POST with array → creates multiple leads (batched in 10s)

---

## CSV Import Format

For importing existing leads, use CSV with these columns:
```
Name,Phone,Email,Address,City,State,Zip Code,Source,Service Type,Bedrooms,Bathrooms,Notes
John Smith,555-123-4567,john@email.com,123 Main St,Manhattan Beach,CA,90266,Angi,Deep Clean,3,2,Called twice
```

---

## Testing Checklist

- [x] Build passes (verified)
- [ ] Create new lead manually
- [ ] Import leads via CSV
- [ ] Update lead status
- [ ] Log contact (call/text)
- [ ] Set follow-up date
- [ ] Convert lead to client
- [ ] Verify client created with correct data
- [ ] Verify lead status updated to Won

---

## Important Notes

1. **Client Lead Source expanded**: Added Google, Facebook, Thumbtack to match Lead options
2. **Angi Lead ID field**: Use this for deduplication when Angi integration is built
3. **CSV import is flexible**: Auto-maps common column names (name, phone, email, etc.)
4. **Bulk import uses batching**: Airtable limits 10 records per API call

---

**Session End**: 2026-01-13
**Status**: Leads section complete, ready for Angi integration
