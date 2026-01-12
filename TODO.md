# TidyCo CRM - Development TODO

**Last Updated:** 2026-01-09
**Current Progress:** 75% Complete

---

## 🔴 Priority 1: Core CRUD Operations

### Jobs - New Booking Feature
- [ ] Create `app/(dashboard)/jobs/new/page.tsx`
  - Client component that wraps JobForm
  - Handles form submission to API
  - Redirects to /jobs on success

- [ ] Create `app/api/clients/route.ts`
  - GET endpoint returning all clients
  - Used by JobForm to populate client dropdown

- [ ] Create `app/api/cleaners/route.ts`
  - GET endpoint returning active cleaners
  - Used by JobForm to populate cleaner dropdown

- [ ] Create `app/api/jobs/route.ts`
  - POST endpoint to create new job in Airtable
  - Validate required fields
  - Return created job or error

### Jobs - Edit Existing
- [ ] Create `app/(dashboard)/jobs/[id]/page.tsx`
  - Fetch existing job data
  - Pass to JobForm as `job` prop
  - Handle update on save

- [ ] Create `app/api/jobs/[id]/route.ts`
  - GET single job by ID
  - PUT to update existing job
  - DELETE to remove job

---

## 🟡 Priority 2: Client Management

### Clients - Create New
- [ ] Create `app/(dashboard)/clients/new/page.tsx`
  - Use ClientForm component
  - Handle submission

- [ ] Update `app/api/clients/route.ts`
  - Add POST handler for new client

### Clients - Edit Existing
- [ ] Create `app/(dashboard)/clients/[id]/page.tsx`
  - Fetch client data
  - Pass to ClientForm

- [ ] Create `app/api/clients/[id]/route.ts`
  - GET single client
  - PUT to update
  - DELETE to remove

---

## 🟡 Priority 3: Cleaner Management

### Cleaners - Create New
- [ ] Create `app/(dashboard)/cleaners/new/page.tsx`
  - Use CleanerForm component
  - Handle submission

- [ ] Update `app/api/cleaners/route.ts`
  - Add POST handler for new cleaner

### Cleaners - Edit Existing
- [ ] Create `app/(dashboard)/cleaners/[id]/page.tsx`
  - Fetch cleaner data
  - Pass to CleanerForm

- [ ] Create `app/api/cleaners/[id]/route.ts`
  - GET single cleaner
  - PUT to update
  - DELETE to remove

---

## 🟢 Priority 4: Additional Features

### Quotes Management
- [ ] Create quotes list page (currently just shows in nav)
- [ ] Create new quote form
- [ ] Add quote detail/edit pages
- [ ] Convert quote to job functionality

### Calendar Enhancements
- [ ] Add "Create Booking" button on calendar pages
- [ ] Pre-fill date/time when creating from calendar
- [ ] Drag-and-drop to reschedule (stretch goal)
- [ ] Click job to view/edit details

### Dashboard Improvements
- [ ] Make jobs table rows clickable to edit
- [ ] Add "Quick Actions" for common tasks
- [ ] Add date range filter for metrics

---

## 🔵 Priority 5: Polish & UX

### Error Handling
- [ ] Add toast notifications for success/error
- [ ] Better error messages throughout
- [ ] Loading states for all forms
- [ ] Validation feedback on forms

### Navigation
- [ ] Add breadcrumbs to detail pages
- [ ] Highlight active nav item (partially done)
- [ ] Add search functionality
- [ ] Quick command palette (Cmd+K)

### Mobile Responsive
- [ ] Test all pages on mobile
- [ ] Adjust table layouts for small screens
- [ ] Mobile-friendly forms
- [ ] Responsive calendar views

---

## ⚪ Optional: Authentication & Deployment

### Clerk Authentication
- [ ] Get Clerk API keys
- [ ] Add keys to .env.local
- [ ] Uncomment ClerkProvider in app/layout.tsx
- [ ] Uncomment UserButton in Navigation.tsx
- [ ] Test sign in/out flow
- [ ] Add protected routes middleware

### Deployment
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel
- [ ] Test production build
- [ ] Set up custom domain (optional)

---

## 📋 API Routes Needed

### Existing (None yet)
Currently all data fetched server-side in page components.

### To Create
```
app/api/
├── clients/
│   ├── route.ts          # GET all, POST new
│   └── [id]/
│       └── route.ts      # GET one, PUT update, DELETE
├── cleaners/
│   ├── route.ts          # GET all, POST new
│   └── [id]/
│       └── route.ts      # GET one, PUT update, DELETE
├── jobs/
│   ├── route.ts          # GET all, POST new
│   └── [id]/
│       └── route.ts      # GET one, PUT update, DELETE
└── quotes/
    ├── route.ts          # GET all, POST new
    └── [id]/
        └── route.ts      # GET one, PUT update, DELETE
```

---

## 🧪 Testing Checklist

### Before Marking Complete
- [ ] All 7 pages load without errors
- [ ] Can create new job from dashboard
- [ ] Can edit existing job
- [ ] Can create new client
- [ ] Can edit existing client
- [ ] Can create new cleaner
- [ ] Can edit existing cleaner
- [ ] Calendar shows all jobs correctly
- [ ] Dashboard metrics calculate properly
- [ ] No console errors in browser
- [ ] No server errors in terminal

---

## 🐛 Known Bugs

None currently! All pages working as of 2026-01-09.

---

## 💡 Future Enhancements (Post-MVP)

- [ ] Email notifications for upcoming jobs
- [ ] SMS reminders to cleaners
- [ ] Invoice generation and sending
- [ ] Payment tracking
- [ ] Cleaner availability calendar
- [ ] Client portal (separate app)
- [ ] Mobile app (React Native)
- [ ] Reporting and analytics
- [ ] Automated recurring job creation
- [ ] Integration with Google Calendar
- [ ] Integration with QuickBooks

---

**Next Session Start Here:**
👉 Create the "New Booking" feature (Priority 1, Jobs section)
