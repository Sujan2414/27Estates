# SEO + AEO Foundation — Design Spec

**Date:** 2026-05-03
**Repo:** `21-estates-web` (Next.js — public 27estates.com + admin)
**Source roadmaps:** `27 Estates 3-Month SEO/AEO/GEO Roadmap` and `27estates-growth-playbook`
**Author:** Sujan + Claude

## 1. Goal

Bring 27estates.com from near-zero organic visibility in Bangalore to a technically sound, schema-rich, slug-URL'd, content-scaffolded site that Google + AI engines (ChatGPT, Perplexity, Gemini) can rank and cite.

This spec covers code-buildable items only. Off-platform work (link building, GBP, social, PR, App ASO) is out of scope.

## 2. Scope

### In scope (3 phases, code only)

**Phase 1 — Foundation**
1. Slug-based URLs for projects + properties (additive; UUID URLs continue to work; no 301s yet)
2. Centralized SEO/JSON-LD utility module
3. Homepage meta rewrite (Bangalore + luxury keywords)
4. Un-cloak the off-screen `<h1>` on project pages — convert to visible content
5. `FAQPage` schema on project, property, area, developer, and blog pages
6. `BreadcrumbList` schema sitewide (shared component)
7. `Article` schema on blog posts (author, datePublished, dateModified)
8. `RealEstateListing` schema parity on property detail (currently only on projects)
9. `generateMetadata` on property detail (parity with projects)
10. Sitemap split into a sitemap-index with per-type sub-sitemaps and tuned priority/changefreq

**Phase 2 — Content infrastructure**
11. Dynamic `/areas/[slug]/page.tsx` with `generateStaticParams` for 6 Bangalore micromarkets: whitefield, koramangala, sarjapur-road, hsr-layout, electronic-city, indiranagar. Page reads structured content from `src/data/areas/<slug>.ts`. Includes filtered listings widget, FAQ schema, BreadcrumbList. Long-form prose stays as TODO placeholders for the team to fill. (Top-level `/[area]` and `/bangalore/[area]` both collide with the existing `/[city]/[category]` route — `/areas/[slug]` is the conflict-free home.)
12. `/developers/[slug]/page.tsx` with `generateStaticParams` from `projects.developer_name`. Auto-lists all projects per developer with price/status/RERA. Pages: prestige-group, sobha, godrej, brigade, lodha. FAQ + Organization schema.
13. Comparison-page template for blog (e.g. "Whitefield vs Sarjapur") — reusable React component with FAQ + comparison table schema.
14. "Related Projects" + "Featured Listings" widgets to surface from blog → listings (passes link equity).

**Phase 3 — GEO / E-E-A-T signals**
15. `/market-data` static page — structured price-trend tables per Bangalore area, cite-friendly for AI.
16. About-page enhancement — founder bio, RERA registration #, years operating, `Person` schema, expanded `RealEstateAgent` schema.
17. `Review` / `AggregateRating` and `HowTo` schema where applicable.

### Out of scope

- Writing the actual long-form prose for area pages, developer hubs, market-data, or the 15-article topical authority cluster (scaffolded only — copy supplied by team)
- 301 redirects from UUID URLs (deferred to a later PR once team is comfortable with slug system)
- App Store Optimization (lives in `D:\Listings mobile version`, separate repo)
- Link building, PR outreach, guest posts, citation/directory listings
- Google Business Profile, GA4, GSC, GTM setup
- Social/viral content (Instagram Reels, LinkedIn, WhatsApp community)
- Image compression / WebP conversion (Next.js `<Image>` already serves WebP automatically; alt-text audit is in scope)

## 3. Architecture

### 3.1 Slug system (additive, non-breaking)

**Database**
- Migration adds `slug TEXT UNIQUE` column to `projects` and `properties`.
- Migration backfills slugs from `slugify(project_name + '-' + location + '-' + city)` (or property equivalent). Conflicts get a numeric suffix.
- Trigger on insert/update of `project_name` regenerates slug if NULL.
- Index on `slug` for lookup.

**Routes**
- New: `src/app/projects/[slug]/page.tsx` and `src/app/properties/[slug]/page.tsx`. Logic identical to existing `[id]` routes; lookup by `slug` instead of `id`.
- Existing `[id]` routes remain live unchanged.
- Internal link generators (`projectUrl(p)`, `propertyUrl(p)`) prefer slug, fall back to UUID. All listing cards, search results, sitemap, schema, OG tags emit slug URLs.

**Why additive:** Avoids the SEO penalty risk of mass URL changes on a production site. Slug URLs immediately benefit new traffic; old UUID URLs preserve any existing equity. The 301 flip is a separate decision for later.

### 3.2 Centralized SEO module

`src/lib/seo/schema.ts` — pure JSON-LD builders, no React. Each returns a serializable object:

