# TidyCo CRM - Design Guide

**Design Philosophy**: Clean, modern, user-friendly interface inspired by Apple's design language combined with the approachability of Care.com. Smooth, easy on the eyes, and professional.

---

## 🎨 Brand Colors

### Primary Colors (from TidyCo logo)
- **TidyCo Blue**: `#4BA3E3` - Primary brand color (buttons, accents, links)
- **TidyCo Navy**: `#1E3A5F` - Dark text, headings, professional elements
- **Light Blue**: `#E8F4FB` - Card backgrounds, hover states, subtle highlights
- **Lightest Blue**: `#F5FBFE` - Page background, soft ambient color

### Color Palette (Tailwind)
```typescript
tidyco: {
  50: '#F5FBFE',   // Lightest (backgrounds)
  100: '#E8F4FB',  // Light (cards, hover)
  200: '#C5E4F7',  // Subtle accents
  300: '#A0D4F2',  // Light accents
  400: '#75BDE9',  // Medium
  500: '#4BA3E3',  // PRIMARY - Brand blue
  600: '#3A8AC4',  // Hover state
  700: '#2D6B99',  // Active state
  800: '#1E3A5F',  // Navy - Headings
  900: '#152A45',  // Darkest
}
```

### Semantic Colors
- **Success**: Green (`bg-green-50`, `text-green-700`)
- **Warning**: Yellow (`bg-yellow-50`, `text-yellow-700`)
- **Error**: Red (`bg-red-50`, `text-red-700`)
- **Info**: TidyCo Light Blue (`bg-[#E8F4FB]`, `text-[#1E3A5F]`)

---

## 🖋️ Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```
Apple system fonts for maximum readability and native OS feel.

### Text Colors
- **Primary Text**: `#1E3A5F` (TidyCo Navy)
- **Secondary Text**: `#6B7280` (Gray-600)
- **Muted Text**: `#9CA3AF` (Gray-400)
- **Links**: `#4BA3E3` (TidyCo Blue)

### Headings
All headings use TidyCo Navy (`#1E3A5F`) with `font-semibold`:
- `h1` - Page titles, major sections
- `h2` - Section headers
- `h3` - Subsections
- `h4`, `h5`, `h6` - Smaller headings

---

## 🎯 Components

### Buttons

#### Primary Button
```tsx
<button className="btn-primary">
  Save Changes
</button>
```
- Background: TidyCo Blue (`#4BA3E3`)
- Hover: Darker blue (`#3A8AC4`)
- Active: Navy blue (`#2D6B99`)
- Shadow: Subtle on hover
- **Use for**: Primary actions, submit buttons, CTAs

#### Secondary Button
```tsx
<button className="btn-secondary">
  Cancel
</button>
```
- Background: White
- Border: Gray-200
- Hover: Light blue background (`#E8F4FB`), blue border
- **Use for**: Secondary actions, cancel buttons

#### Example
```tsx
<div className="flex gap-3">
  <button className="btn-primary">Create Job</button>
  <button className="btn-secondary">Cancel</button>
</div>
```

### Cards

#### Standard Card
```tsx
<div className="card p-6">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p>Card content goes here...</p>
</div>
```
- Background: White
- Border: Light gray (`border-gray-100`)
- Shadow: Subtle (`shadow-sm`)
- Hover: Elevated shadow (`shadow-md`)
- Border radius: `rounded-xl` (12px)

#### TidyCo Shadow Cards
```tsx
<div className="bg-white rounded-xl shadow-tidyco p-6">
  <h3>Special Card</h3>
</div>
```
- Custom shadow with TidyCo blue tint
- Use for: Important cards, featured content

### Status Badges

```tsx
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-error">Cancelled</span>
<span className="badge-info">Scheduled</span>
```

**Status Color Mapping:**
- **Active/Completed**: Green (`badge-success`)
- **Pending/Scheduled**: Blue (`badge-info`)
- **Warning/Unassigned**: Yellow (`badge-warning`)
- **Cancelled/Error**: Red (`badge-error`)

### Form Inputs

All inputs have:
- Border: `border-gray-200`
- Border radius: `rounded-lg`
- Focus: Blue ring (`focus:ring-[#4BA3E3]/20`)
- Smooth transitions

```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
  placeholder="Enter text..."
/>
```

### Navigation

The sidebar navigation uses:
- Background: White
- Active state: TidyCo light blue background
- Icons: Lucide React icons
- Hover: Smooth color transitions

---

## 📐 Layout & Spacing

### Page Background
- Main background: `#F5FBFE` (Lightest blue)
- Creates a soft, ambient feel

### Container Widths
- Max width: Full viewport
- Content padding: `p-6` or `p-8`

### Card Spacing
- Between cards: `gap-6` or `space-y-6`
- Inside cards: `p-6`

### Grid Layouts
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

---

## ✨ Animations & Transitions

### Smooth Transitions
All interactive elements have `transition-all duration-200`:
- Buttons
- Links
- Cards
- Inputs
- Hover states

