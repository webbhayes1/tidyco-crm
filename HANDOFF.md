# TidyCo CRM - Custom Build Handoff Document

**Last Updated:** 2026-01-09
**Project Status:** 75% Complete - Core functionality working, CRUD operations pending
**Development Server:** http://localhost:3000

---

## 🎯 Project Overview

Custom Next.js 14 CRM portal for TidyCo cleaning business built with TypeScript, Tailwind CSS, and Airtable backend.

### Brand Colors
- **Primary Blue:** #4BA3E3 (`text-tidyco-blue`, `bg-tidyco-blue`)
- **Navy:** #1E3A5F (`text-tidyco-navy`, `bg-tidyco-navy`)

---

## ✅ What's Working (Verified 2026-01-09)

### Pages - All 7 pages tested and functional:
1. **Dashboard** (`/`) - KPI cards, upcoming jobs table, "New Booking" button
2. **Jobs** (`/jobs`) - Full jobs list with filters and sorting
3. **Clients** (`/clients`) - Client directory with DataTable
4. **Cleaners** (`/cleaners`) - Cleaner directory with ratings
5. **Daily Calendar** (`/calendar/daily`) - Day view with time slots
6. **Weekly Calendar** (`/calendar/weekly`) - Week view
7. **Monthly Calendar** (`/calendar/monthly`) - Month grid view

### Current Data in Airtable:
- **4 Jobs** (3 scheduled for Jan 13, 1 in progress Jan 10)
- **5 Clients** (3 active, 2 inactive)
- **4 Cleaners** (3 active, 1 inactive)
- **Monthly Revenue:** Calculated from Income table
- **Metrics:** All dashboard KPIs calculating correctly

---

## 🔧 Environment Setup

### Required Environment Variables (.env.local)
```bash
# Clerk Authentication (Currently DISABLED for development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Airtable
AIRTABLE_API_KEY=patBAltZnF2grQ7t0.4170a8a543fcdbb14f57c2e329c3a6a4e85841dec8ff8da9e51575e3865ec88a
AIRTABLE_BASE_ID=appfisQaCpwJLlSyx
```

### Shell Environment (~/.zshrc)
**CRITICAL:** Line 10 in `~/.zshrc` has:
```bash
export AIRTABLE_BASE_ID="appfisQaCpwJLlSyx"  # TidyCo CRM base
```
This overrides .env.local, so both must match!

### Airtable Personal Access Token
- **Token:** patBAltZnF2grQ7t0... (stored in .env.local)
- **Scopes:** data.records:read, data.records:write, schema.bases:read
- **Base Access:** TidyCo CRM (appfisQaCpwJLlSyx)
- **Created:** 2026-01-09

---

## 📊 Airtable Schema

### Base: TidyCo CRM (appfisQaCpwJLlSyx)

#### Jobs Table
**Key Fields:**
- `Client` (Link to Clients)
- `Cleaner` (Link to Cleaners)
- `Date` (Date)
- `Time` (Text - "09:00")
- `End Time` (Text - "11:00")
- `Service Type` (Single Select: General Clean, Deep Clean, Move-Out Clean)
- `Duration Hours` (Number)
- `Client Hourly Rate` (Currency)
- `Amount Charged` (Currency)
- `Status` (Single Select: Scheduled, In Progress, Completed, Cancelled)
- `Address` (Text)
- `Special Instructions` (Long Text)
- `Recurring Job` (Checkbox)
- `Recurring Frequency` (Single Select: Weekly, Bi-Weekly, Monthly)

#### Clients Table
**Key Fields:**
- `Name` (Text)
- `Email` (Email)
- `Phone` (Phone)
- `Address` (Text)
- `Status` (Single Select: Active, Inactive)
- `Preferred Service Type` (Single Select)
- `Notes` (Long Text)
- Jobs (Link to Jobs)

#### Cleaners Table
**Key Fields:**
- `Name` (Text)
- `Email` (Email)
- `Phone` (Phone)
- `Hourly Rate` (Currency)
- `Status` (Single Select: Active, Inactive, On Leave)
- `Average Quality Score` (Number 1-10)
- Jobs (Link to Jobs)

#### Income Table
**Key Fields:**
- `Date` (Date)
- `Amount` (Currency)
- `Source` (Single Select: Job Payment, Tip, Other)
- `Job` (Link to Jobs)

#### Quotes Table
**Key Fields:**
- `Client Name` (Text)
- `Email` (Email)
- `Phone` (Phone)
- `Service Type` (Single Select)
- `Estimated Amount` (Currency)
- `Status` (Single Select: Pending, Sent, Accepted, Declined)
- `Created Date` (Date)

---

## 🚨 Known Issues & Fixes Applied

