# TidyCo CRM - Custom Implementation

> **Status:** 75% Complete - Core views working, CRUD operations pending
>
> **Last Updated:** 2026-01-09

Custom Next.js 14 CRM portal for TidyCo cleaning business. Built to be white-labeled and sold as SaaS to other cleaning businesses.

---

## 🚀 Quick Start

```bash
# Navigate to project
cd "/Users/webbhayes/n8n : notion : claude/cleaning-business/crm/custom"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

**All pages should load immediately with real data from Airtable.**

---

## 📊 Current Status

### ✅ Working Features
- **Dashboard** - KPIs, upcoming jobs table, "New Booking" button
- **Jobs List** - Full table with DataTable component
- **Clients List** - Directory with search/filter
- **Cleaners List** - Directory with ratings display
- **Daily Calendar** - Timeline view with time slots
- **Weekly Calendar** - 7-day grid view
- **Monthly Calendar** - Full month grid

### ⏳ Pending Features
- Create new jobs (form exists, needs page + API)
- Edit existing jobs
- Create/edit clients
- Create/edit cleaners
- Quotes management
- Authentication (Clerk - currently disabled)

**See [TODO.md](./TODO.md) for detailed task list**

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Custom + shadcn/ui patterns |
| **Authentication** | Clerk (disabled for dev) |
| **Database** | Airtable |
| **Hosting** | Vercel (not deployed yet) |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |

### Brand Colors
- **Primary Blue:** `#4BA3E3`
- **Navy:** `#1E3A5F`

---

## 📁 Project Structure

```
app/
├── (dashboard)/           # Main dashboard layout group
│   ├── page.tsx          # Dashboard home (KPIs + jobs table)
│   ├── jobs/
│   │   └── page.tsx      # Jobs list
│   ├── clients/
│   │   └── page.tsx      # Clients list
│   ├── cleaners/
│   │   └── page.tsx      # Cleaners list
│   └── calendar/
│       ├── daily/
│       ├── weekly/
│       └── monthly/
├── api/                   # API routes (to be created)
├── layout.tsx            # Root layout
└── globals.css           # Global styles

components/
├── Navigation.tsx         # Main navigation bar
├── DataTable.tsx         # Reusable table component
├── JobForm.tsx           # Complete job creation/edit form
├── ClientForm.tsx        # Client form
└── CleanerForm.tsx       # Cleaner form

lib/
├── airtable.ts           # Airtable API functions
└── utils.ts              # Utility functions

types/
└── airtable.ts           # TypeScript interfaces
```

---

## 🔧 Environment Setup

### Required Files

**1. `.env.local`** (project root)
```bash
# Clerk Auth (currently disabled)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Airtable
AIRTABLE_API_KEY=patBAltZnF2grQ7t0.4170a8a543fcdbb14f57c2e329c3a6a4e85841dec8ff8da9e51575e3865ec88a
AIRTABLE_BASE_ID=appfisQaCpwJLlSyx
```

**2. `~/.zshrc`** (line 10)
```bash
export AIRTABLE_BASE_ID="appfisQaCpwJLlSyx"
```
⚠️ **Important:** Shell env var overrides .env.local - both must match!

### Airtable Access
- **Base:** TidyCo CRM (appfisQaCpwJLlSyx)
- **Token:** Personal Access Token created 2026-01-09
- **Scopes:** data.records:read, data.records:write, schema.bases:read
- **URL:** https://airtable.com/appfisQaCpwJLlSyx

---

## 📋 Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

---

## 🧪 Testing

### Manual Testing
```bash
# Test all pages respond
curl -s http://localhost:3000 | grep -q "TidyCo CRM" && echo "✓ Dashboard"
curl -s http://localhost:3000/jobs | grep -q "TidyCo CRM" && echo "✓ Jobs"
curl -s http://localhost:3000/clients | grep -q "TidyCo CRM" && echo "✓ Clients"
curl -s http://localhost:3000/cleaners | grep -q "TidyCo CRM" && echo "✓ Cleaners"
curl -s http://localhost:3000/calendar/daily | grep -q "TidyCo CRM" && echo "✓ Calendar"

# Test Airtable connection
curl http://localhost:3000/api/test-airtable | jq .
```

### Sample Data
- **4 Jobs** - 3 scheduled Jan 13, 1 in progress Jan 10
- **5 Clients** - 3 active, 2 inactive
- **4 Cleaners** - 3 active, 1 inactive

---

## 🔍 Key Files to Know

| File | Purpose | Lines |
|------|---------|-------|
| `lib/airtable.ts` | All Airtable API calls | 307 |
| `components/JobForm.tsx` | Complete job form | 452 |
| `app/(dashboard)/page.tsx` | Dashboard page | 188 |
| `components/Navigation.tsx` | Main nav bar | 65 |
| `types/airtable.ts` | TypeScript types | - |

---

## 📚 Documentation

- **[HANDOFF.md](./HANDOFF.md)** - Complete handoff document with schema, troubleshooting, etc.
- **[TODO.md](./TODO.md)** - Detailed task breakdown
- **This file** - Quick reference

---

## 🚨 Troubleshooting

### Server won't start
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
npm run dev
```

### Airtable errors
1. Check token hasn't expired: https://airtable.com/create/tokens
2. Verify base ID matches in .env.local AND ~/.zshrc
3. Restart server after changes

### Pages show no data
1. Check browser console for errors
2. Visit http://localhost:3000/api/test-airtable
3. Verify Airtable base has records

**See [HANDOFF.md](./HANDOFF.md) for comprehensive troubleshooting**

---

## 🎯 Next Steps

1. **Create "New Booking" page** (`/jobs/new`)
2. **Build API routes** for CRUD operations
3. **Add edit capabilities** for jobs/clients/cleaners
4. **Enable Clerk auth** (optional)
5. **Deploy to Vercel** (optional)

**Start with [TODO.md](./TODO.md) Priority 1**

---

## 🔗 Resources

- **Airtable Base:** https://airtable.com/appfisQaCpwJLlSyx
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel:** https://vercel.com

---

## 💰 Business Model

**Purpose:** White-label SaaS for cleaning businesses
**Cost:** $0/month on free tiers (Vercel + Airtable)
**Target:** Small cleaning businesses (5-20 cleaners)
**Revenue:** Subscription model ($50-200/month per business)

---

## 📞 Support

For issues or questions about this codebase, refer to:
1. [HANDOFF.md](./HANDOFF.md) - Comprehensive documentation
2. [TODO.md](./TODO.md) - Task tracking
3. Code comments in key files

---

**Version:** 1.0 (75% Complete)
**Last Verified:** 2026-01-09
