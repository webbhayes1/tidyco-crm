# Session 31 Handoff - 2026-01-16

## Session Summary
Implemented unsaved changes navigation guard across all forms. Users are now prompted to save or discard changes when navigating away from any edit page with unsaved modifications.

## What Was Accomplished

### Unsaved Changes Navigation Guard (Full Implementation)
**Purpose**: Prevent accidental data loss by prompting users before navigating away from forms with unsaved changes

**New Files Created**:

1. **`contexts/UnsavedChangesContext.tsx`** - Global context provider
   - Tracks dirty state per form (by formId)
   - Manages pending navigation callbacks
   - Renders confirmation modal at top level

2. **`components/UnsavedChangesModal.tsx`** - Confirmation dialog
   - Amber AlertTriangle icon (matches existing modal style)
   - "You have unsaved changes" heading
   - "Stay" and "Leave Without Saving" buttons

3. **`hooks/useUnsavedChanges.ts`** - Per-form hook
   - Takes formId, formData, initialData
   - Compares current vs initial values to detect dirty state
   - Handles beforeunload (browser refresh)
   - Handles popstate (browser back/forward buttons)
   - Returns `{ isDirty, markClean }`

4. **`components/SafeLink.tsx`** - Navigation-intercepting Link wrapper
   - Wraps next/link
   - Intercepts navigation when form is dirty
   - Shows confirmation modal before proceeding

5. **`hooks/useSafeRouter.ts`** - Safe router wrapper
   - Wraps useRouter
   - Intercepts push/replace/back calls
   - Shows confirmation when dirty

6. **`components/Providers.tsx`** - Client-side provider wrapper
   - Wraps UnsavedChangesProvider
   - Used in root layout (server component compatible)

**Files Modified**:

- **`app/layout.tsx`** - Wrapped with Providers component
- **`components/Navigation.tsx`** - Uses SafeLink for sidebar navigation
- **`components/DataTable.tsx`** - Uses useSafeRouter instead of window.location.href
- **`components/ClientForm.tsx`** - Added useUnsavedChanges hook, markClean() on save
- **`components/CleanerForm.tsx`** - Added useUnsavedChanges hook, markClean() on save
- **`components/JobForm.tsx`** - Added useUnsavedChanges hook, markClean() on save
- **`components/TeamForm.tsx`** - Added useUnsavedChanges hook, markClean() on save
- **`components/LeadForm.tsx`** - Added useUnsavedChanges hook, markClean() on save
- **`components/InvoiceForm.tsx`** - Added useUnsavedChanges hook, markClean() on save

## Navigation Types Handled

| Type | How It's Handled |
|------|------------------|
| Sidebar navigation (Link clicks) | SafeLink intercepts, shows modal |
| Cancel button | useSafeRouter intercepts |
| Save then navigate | markClean() called first, no modal |
| DataTable row clicks | useSafeRouter instead of window.location |
| Browser refresh (F5, Cmd+R) | beforeunload shows browser dialog |
| Browser back/forward buttons | popstate handler intercepts, shows modal |

## How It Works

1. When a form mounts, it registers with the context and captures initial data
2. As user types, form compares current values to initial - if different, marks dirty
3. When dirty and user tries to navigate:
   - For Links: SafeLink prevents default, shows modal
   - For router.push: useSafeRouter shows modal first
   - For browser back: popstate pushes state back, shows modal
   - For browser refresh: beforeunload shows native browser dialog
4. "Stay" - closes modal, user stays on page
5. "Leave Without Saving" - clears dirty state, proceeds with navigation
6. On save - form calls markClean() before navigation, no modal shown

## Airtable Changes
None - this is purely a frontend feature

## Commits Pushed
- None this session - changes need to be committed

## Deployment Status
- Local: Not running
- Production: https://tidyco-crm.vercel.app (needs redeploy after push)

## Known Issues
- None identified this session

## Next Session Recommendations
1. **Commit and push** all changes from this session
2. **Test** unsaved changes guard:
   - Edit a client, change a field, click sidebar nav → should show modal
   - Click "Stay" → should return to form with data intact
   - Click "Leave Without Saving" → should navigate away
   - Edit and save → should navigate without modal
   - Edit, then browser back → should show modal
   - Edit, then refresh → should show browser native dialog
3. Consider adding visual indicator showing form has unsaved changes (optional enhancement)

## Files to Read Next Session
1. This file (`custom/.claude/HANDOFF.md`)
2. `crm/.claude/STATUS.md`
3. `crm/.claude/decisions/airtable-changelog.md`