### Issue 1: Clerk Authentication Blocking (FIXED)
**Problem:** Clerk components causing errors without API keys
**Solution:** Temporarily disabled in:
- `components/Navigation.tsx` (lines 5-6, 57-59)
- `app/layout.tsx` (ClerkProvider removed)

### Issue 2: React Server Components Error (FIXED)
**Problem:** "Functions cannot be passed to Client Components"
**Solution:** Removed DataTable render functions from dashboard, using direct HTML tables instead

### Issue 3: Airtable Views Don't Exist (FIXED)
**Problem:** Code referenced 'Active Clients', 'Active Cleaners' views that don't exist
**Solution:** Changed all to use 'Grid view' and filter in code at `lib/airtable.ts:277-307`

### Issue 4: Empty Job Records (FIXED)
**Problem:** 5 job records with only computed fields, no real data
**Solution:** Deleted empty records, created 4 real jobs with actual dates/times/clients

---

## 📁 Key Files Reference

### Core Configuration
- `app/layout.tsx` - Root layout (Clerk disabled)
- `components/Navigation.tsx` - Main nav (UserButton disabled)
- `lib/airtable.ts` - All Airtable API calls
- `types/airtable.ts` - TypeScript interfaces
- `.env.local` - Environment variables
- `~/.zshrc` (line 10) - Shell env var

### Working Pages
- `app/(dashboard)/page.tsx` - Dashboard (lines 5-188)
- `app/(dashboard)/jobs/page.tsx` - Jobs list
- `app/(dashboard)/clients/page.tsx` - Clients list
- `app/(dashboard)/cleaners/page.tsx` - Cleaners list
- `app/(dashboard)/calendar/daily/page.tsx` - Daily calendar
- `app/(dashboard)/calendar/weekly/page.tsx` - Weekly calendar
- `app/(dashboard)/calendar/monthly/page.tsx` - Monthly calendar

### Existing Forms (Client Components)
- `components/JobForm.tsx` (420 lines) - Complete job form with all fields
- `components/ClientForm.tsx` - Client creation/edit form
- `components/CleanerForm.tsx` - Cleaner creation/edit form

### Helper Functions (lib/airtable.ts)
- `getDashboardMetrics()` - KPI calculations (lines 277-307)
- `getUpcomingJobs()` - Jobs for next 7 days
- `getJobs()` - All jobs with optional view
- `getClients()` - All clients
- `getCleaners()` - All cleaners
- `getQuotes()` - All quotes
- `getIncomeThisMonth()` - Revenue calculation

---

## 🔨 Next Steps (In Priority Order)

### 1. Create "New Booking" Functionality
**Files to create:**
- `app/(dashboard)/jobs/new/page.tsx` - Wraps JobForm component
- `app/api/clients/route.ts` - GET endpoint for client list
- `app/api/cleaners/route.ts` - GET endpoint for cleaner list
- `app/api/jobs/route.ts` - POST endpoint to create new job

**JobForm Requirements:**
- Fetches `/api/clients` and `/api/cleaners` on mount (line 43-50)
- Calls `onSave` prop with job data (line 82)
- Expects Airtable record format with linked record IDs

**Example Implementation:**
```typescript
// app/(dashboard)/jobs/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobForm } from '@/components/JobForm';

export default function NewJobPage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push('/jobs');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-tidyco-navy">New Booking</h1>
      <JobForm onSave={handleSave} onCancel={() => router.push('/jobs')} />
    </div>
  );
}
```

### 2. Create Job Detail/Edit Page
**Files to create:**
- `app/(dashboard)/jobs/[id]/page.tsx` - Edit existing job
- `app/api/jobs/[id]/route.ts` - GET single job, PUT update, DELETE

### 3. Create Client CRUD
**Files to create:**
- `app/(dashboard)/clients/new/page.tsx` - New client form
- `app/(dashboard)/clients/[id]/page.tsx` - Edit client
- `app/api/clients/route.ts` - POST new client
- `app/api/clients/[id]/route.ts` - GET, PUT, DELETE

### 4. Create Cleaner CRUD
**Files to create:**
- `app/(dashboard)/cleaners/new/page.tsx` - New cleaner form
- `app/(dashboard)/cleaners/[id]/page.tsx` - Edit cleaner
- `app/api/cleaners/route.ts` - POST new cleaner
- `app/api/cleaners/[id]/route.ts` - GET, PUT, DELETE

### 5. Enable Clerk Authentication (Optional)
**Requirements:**
- Get Clerk API keys from https://dashboard.clerk.com
- Add keys to .env.local
- Uncomment ClerkProvider in `app/layout.tsx`
- Uncomment UserButton in `components/Navigation.tsx`
- Restart dev server

---

## 🔍 Troubleshooting Guide

### Server Won't Start
1. Check if port 3000 is in use: `lsof -i :3000`
2. Kill process: `kill -9 <PID>`
3. Restart: `npm run dev`

