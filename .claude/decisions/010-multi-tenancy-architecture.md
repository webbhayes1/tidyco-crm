# Decision 010: Multi-Tenancy Architecture for SaaS Resale

**Date**: 2026-01-14
**Status**: Planned (Future Implementation)
**Context**: Architecture for selling CRM to multiple cleaning businesses

---

## Problem

To resell this CRM to other cleaning businesses, we need:
1. User authentication (each customer logs into their own account)
2. Data isolation (each customer has their own data)
3. Service isolation (Twilio subaccounts per customer)
4. Billing/subscriptions

---

## Options Considered

### Option 1: Separate Airtable Base per Customer (MVP)

```
Customer A → Airtable Base A → Twilio Subaccount A
Customer B → Airtable Base B → Twilio Subaccount B
```

**How it works:**
- Clone Airtable base template for each new customer
- Store `airtableBaseId` and `twilioSubaccountSid` in central tenants table
- On login, fetch tenant config and use for all API calls

**Pros:**
- Complete data isolation
- Easy to understand
- Works with current codebase
- Quick to implement

**Cons:**
- Manual onboarding (clone base, create subaccount)
- Airtable's 1,200 free records per base limit
- Harder to manage at scale (50+ customers)

**Best for:** MVP, first 10 customers

---

### Option 2: Real Database with Row-Level Security (Scale)

**Stack:**
- **Supabase** or **PlanetScale** for data (PostgreSQL/MySQL)
- **Clerk** or **Supabase Auth** for authentication
- Keep Airtable only for internal ops/templates

```
┌─────────────────────────────────────────────────┐
│                   TidyCo CRM                     │
├─────────────────────────────────────────────────┤
│  Clerk/Supabase Auth (login, orgs, roles)       │
├─────────────────────────────────────────────────┤
│  Supabase Database                               │
│  ┌─────────────────────────────────────────────┐│
│  │ leads        │ tenant_id │ name │ phone ... ││
│  │ jobs         │ tenant_id │ ...              ││
│  │ clients      │ tenant_id │ ...              ││
│  │ invoices     │ tenant_id │ ...              ││
│  │ cleaners     │ tenant_id │ ...              ││
│  │ teams        │ tenant_id │ ...              ││
│  └─────────────────────────────────────────────┘│
│  Row-Level Security: tenant_id = auth.user_id   │
├─────────────────────────────────────────────────┤
│  Twilio Subaccounts (per tenant)                │
└─────────────────────────────────────────────────┘
```

**Pros:**
- Scalable to thousands of customers
- Proper security with RLS
- No record limits
- Single codebase, single deployment

**Cons:**
- Requires migration from Airtable
- More complex setup
- Learning curve for Supabase/Clerk

**Best for:** Scale (10+ customers)

---

### Option 3: Airtable + Tenant ID (Not Recommended)

Add `Tenant ID` field to every table, filter all queries.

**Pros:** No migration needed
**Cons:** Data leak risk, Airtable limits, not truly isolated

**Verdict:** Avoid - too risky for production

---

## Recommended Approach

### Phase 1: MVP (First 10 Customers)
Use **Option 1** - Separate Airtable bases

1. Create Airtable base template with all tables
2. Build simple `tenants` table in Vercel KV or Supabase:
   ```typescript
   interface Tenant {
     id: string;
     name: string;
     airtableBaseId: string;
     twilioSubaccountSid: string;
     twilioAuthToken: string;
     twilioPhoneNumber: string;
     stripeCustomerId: string;
     plan: 'starter' | 'pro' | 'enterprise';
     createdAt: string;
   }
   ```
3. Add Clerk for authentication
4. Modify `lib/airtable.ts` to accept dynamic base ID
5. Create onboarding flow to clone base + create subaccount

### Phase 2: Scale (10+ Customers)
Migrate to **Option 2** - Supabase

1. Set up Supabase project with all tables
2. Enable Row-Level Security policies
3. Migrate data from Airtable bases
4. Update all API routes to use Supabase client
5. Keep Twilio subaccounts (already isolated)

---

## Implementation Checklist

### Phase 1 (MVP)
- [ ] Set up Clerk authentication
- [ ] Create tenants table (Vercel KV or Supabase)
- [ ] Build Airtable base template
- [ ] Create onboarding script (clone base, create Twilio subaccount)
- [ ] Modify lib/airtable.ts for dynamic base ID
- [ ] Add tenant context to all API routes
- [ ] Set up Stripe for billing
- [ ] Build admin dashboard for tenant management

### Phase 2 (Scale)
- [ ] Set up Supabase project
- [ ] Create database schema with tenant_id
- [ ] Enable Row-Level Security
- [ ] Build migration script from Airtable
- [ ] Update all API routes
- [ ] Test data isolation
- [ ] Deprecate Airtable dependency

---

## Tech Stack for Multi-Tenancy

| Component | Tool | Purpose |
|-----------|------|---------|
| Auth | Clerk | Login, signup, password reset, SSO |
| Organizations | Clerk Organizations | Team members per company |
| Tenant Config | Vercel KV → Supabase | Map user → tenant settings |
| Data (MVP) | Airtable (per tenant) | Leads, jobs, clients |
| Data (Scale) | Supabase PostgreSQL | All business data |
| SMS | Twilio Subaccounts | Isolated phone numbers per tenant |
| Billing | Stripe | Subscriptions, usage billing |
| Email | Resend or SendGrid | Transactional emails |

---

## Pricing Model Considerations

| Plan | Price | Limits |
|------|-------|--------|
| Starter | $49/mo | 500 leads, 2 users, basic SMS |
| Pro | $99/mo | Unlimited leads, 5 users, AI drips |
| Enterprise | $249/mo | Unlimited everything, API access, priority support |

---

## Security Considerations

1. **Data Isolation**: Each tenant's data must be completely isolated
2. **API Keys**: Store Twilio/Airtable keys encrypted per tenant
3. **Audit Logging**: Track who accessed what data
4. **GDPR/CCPA**: Allow data export and deletion per tenant
5. **Backups**: Per-tenant backup and restore capability

---

## Related Decisions

- [009-sms-drip-architecture.md](./009-sms-drip-architecture.md) - Twilio subaccounts for SMS isolation
- Future: Authentication provider selection
- Future: Database migration plan

---

## References

- [Clerk Multi-Tenancy](https://clerk.com/docs/organizations/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Twilio Subaccounts](https://www.twilio.com/docs/iam/api/subaccounts)
- [Stripe Billing](https://stripe.com/docs/billing)
