Audit the currently open or specified page file for UX, design, and performance issues.

**Stack:** Next.js 19, React 19, Tailwind CSS v4, Radix UI, Framer Motion, Lucide React.

**Audit areas:**

### Visual Design
- Inconsistent spacing (check if padding/margin values follow a consistent scale)
- Inconsistent typography (font sizes, weights, line-heights)
- Missing hover/focus states on interactive elements
- Color usage inconsistencies
- Mobile responsiveness issues (missing `sm:`/`md:`/`lg:` breakpoints)

### UX & Interaction
- CTAs — are primary actions obvious? Is there a clear visual hierarchy?
- Loading states — are async operations covered with skeletons or spinners?
- Error states — are error conditions handled and communicated to the user?
- Empty states — what does the UI show when there's no data?
- Form validation — is feedback immediate and helpful?

### Performance
- Images not using `next/image`
- Missing `loading="lazy"` on below-fold images
- Large components that could be split and lazy-loaded
- Unnecessary client-side rendering (`"use client"` that could be removed)
- Missing `Suspense` boundaries for async Server Components

### Accessibility (WCAG 2.1 AA)
- Landmark regions (`<main>`, `<nav>`, `<header>`, `<footer>`)
- Heading hierarchy (h1 → h2 → h3, no skips)
- Interactive elements reachable via keyboard
- Focus indicators visible
- Form inputs have associated labels

Present findings as a prioritized list: **Critical → High → Medium → Low**. For each finding include the issue, its impact, and the fix.