- `buildOrganizationSchema()`
- `buildLocalBusinessSchema()`
- `buildRealEstateListingSchema(project | property)`
- `buildFaqSchema(qa: { question, answer }[])`
- `buildBreadcrumbSchema(crumbs: { name, url }[])`
- `buildArticleSchema(blog)`
- `buildPersonSchema(person)`

`src/components/seo/JsonLd.tsx` — thin wrapper that emits `<script type="application/ld+json">`. Existing inline `<script>` blocks in `app/layout.tsx` and `app/projects/[id]/layout.tsx` migrate to call these builders. Behavior unchanged for already-emitted schema; new schema added consistently.

### 3.3 Homepage meta + un-cloak

**Homepage (`src/app/layout.tsx`)** — title and description rewrite:
- `title.default`: `"Luxury Real Estate in Bangalore | Premium Apartments, Villas & New Project Launches | 27 Estates"`
- `description`: `"Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates — Bangalore's trusted luxury real estate advisory. Explore Whitefield, Sarjapur, Koramangala & more."`
- OG + Twitter mirror the same.

**Project page (`src/app/projects/[id]/page.tsx`)** — the off-screen `aria-hidden` block at `left: -9999px` is replaced. Concrete plan:
- Audit `ProjectDetailClient.tsx` to identify what's already user-visible (project name, price, location, etc.).
- If the client renders the project name as a heading, promote that to `<h1>`. If it doesn't, add a visible `<h1>{project.project_name}</h1>` in the server component before the client component.
- Structured fields (RERA status, possession date, total units, BHK options, amenities) are already in the `RealEstateListing` JSON-LD. They don't need duplication in hidden HTML — remove the off-screen block entirely.
- Description / specifications / highlights become visible content on the page if they aren't already (this overlaps with what the client component renders — implementation must check, not duplicate).

This is the single highest-risk change in Phase 1 because it touches visible UI. Implementation step: read `ProjectDetailClient.tsx` first, list everything it already renders, then decide what (if anything) needs to be added as visible content vs. left to JSON-LD only.

### 3.4 Area-guide system

`src/app/areas/[slug]/page.tsx` — a single dynamic route. `generateStaticParams` returns the 6 micromarket slugs. `dynamicParams = false` so any other slug 404s.

(Why not `/[area]` or `/bangalore/[area]`? Both collide with the existing `/[city]/[category]` route which already serves `/bangalore/villas`, `/bangalore/apartments`, etc. `/areas/[slug]` is the conflict-free path. URLs end up as `/areas/whitefield`, `/areas/koramangala`. Keyword density is preserved via H1, content, and schema.)

**Data source:** `src/data/areas/<slug>.ts` exports a typed object:

```ts
export const whitefield: AreaGuide = {
  slug: 'whitefield',
  name: 'Whitefield',
  city: 'Bangalore',
  state: 'Karnataka',
  intro: '<TODO: 200-word intro>',
  priceTrends: { /* TODO */ },
  topProjects: [/* auto-pulled from projects table at build time */],
  infrastructure: '<TODO>',
  investmentOutlook: '<TODO>',
  faqs: [
    { q: 'What is the average property price in Whitefield?', a: '<TODO>' },
    // 4–7 more
  ],
};
```

The page renders: H1 = `Luxury Real Estate in {Name}, Bangalore`, intro, embedded listings widget (server-fetches projects/properties filtered to that area), FAQ accordion, breadcrumb. JSON-LD: `FAQPage` + `BreadcrumbList`.

### 3.5 Developer-hub system

`src/app/developers/[slug]/page.tsx` — `generateStaticParams` returns the 5 developer slugs.

