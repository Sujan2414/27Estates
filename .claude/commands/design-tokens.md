Help the user work with design tokens and the Tailwind v4 theme for this project.

**Stack:** Tailwind CSS v4 (CSS-first config in `globals.css` or `tailwind.config`), Next.js 19.

**Tasks this command handles:**
1. Show all current custom design tokens (colors, spacing, typography, shadows, radii)
2. Suggest tokens that should be extracted from hardcoded values found in components
3. Add new tokens to the Tailwind config when asked
4. Convert hardcoded hex/rgb colors in components to use the design token

**When run without arguments:** Read the Tailwind config and CSS variables, then list all design tokens organized by category (colors, spacing, typography, effects).

**When run with arguments:** Treat the argument as the specific token task — e.g., `/design-tokens add a new brand color "gold" #C9A84C` or `/design-tokens find all hardcoded colors in the CRM components`.

Always show the before/after diff when making changes to the config.