### Fade In Animation
```tsx
<div className="animate-fade-in">
  Content fades in smoothly
</div>
```

### Hover Effects
- **Buttons**: Background color change + shadow elevation
- **Cards**: Shadow elevation (`shadow-sm` → `shadow-md`)
- **Links**: Color change (blue → darker blue)

---

## 🎨 Design Patterns

### 1. Page Header Pattern
```tsx
<div className="space-y-6">
  <PageHeader
    title="Dashboard"
    actions={
      <button className="btn-primary">
        + New Item
      </button>
    }
  />
  {/* Page content */}
</div>
```

### 2. Stat Cards (KPIs)
```tsx
<div className="grid grid-cols-4 gap-6">
  <StatCard
    title="Total Jobs"
    value={24}
    trend="+12%"
    icon={<Calendar />}
  />
</div>
```

### 3. Data Tables
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200">
  <DataTable
    data={items}
    columns={columns}
  />
</div>
```

### 4. Form Layout
```tsx
<form className="space-y-6">
  <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
    <h3 className="font-semibold text-lg">Section Title</h3>
    {/* Form fields */}
  </div>
</form>
```

---

## 🎯 Best Practices

### DO:
✅ Use TidyCo Blue (`#4BA3E3`) for primary actions and CTAs
✅ Use TidyCo Navy (`#1E3A5F`) for headings and important text
✅ Use Light Blue (`#E8F4FB`) for soft backgrounds and hover states
✅ Keep rounded corners consistent (`rounded-lg` for inputs, `rounded-xl` for cards)
✅ Add smooth transitions to all interactive elements
✅ Use subtle shadows for depth (`shadow-sm`, `shadow-md`)
✅ Maintain generous spacing between elements (`gap-6`, `space-y-6`)

### DON'T:
❌ Don't use harsh black (#000000) - use TidyCo Navy instead
❌ Don't use bright, saturated colors that clash with the brand
❌ Don't use sharp corners (0 border radius) - always add some rounding
❌ Don't use heavy shadows - keep them soft and subtle
❌ Don't overcrowd the interface - embrace white space
❌ Don't use more than 2-3 accent colors per page

---

## 📱 Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## 🎨 Color Usage Guide

### Where to use each color:

**TidyCo Blue (#4BA3E3)**
- Primary buttons
- Links
- Active states
- Icons for primary actions
- Progress bars
- Focus rings

**TidyCo Navy (#1E3A5F)**
- Page titles
- Section headings
- Important text
- Navigation text
- Logo text

**Light Blue (#E8F4FB)**
- Card backgrounds (alternative to white)
- Hover states
- Selected items
- Soft highlights
- Info badges

**Lightest Blue (#F5FBFE)**
- Page background
- Subtle section dividers
- Empty states
- Placeholder backgrounds

**White (#FFFFFF)**
- Primary card backgrounds
- Input backgrounds
- Modals
- Dropdowns

---

## 🖼️ Real Examples

### Dashboard KPI Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="bg-white rounded-xl shadow-tidyco p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-600">This Week</span>
      <Calendar className="w-5 h-5 text-tidyco-blue" />
    </div>
    <div className="text-3xl font-bold text-tidyco-navy">24</div>
    <div className="text-sm text-green-600">+12% from last week</div>
  </div>
</div>
```

### Status Badge in Table
```tsx
<td className="px-6 py-4">
  {status === 'Active' ? (
    <span className="badge-success">Active</span>
  ) : status === 'Scheduled' ? (
    <span className="badge-info">Scheduled</span>
  ) : (
    <span className="badge-error">Inactive</span>
  )}
</td>
```

### Form with TidyCo Branding
```tsx
<form className="space-y-6">
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-tidyco-navy mb-4">
      Contact Information
    </h3>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg
                   focus:border-tidyco-blue focus:ring-2 focus:ring-tidyco-blue/20"
        />
      </div>
    </div>
  </div>

  <div className="flex justify-end gap-3">
    <button type="button" className="btn-secondary">
      Cancel
    </button>
    <button type="submit" className="btn-primary">
      Save Changes
    </button>
  </div>
</form>
```

---

## 🚀 Quick Start

**To use the design system:**

1. All colors are available in Tailwind config
2. Use utility classes: `bg-tidyco-blue`, `text-tidyco-navy`, etc.
3. Use component classes: `btn-primary`, `card`, `badge-success`
4. Follow the patterns in existing components

**Example component:**
```tsx
export function MyComponent() {
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold text-tidyco-navy mb-4">
        Welcome to TidyCo
      </h2>
      <p className="text-gray-600 mb-6">
        Clean, modern, user-friendly interface.
      </p>
      <button className="btn-primary">
        Get Started
      </button>
    </div>
  );
}
```

---

**Design System Version**: 1.0
**Last Updated**: 2026-01-09
**Brand**: TidyCo
**Inspired By**: Apple, Care.com, Modern SaaS interfaces