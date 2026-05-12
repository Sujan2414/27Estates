Generate a new React component for this project based on the description the user provides as arguments to this command.

**Stack:** Next.js 19, React 19, Tailwind CSS v4, Radix UI, Framer Motion, Lucide React, CVA, clsx + tailwind-merge.

**Rules:**
- Use TypeScript with explicit prop types (interface, not type alias for props)
- Use `cn()` helper (clsx + tailwind-merge) for conditional classes — import from `@/lib/utils`
- Use CVA for any component that has style variants (size, color, state)
- Use Radix UI primitives for interactive widgets (don't hand-roll dialogs, dropdowns, tooltips)
- Use `next/image` for all images
- Use Lucide React for icons
- Use Framer Motion for any animations — prefer `motion.div` with `whileHover`, `whileTap`, `layout`, and `AnimatePresence`
- Use Tailwind v4 classes (no `@apply` in component files unless truly necessary)
- Keep components in `src/components/` unless it's a page-specific component, in which case co-locate with the page
- Add `"use client"` only if the component uses hooks or browser APIs
- Do NOT add prop comments/JSDoc unless the prop name is genuinely non-obvious
- Match the visual style of existing components: clean, modern real-estate aesthetic

After generating the component, also show where it should be placed and how to import it.