### Airtable Authorization Errors
1. Verify `AIRTABLE_API_KEY` in .env.local matches current token
2. Check token hasn't expired at https://airtable.com/create/tokens
3. Verify `AIRTABLE_BASE_ID` in both .env.local AND ~/.zshrc match
4. Restart server after any changes

### "Cannot Pass Functions to Client Components" Error
- Dashboard was fixed by removing DataTable render functions
- If error appears elsewhere, replace render functions with direct HTML rendering
- See `app/(dashboard)/page.tsx:137-160` for example

### Pages Show No Data
1. Check Airtable MCP connection: Use MCP tools to list records
2. Verify records have actual data (not just computed fields)
3. Check browser console for API errors
4. Test API endpoint directly: `curl http://localhost:3000/api/test-airtable`

### Calendar Pages Not Showing Jobs
1. Verify job records have Date and Time fields populated
2. Check date format is YYYY-MM-DD
3. Verify Time format is "HH:MM" (24-hour)
4. Look at browser console for date parsing errors

---

## 🧪 Testing Commands

```bash
# Start dev server
npm run dev

# Test all pages are responding
curl -s http://localhost:3000 | grep -q "TidyCo CRM" && echo "✓ Dashboard OK"
curl -s http://localhost:3000/jobs | grep -q "TidyCo CRM" && echo "✓ Jobs OK"
curl -s http://localhost:3000/clients | grep -q "TidyCo CRM" && echo "✓ Clients OK"
curl -s http://localhost:3000/cleaners | grep -q "TidyCo CRM" && echo "✓ Cleaners OK"
curl -s http://localhost:3000/calendar/daily | grep -q "TidyCo CRM" && echo "✓ Daily Calendar OK"
curl -s http://localhost:3000/calendar/weekly | grep -q "TidyCo CRM" && echo "✓ Weekly Calendar OK"
curl -s http://localhost:3000/calendar/monthly | grep -q "TidyCo CRM" && echo "✓ Monthly Calendar OK"

# Test Airtable connection
curl http://localhost:3000/api/test-airtable

# Check environment variables
curl http://localhost:3000/api/test-env
```

---

## 📝 Development Notes

### Why Clerk is Disabled
Authentication was temporarily disabled to speed up development and avoid blocking on API key setup. All pages are currently publicly accessible. Re-enable before production deployment.

### Field Name Mismatches
The JobForm uses some field names that don't exist in Airtable:
- Form uses: `jobDate`, `startTime`, `endTime`
- Airtable has: `Date`, `Time`, `End Time`

The form handles conversion on lines 58-80 of `components/JobForm.tsx`.

### Why Shell Environment Variable Matters
Next.js loads environment variables in this order:
1. Shell environment (highest priority)
2. .env.local
3. .env

The shell variable in ~/.zshrc was set to a different base ID and was overriding .env.local, causing authorization errors even after updating .env.local.

### Sample Data Creation
All sample jobs were created on 2026-01-09 using Airtable MCP tools:
- 3 jobs scheduled for Jan 13, 2026
- 1 job in progress Jan 10, 2026
- All linked to real clients and cleaners
- All have proper dates, times, and amounts

---

## 🚀 Quick Start for Next Session

1. **Verify server is running:**
   ```bash
   cd "/Users/webbhayes/n8n : notion : claude/cleaning-business/crm/custom"
   npm run dev
   ```

2. **Check all pages load:**
   Open http://localhost:3000 and click through all nav items

3. **Start with "New Booking" feature:**
   - Create `/app/(dashboard)/jobs/new/page.tsx`
   - Create `/app/api/clients/route.ts`
   - Create `/app/api/cleaners/route.ts`
   - Create `/app/api/jobs/route.ts`

4. **Test the form:**
   - Navigate to http://localhost:3000/jobs/new
   - Fill out form and submit
   - Verify job appears in Airtable
   - Verify job shows on dashboard and calendar

---

## 🎯 End Goal

Complete CRUD portal where users can:
- ✅ View dashboard with metrics
- ✅ Browse jobs, clients, cleaners
- ✅ See calendar views (daily/weekly/monthly)
- ⏳ Create new bookings (jobs)
- ⏳ Edit existing jobs
- ⏳ Create/edit clients
- ⏳ Create/edit cleaners
- ⏳ Manage quotes
- ⏳ (Optional) Deploy to Vercel
- ⏳ (Optional) Enable authentication

**Estimated Completion:** ~25% remaining work (mostly CRUD operations)

---

## 📞 Contact & Resources

- **Airtable Base:** https://airtable.com/appfisQaCpwJLlSyx
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Document Version:** 1.0
**Last Verified:** 2026-01-09 at 18:30 PST
