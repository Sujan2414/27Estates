Review the currently open or selected React component file for the following:

**Stack context:** Next.js 19, React 19, Tailwind CSS v4, Radix UI primitives, Framer Motion, Lucide React icons, class-variance-authority (CVA), clsx + tailwind-merge, CSS Modules (some legacy files).

**Check for:**

1. **Accessibility** — ARIA roles, keyboard navigation, focus management, alt text on images, color contrast issues, screen-reader labels on icon-only buttons
2. **Tailwind usage** — avoid inline `style={}` when Tailwind classes suffice, use `cn()` (clsx + tailwind-merge) for conditional classes, avoid redundant or conflicting classes
3. **CVA patterns** — if the component has variants, suggest CVA if not already used; check that variants are exhaustive and typed
4. **Framer Motion** — check for `layout` prop where list items reorder, use `AnimatePresence` for exit animations, avoid animating layout-affecting properties (width/height) when transform equivalents exist
5. **Radix UI** — ensure Radix primitives are used for interactive widgets (dialogs, dropdowns, tooltips) rather than custom implementations; check that `asChild` is used correctly
6. **Performance** — unnecessary re-renders, missing `useMemo`/`useCallback` for expensive ops, large components that should be split, images missing `next/image`
7. **TypeScript** — missing or overly broad types, `any` usage, props that should be typed with discriminated unions
8. **Code quality** — magic numbers, duplicated logic, overly long JSX trees that need extraction

For each issue found, show the problematic code snippet and a corrected version. Be specific about line numbers. At the end, give an overall score (1-10) and the top 3 priorities to fix.
