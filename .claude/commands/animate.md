Add or improve animations on a React component using Framer Motion.

**Stack:** Framer Motion v12, React 19, Next.js 19, Tailwind CSS v4.

**When run on a component or with a description of what to animate:**

1. Read the target component
2. Suggest appropriate animations for the context:
   - **Page/route transitions** — fade + slide using `AnimatePresence` in layout
   - **List items** — staggered children with `variants` and `staggerChildren`
   - **Cards** — `whileHover` scale + shadow lift
   - **Modals/sheets** — slide-up or fade-in with `AnimatePresence`
   - **CTAs/buttons** — `whileTap` scale-down for tactile feel
   - **Data loading** — skeleton shimmer or fade-in when data arrives
   - **Counters/numbers** — `useMotionValue` + `useSpring` for animated number counts
   - **Scroll-triggered** — `whileInView` with `once: true` for reveal animations

**Rules:**
- Respect `prefers-reduced-motion` — wrap variants with a check or use `useReducedMotion()`
- Use `layout` prop on items that reorder or resize
- Keep durations short: 0.15–0.3s for micro-interactions, 0.4–0.6s for page-level
- Prefer `transform` and `opacity` animations (GPU-accelerated) over layout-affecting ones
- Use `spring` physics for natural feel on interactive elements, `tween` for precise control

Show the updated component code with all animation changes highlighted in comments.
