# PR description for `feat/seo-foundation` → `main`

**Title:**
`feat(seo): Phase 1 foundation — schema, slug URLs, /properties listings dashboard SEO`

**Body:** (paste below into the PR description)

---

## Summary

Phase 1 of the SEO + AEO foundation rolled out per `docs/superpowers/specs/2026-05-03-seo-aeo-foundation-design.md`. 13 SEO commits, focused emphasis on the `/properties` listings dashboard.

### Foundation
- `src/lib/seo/schema.ts` — central JSON-LD builders (Organization, WebSite, RealEstateListing, FAQPage, BreadcrumbList, Article, Person)
- `src/components/seo/JsonLd.tsx` — thin emitter component
- `src/lib/seo/urls.ts` — `projectUrl` / `propertyUrl` / `isUuid` helpers

### Database
- Migration **already applied to production** via Supabase MCP. `slug` column added to `projects` (365 rows backfilled) and `properties` (50 rows backfilled). Auto-slug triggers installed. Migration file at `supabase/migrations/20260503_add_slug_to_projects_and_properties.sql`.

### Homepage
- New title: **"Luxury Real Estate in Bangalore | Premium Apartments, Villas & New Project Launches | 27 Estates"**
- Description, keywords, OG, Twitter all rewritten with Bangalore + luxury keywords
- Inline JSON-LD migrated to use central builders (RealEstateAgent + WebSite schema preserved, with `areaServed` added)

### `/properties` listings dashboard (priority focus)
- New parent `layout.tsx`: `generateMetadata` + BreadcrumbList + ItemList schema (top 8 projects + top 8 properties) + visible server-rendered `<h1>Premium Properties for Sale & Rent in Bangalore</h1>` + intro paragraph
- Greeting demoted from `<h1>` to `<h2>` (the page H1 should describe content, not greet the user)
- Per-subroute metadata via thin `layout.tsx` for `/properties/search`, `/properties/projects`, `/properties/commercial`, `/properties/warehouse`. Each gets targeted Bangalore + category keywords and canonical
- Skipped `/properties/agents` per request

### Detail pages
- `/projects/[id]/layout.tsx`: builders + FAQ + BreadcrumbList + canonical + slug-aware lookup
- `/properties/[id]/layout.tsx`: parity with projects (was missing FAQ + Breadcrumb)
- Off-screen cloaked `<article aria-hidden style="left:-9999px">` blocks removed from both detail pages — visible H1s already exist in the client components, JSON-LD carries structured data
- `ProjectDetailClient` and `PropertyDetailClient` look up by slug if handle isn't a UUID, by id otherwise. Both URL shapes return 200.

### Blog
- `/blog/[slug]`: `generateMetadata` + Article schema (with author, datePublished, dateModified) + BreadcrumbList + `og:type=article`

### Sitemap
- Split via `generateSitemaps()` into 4 sub-sitemaps: static, projects, properties, blog
- All emit slug URLs (with UUID fallback)
- Bug fix: previous sitemap pointed at `/blogs/${id}` but the live route is `/blog/[slug]` — corrected
- New static entries: `/properties/commercial`, `/properties/warehouse`

### Internal links → slug URLs
- `ProjectCard`, `PropertyCard`, homepage SEO links, `/properties/bookmarks`, related-properties widget on detail page, `/[city]/[category]` listing grid — all use `slug || id`. CRM and admin pages intentionally left as UUID (auth-gated, not crawled).

## URL behavior after deploy

- **UUID URLs continue to resolve 200** — additive, non-breaking. Existing crawls / bookmarks / external links keep working.
- **Slug URLs work too**. Example:
  - `https://www.27estates.com/projects/8b7d4176-9ff6-4162-9193-3cb727b722de` → 200 (Prestige Ocean Towers)
  - `https://www.27estates.com/projects/prestige-ocean-towers-marine-lines-mumbai` → 200 (same content)
- **Sitemap, internal links, canonical tags all point to slug URLs** — Google starts indexing slugs going forward; UUIDs gradually fade from search results.
- **No 301 redirect from UUID → slug yet** — explicitly deferred. Can be added later as a one-line `redirect()` call in the `[id]` routes if you want to force the migration.

## Out of scope (intentional, flagged in spec)
- App Store Optimization (different repo: `D:\Listings mobile version`)
- Link building, GBP, social/viral, PR
- Writing prose content (15-article topical cluster, area page TODOs)
- Phase 2 (`/areas/[slug]`, `/developers/[slug]`) and Phase 3 (`/market-data`, About E-E-A-T) — separate PRs
- Visible Breadcrumbs UI component — JSON-LD breadcrumbs are what Google uses for rich results
- Homepage cloaked SEO `<article>` block — un-cloaking requires homepage UX redesign, deferred

## Test plan

- [ ] Vercel preview URL builds clean (no metadata/route/schema errors)
- [ ] View-source homepage → confirm new `<title>` + RealEstateAgent + WebSite JSON-LD emit
- [ ] View-source `/properties` → confirm BreadcrumbList + ItemList JSON-LD + visible H1
- [ ] View-source any project detail → confirm RealEstateListing + FAQPage + BreadcrumbList JSON-LD
- [ ] Both UUID and slug URLs return 200 for one project and one property
- [ ] `/sitemap.xml` returns sitemap-index pointing at 4 sub-sitemaps
- [ ] `/sitemap/1.xml` shows project URLs using slugs (e.g., `prestige-ocean-towers-marine-lines-mumbai`)
- [ ] `/sitemap/3.xml` shows blog URLs using `/blog/<slug>` (singular, slug — not `/blogs/<id>`)
- [ ] Schema validator (validator.schema.org) passes 0 errors on a project URL and a blog URL

## Follow-ups (for later PRs)

- 301 redirect UUID → slug once you're confident slug URLs are well-indexed (~4–6 weeks post-deploy)
- Phase 2: `/areas/[slug]` (Whitefield, Sarjapur, etc.) + `/developers/[slug]` (Prestige, Sobha, Godrej, Brigade, Lodha) — needs prose content from team
- Phase 3: `/market-data` page + `/about` E-E-A-T enhancement (founder bio, RERA #)
- Un-cloak homepage SEO block (UX redesign needed)
- Submit new sitemap to Google Search Console after deploy

🤖 Generated with [Claude Code](https://claude.com/claude-code)