**Data source:** `src/data/developers/<slug>.ts` for static metadata (founded year, RERA #, brief). Project list pulled live from Supabase at build/request time, filtered by `developer_name`.

Page renders: H1 = `{Developer} Projects in Bangalore`, brief, RERA + delivery track record, list of projects with price/status badges, FAQ. JSON-LD: `Organization` (for the developer) + `FAQPage` + `BreadcrumbList`.

### 3.6 Sitemap split

Replace single `src/app/sitemap.ts` with a sitemap-index pattern. Next.js supports this via multiple sitemap files. New structure:

- `src/app/sitemap.ts` → returns sitemap-index pointing to children
- `src/app/projects/sitemap.ts` → projects only
- `src/app/properties/sitemap.ts` → properties only
- `src/app/blog/sitemap.ts` → blog only
- `src/app/areas/sitemap.ts` → area pages
- `src/app/developers/sitemap.ts` → developer pages

Priority tuning: project & property `0.8`, area & developer `0.85`, blog `0.7`, homepage `1.0`.

### 3.7 Property page parity

`src/app/properties/[id]/layout.tsx` gets `generateMetadata` and `RealEstateListing` JSON-LD mirroring what `projects/[id]/layout.tsx` already does.

### 3.8 Market-data page

`src/app/market-data/page.tsx` — static page. Tables show `Area | Avg ₹/sqft Q1 2026 | YoY Δ | Top Project`. Initial data is placeholder values committed in `src/data/market-data.ts` for the team to fill. Dataset schema, Article schema, BreadcrumbList.

### 3.9 About + E-E-A-T

`src/app/about/page.tsx` (create or enhance) — founder bio, RERA #, year founded, team size, addresses, certifications. JSON-LD: `Person` for founder, expanded `RealEstateAgent` with `aggregateRating` (only if real reviews exist; no fake numbers).

### 3.10 Phase-2 supporting components

- `src/components/blog/ComparisonTemplate.tsx` — reusable comparison-page React component (e.g. "Whitefield vs Sarjapur"). Takes `{ leftItem, rightItem, criteria[], faqs[] }` and renders a comparison table + FAQ schema. Used from `/blog/[slug]` when a post's frontmatter type is `comparison`.
- `src/components/blog/RelatedProjects.tsx` and `RelatedListings.tsx` — server components rendered at the bottom of `/blog/[slug]`. Read post metadata (referenced developer, area) and surface 3–4 matching projects or properties. Internal links pass equity from blog → listings (item 14 in scope).

## 4. Data flow

- Build time: `generateStaticParams` for area + developer slugs ensures these pages are pre-rendered & in the static sitemap. Project/property pages remain dynamic (large set, frequently changing).
- Request time: Project/property/blog pages fetch from Supabase server-side, build schema via `src/lib/seo/schema.ts`, emit JSON-LD via `<JsonLd>` component.
- Sitemap: Each `sitemap.ts` queries Supabase for its slice and returns slug URLs (with UUID URLs no longer in the sitemap — Google deprioritizes URLs not in the sitemap, which is the soft path toward eventual 301s).

## 5. Error handling

- Slug lookup miss → 404 (Next.js `notFound()`)
- Supabase fetch failure during sitemap generation → log + return static-only routes (don't 500 the whole sitemap)
- Schema builders → if a required field is missing, return `null` and the JsonLd component skips emission. Never emit invalid JSON-LD.
- Trigger-generated slug collision → numeric suffix (`whitefield-luxury-villas-2`)

## 6. Testing

Each phase ships with:
- `npm run typecheck` clean
- `npm run build` clean (Next.js build catches schema/route issues)
- Manual smoke: homepage, one project (slug + UUID URL both work), one property (slug + UUID), one area page, one developer page, sitemap.xml, robots.txt
- JSON-LD validated via `validator.schema.org` for the new schema types
- Sitemap inspected for URL count parity (slug URLs replace UUID URLs 1:1)

No automated test suite is added — Phase 1 changes are largely metadata + schema, and the existing app has no SEO tests today. Adding a brittle test layer for HTML output is not worth the maintenance cost.

## 7. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Slug migration breaks production | Additive only — UUID routes keep working. Migration is a single ALTER + UPDATE, reversible. |
| Hidden-H1 fix changes visible UI | Coordinate with `ProjectDetailClient` to avoid duplicate H1; user-visible smoke test before merge. |
| Sitemap split breaks Google's existing crawl | Index file points to all old URLs initially; structure change is invisible to crawlers. |
| Area / developer pages thin-content (because prose is TODO) | `noindex` on area/developer pages until prose is filled — flip to `index` per page as content lands. |
| Slug conflicts on backfill | Trigger appends numeric suffix; backfill migration logs any conflicts. |

## 8. Phasing

| Phase | Items | PR size | Risk |
|---|---|---|---|
| 1 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Medium | Low–Medium (item 4 = visible UI) |
| 2 | 11, 12, 13, 14 | Medium | Low (new routes, gated by `noindex`) |
| 3 | 15, 16, 17 | Small | Low |

Phases ship as separate PRs. Phase 2 starts only after Phase 1 is merged.

## 9. Open questions for the user

These are deferred — they don't block Phase 1 but will need answers before Phase 2/3:

1. RERA registration number for the About page?
2. Founder name + bio + photo for E-E-A-T schema?
3. Confirmed list of Bangalore micromarkets to launch with — is the proposed 6 right, or different / fewer / more?
4. Confirmed list of developers for hub pages — proposed 5: prestige-group, sobha, godrej, brigade, lodha. Add/remove?
5. Source for price-trend data on `/market-data` — internal CRM data, RERA filings, third-party (99acres / MagicBricks / CREDAI)?

## 10. Success criteria

- Phase 1 merged: every project/property page emits valid `RealEstateListing` + `BreadcrumbList` schema; homepage meta passes Google's preview tool with primary keyword in title; no `position: absolute; left: -9999px` content remains; both UUID and slug URLs return 200.
- Phase 2 merged: `/areas/whitefield`, `/areas/koramangala`, `/areas/sarjapur-road`, `/areas/hsr-layout`, `/areas/electronic-city`, `/areas/indiranagar` and 5 `/developers/<slug>` pages all return 200 with valid FAQ + Breadcrumb schema. Pages are `noindex` until prose is filled.
- Phase 3 merged: `/market-data` and enhanced `/about` live with E-E-A-T schema validating cleanly.
