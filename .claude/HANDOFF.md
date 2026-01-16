# Custom CRM Session Handoff

**Date**: 2026-01-15
**Session**: 23 (Address Autocomplete & Draft Saving)
**Implementation**: Custom (Next.js)
**Focus Area**: Google Places autocomplete and form draft persistence

---

## Session Summary

Completed two deferred items from Session 21:
1. **Address Autocomplete** - Google Places API integration for address fields
2. **Draft Saving** - Auto-save form data to localStorage when navigating away

Also fixed a critical freezing issue with the initial autocomplete implementation and added City/State/Zip fields to JobForm.

---

## What Was Accomplished

### 1. Address Autocomplete (Google Places API)

**Created `components/AddressAutocomplete.tsx`**:
- Uses Google Places AutocompleteService for address suggestions
- Custom dropdown UI (not Google's default widget - caused freezing)
- Debounced search (300ms) to avoid excessive API calls
- Keyboard navigation (arrow keys, enter, escape)
- Click outside to close dropdown
- Parses address components (street, city, state, zip)

**Integration**:
- ClientForm: Auto-fills city, state, zip when address selected
- LeadForm: Auto-fills city, state, zip when address selected
- JobForm: Auto-fills city, state, zip when address selected
- CleanerForm: Uses fullAddress selection

**Google Cloud Setup Required**:
- Enable **Maps JavaScript API** (required)
- Enable **Places API** (required)
- API Key: Set in `.env.local` as `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

### 2. Draft Saving (localStorage)

**Created `hooks/useDraftSave.ts`**:
- Auto-saves form data to localStorage every 1 second (debounced)
- 24-hour expiration on drafts
- Returns: `{ hasDraft, draftData, clearDraft, saveDraft, restoreDraft }`

**Created `components/DraftRestoreModal.tsx`**:
- Modal asking user to restore or discard unsaved changes
- Shows on form mount if draft exists

**Integration**:
- ClientForm: Draft save for new clients
- LeadForm: Draft save for new leads
- JobForm: Draft save for new jobs
- CleanerForm: Draft save for new cleaners

### 3. JobForm Enhancements

**Added City, State, Zip Code fields**:
- Updated Job type in `types/airtable.ts`
- Added 3-column layout for City/State/Zip
- AddressAutocomplete auto-fills these fields

**Auto-fill from Client**:
- When selecting a client, auto-fills: address, apt/unit, city, state, zip, bedrooms, bathrooms, hourly rate

### 4. Bug Fixes

**Fixed AddressAutocomplete Freezing**:
- Initial implementation used Google's Autocomplete widget bound to input
- This caused infinite loops/re-renders when typing
- **Solution**: Rewrote to use AutocompleteService manually with custom dropdown
- Debounced search prevents excessive API calls

### 5. Project Organization

**Created `.claude/BACKLOG.md`**:
- New file for tracking future enhancement requests
- Added "International Address Support" as first backlog item (currently US-only)

---

## Files Created

| File | Purpose |
|------|---------|
| `components/AddressAutocomplete.tsx` | Google Places autocomplete component |
| `hooks/useDraftSave.ts` | localStorage draft persistence hook |
| `components/DraftRestoreModal.tsx` | Modal for restoring saved drafts |
| `.claude/BACKLOG.md` | Future enhancements backlog |

## Files Modified

| File | Changes |
|------|---------|
| `components/ClientForm.tsx` | Added AddressAutocomplete, draft save |
| `components/LeadForm.tsx` | Added AddressAutocomplete, draft save |
| `components/JobForm.tsx` | Added AddressAutocomplete, city/state/zip fields, client auto-fill, draft save |
| `components/CleanerForm.tsx` | Added AddressAutocomplete, draft save |
| `types/airtable.ts` | Added City, State, Zip Code to Job interface |
| `.env.local` | Added NEXT_PUBLIC_GOOGLE_PLACES_API_KEY |
| `CLAUDE.md` | Added link to BACKLOG.md |

---

## Environment Variables Added

```bash
# Google Places API (for address autocomplete)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyB350uQ-p-dyZsHEJLLMyPVOCy1Ry9_b0I
```

**Important**: For production (Vercel), add this env var in Vercel dashboard.

---

## Technical Notes

### AddressAutocomplete Architecture

The component uses Google's AutocompleteService instead of the Autocomplete widget:

```
User types → Debounce 300ms → AutocompleteService.getPlacePredictions()
                                    ↓
                            Custom dropdown renders predictions
                                    ↓
User selects → PlacesService.getDetails() → Parse components → Callback
```

This approach:
- Avoids input hijacking (no freezing)
- Full control over UI/UX
- Keyboard navigation support
- Clean separation of concerns

### Country Restriction

Currently hardcoded to US addresses:
```typescript
componentRestrictions: { country: 'us' }
```

Noted in BACKLOG.md for future settings-based configuration.

---

## Build Status

Dev server running successfully. All changes compile without errors.

---

## Known Issues / Limitations

1. **Address autocomplete US-only**: Hardcoded to US addresses (noted in BACKLOG.md)
2. **Google API costs**: Places API has usage costs beyond free tier
3. **Production API key**: Need to add to Vercel environment variables

---

## Next Session Recommendations

1. **Deploy to production**: Push changes to Vercel, add Google API key to env vars
2. **Test draft restore**: Verify draft modal appears correctly after page refresh
3. **Continue with remaining Session 21 items** (if any)
4. **n8n workflows**: Continue workflow development

---

**Session End**: 2026-01-15
**Status**: Address autocomplete and draft saving complete
