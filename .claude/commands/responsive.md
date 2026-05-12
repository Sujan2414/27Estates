Make a component or page fully responsive using Tailwind CSS v4 breakpoints.

**Stack:** Tailwind CSS v4, Next.js 19, React 19.

**Breakpoints (Tailwind defaults):**
- `sm` — 640px (large phones, landscape)
- `md` — 768px (tablets)
- `lg` — 1024px (small laptops)
- `xl` — 1280px (desktops)
- `2xl` — 1536px (large screens)

**When run on a component:**
1. Read it and identify layout issues at each breakpoint
2. Fix: grids that don't collapse, text that overflows, images that crop badly, hidden nav that lacks a mobile menu, fixed widths that break on small screens
3. Apply mobile-first approach (base = mobile, then `sm:`, `md:` etc for larger)
4. Check touch targets are at least 44×44px on mobile
5. Ensure padding/margin is reduced appropriately on small screens

**When run with a description:** Implement the described responsive behavior.

Show the diff of all Tailwind class changes made. Flag any cases where a CSS Module override was needed.
