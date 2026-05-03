# SEO + AEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the 3-phase SEO + AEO foundation defined in `docs/superpowers/specs/2026-05-03-seo-aeo-foundation-design.md` — slug URLs (additive), centralized schema, FAQ + Breadcrumb + Article markup, area guide pages, developer hubs, market-data page, and E-E-A-T about page.

**Architecture:** A `src/lib/seo/schema.ts` module exports pure JSON-LD builders consumed by a `<JsonLd>` component. Slug URLs are added additively (UUID URLs continue to work). Area pages live at `/areas/[slug]` (avoiding the existing `/[city]/[category]` route). Sitemap splits into per-type sub-sitemaps via Next.js `generateSitemaps()`. Phases ship as independent PRs.

**Tech Stack:** Next.js 16.1.4 (App Router), TypeScript 5, Supabase Postgres, Tailwind v4. No test framework — verification via `tsc --noEmit`, `npm run build`, `npm run lint`, manual smoke + `validator.schema.org`.

---

## Verification commands (used throughout)

- Type-check: `npx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build`
- Dev server: `npm run dev` → visit `http://localhost:3000`
- Schema validator: paste rendered `<script type="application/ld+json">` content into https://validator.schema.org/

---

## Conventions

- Commit per task. Commit messages follow `feat(seo): ...`, `fix(seo): ...`, `chore(seo): ...`.
- Migration filenames: `supabase/migrations/YYYYMMDD_<description>.sql`. Today's date: `20260503`.
- All new files under `src/lib/seo/` or `src/components/seo/` unless otherwise noted.
- Internal links use the helpers from `src/lib/seo/urls.ts` — no hardcoded `/projects/${id}` / `/properties/${id}` in new code.

---

# Phase 1 — Foundation (PR 1)

## Task 1.1: Bootstrap SEO library — JSON-LD builders

**Files:**
- Create: `src/lib/seo/schema.ts`
- Create: `src/components/seo/JsonLd.tsx`

- [ ] **Step 1: Create the schema builder module**

```ts
// src/lib/seo/schema.ts
// Pure JSON-LD builders. Each returns a serializable object or null.
// Components emit them via <JsonLd data={...} />.

const SITE_URL = 'https://www.27estates.com';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: '27 Estates',
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.jpg`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      "27 Estates is a premium real estate advisory & brokerage firm in Bangalore, specialising in luxury apartments, villas, and new project launches across Bangalore, Mumbai, Pune, and Hyderabad.",
    address: {
      '@type': 'PostalAddress',
      streetAddress: '83, Prestige Copper Arch, Infantry Road',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      postalCode: '560001',
      addressCountry: 'IN',
    },
    telephone: '+918095799929',
    email: 'connect@27estates.com',
    sameAs: [
      'https://www.linkedin.com/company/27estates/',
      'https://www.instagram.com/27estates/',
      'https://www.facebook.com/27estates/',
    ],
    areaServed: ['Bangalore', 'Mumbai', 'Pune', 'Hyderabad'],
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '27 Estates',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/properties/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

type BreadcrumbCrumb = { name: string; url: string };
export function buildBreadcrumbSchema(crumbs: BreadcrumbCrumb[]) {
  if (!crumbs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${SITE_URL}${c.url}`,
    })),
  };
}

type FaqQA = { question: string; answer: string };
export function buildFaqSchema(qa: FaqQA[]) {
  if (!qa.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

type RealEstateInput = {
  id?: string;
  slug?: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  subCategory?: string | null;
  status?: string | null;
  developerName?: string | null;
  bhkOptions?: string[] | null;
  isReraApproved?: boolean | null;
  possessionDate?: string | null;
  pathPrefix: 'projects' | 'properties';
};
export function buildRealEstateListingSchema(input: RealEstateInput) {
  const handle = input.slug ?? input.id;
  if (!handle) return null;
  const url = `${SITE_URL}/${input.pathPrefix}/${handle}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: input.name,
    description:
      input.description ||
      `${input.category ?? 'Property'} in ${input.location || input.city || 'India'}`,
    url,
    image: input.imageUrl ?? undefined,
    datePosted: new Date().toISOString(),
    ...(input.priceMin
      ? {
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: input.priceMin,
            highPrice: input.priceMax ?? input.priceMin,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.location || input.city || undefined,
      addressRegion: input.state || 'Karnataka',
      addressCountry: 'IN',
    },
    ...(input.latitude && input.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: input.latitude,
            longitude: input.longitude,
          },
        }
      : {}),
    additionalProperty: [
      ...(input.category ? [{ '@type': 'PropertyValue', name: 'Category', value: input.category }] : []),
      ...(input.subCategory ? [{ '@type': 'PropertyValue', name: 'Sub Category', value: input.subCategory }] : []),
      ...(input.status ? [{ '@type': 'PropertyValue', name: 'Status', value: input.status }] : []),
      ...(input.developerName ? [{ '@type': 'PropertyValue', name: 'Developer', value: input.developerName }] : []),
      ...(input.bhkOptions?.length ? [{ '@type': 'PropertyValue', name: 'BHK Options', value: input.bhkOptions.join(', ') }] : []),
      ...(typeof input.isReraApproved === 'boolean' ? [{ '@type': 'PropertyValue', name: 'RERA Approved', value: input.isReraApproved ? 'Yes' : 'No' }] : []),
      ...(input.possessionDate ? [{ '@type': 'PropertyValue', name: 'Possession Date', value: input.possessionDate }] : []),
    ],
  };
}

type ArticleInput = {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  authorName?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
};
export function buildArticleSchema(a: ArticleInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description ?? undefined,
    url: a.url.startsWith('http') ? a.url : `${SITE_URL}${a.url}`,
    image: a.imageUrl ?? undefined,
    author: { '@type': 'Person', name: a.authorName ?? '27 Estates Editorial' },
    publisher: {
      '@type': 'Organization',
      name: '27 Estates',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.jpg` },
    },
    datePublished: a.datePublished ?? new Date().toISOString(),
    dateModified: a.dateModified ?? a.datePublished ?? new Date().toISOString(),
  };
}

export function buildPersonSchema(p: { name: string; jobTitle?: string; image?: string; sameAs?: string[]; worksFor?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    jobTitle: p.jobTitle,
    image: p.image,
    sameAs: p.sameAs,
    worksFor: p.worksFor ? { '@type': 'Organization', name: p.worksFor } : undefined,
  };
}
```

- [ ] **Step 2: Create the JsonLd React component**

```tsx
// src/components/seo/JsonLd.tsx
import React from 'react';

type Props = { data: unknown | null };

export default function JsonLd({ data }: Props) {
  if (data == null) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors related to the new files.

- [ ] **Step 4: Commit**

```bash
git add src/lib/seo/schema.ts src/components/seo/JsonLd.tsx
git commit -m "feat(seo): centralized JSON-LD builders + JsonLd component"
```

---

## Task 1.2: Migrate root layout to use SEO builders

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace inline JSON-LD with builders**

Locate the two inline `<script type="application/ld+json">` blocks (lines ~113–157 in current `src/app/layout.tsx`) and replace with:

```tsx
import JsonLd from '@/components/seo/JsonLd';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';

// Inside the body, before <AuthProvider>:
<JsonLd data={buildOrganizationSchema()} />
<JsonLd data={buildWebSiteSchema()} />
```

Remove the original two `<script>` blocks. Keep the rest of `layout.tsx` (metadata export, fonts, AuthProvider, etc.) unchanged.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run dev server, view-source the homepage, confirm both JSON-LD scripts emit identical content to before**

Run: `npm run dev`
Open: `http://localhost:3000` → View Source → Ctrl-F `application/ld+json` → confirm RealEstateAgent + WebSite blocks present.

- [ ] **Step 4: Validate at https://validator.schema.org/ — paste the page URL, confirm 0 errors**

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "refactor(seo): root layout uses centralized JSON-LD builders"
```

---

## Task 1.3: Homepage meta rewrite (title + description + OG)

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update the metadata export**

Replace the existing `metadata.title.default`, `metadata.description`, `metadata.keywords`, `metadata.openGraph.title`, `metadata.openGraph.description`, `metadata.twitter.title`, `metadata.twitter.description` with:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://www.27estates.com'),
  title: {
    default:
      'Luxury Real Estate in Bangalore | Premium Apartments, Villas & New Project Launches | 27 Estates',
    template: '%s | 27 Estates',
  },
  description:
    "Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates — Bangalore's trusted luxury real estate advisory. Explore Whitefield, Sarjapur Road, Koramangala & more.",
  keywords: [
    'luxury real estate bangalore',
    'premium apartments bangalore',
    'luxury villas bangalore',
    'new project launches bangalore',
    'real estate advisory bangalore',
    'property consultant bangalore',
    'whitefield apartments',
    'sarjapur road properties',
  ],
  // ... keep authors, creator, publisher, alternates, other (apple-itunes-app), icons, manifest, robots unchanged
  openGraph: {
    title: 'Luxury Real Estate in Bangalore | Premium Apartments, Villas & New Launches | 27 Estates',
    description:
      "Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates — Bangalore's trusted luxury real estate advisory.",
    url: 'https://www.27estates.com',
    siteName: '27 Estates',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '27 Estates - Luxury Real Estate in Bangalore' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury Real Estate in Bangalore | 27 Estates',
    description:
      "Discover premium apartments, villas, and new project launches in Bangalore from 27 Estates.",
    images: ['/og-image.jpg'],
  },
  // ... rest unchanged
};
```

Note: title is ~95 chars — Google truncates to ~60 in SERP but Google indexes the full title and it carries keyword weight. Acceptable.

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: 0 errors.

- [ ] **Step 3: Smoke — view-source the homepage, confirm `<title>` and `<meta name="description">` reflect new copy**

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): homepage meta rewrite with Bangalore + luxury keywords"
```

---

## Task 1.4: Migrate project [id] layout to builders + add FAQ schema

**Files:**
- Modify: `src/app/projects/[id]/layout.tsx`

- [ ] **Step 1: Replace the inline RealEstateListing JSON-LD with builder + add FAQ**

Replace the entire file body with:

```tsx
import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildRealEstateListingSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('project_name, description, images, location, city, category, min_price, max_price, developer_name')
    .eq('id', id)
    .single();
  if (!project) return {};
  const images = (project.images as string[] | null) || [];
  const mainImage = images.length > 0 ? images[0] : null;
  const previousImages = (await parent).openGraph?.images || [];
  const ogImages = mainImage
    ? [{ url: mainImage, width: 1200, height: 630, alt: project.project_name }]
    : previousImages;
  const priceText =
    project.min_price && project.max_price
      ? `${project.min_price} - ${project.max_price}`
      : project.min_price || project.max_price || '';
  return {
    title: project.project_name,
    description:
      project.description ||
      `${project.category} project by ${project.developer_name || '27 Estates'} in ${project.location || project.city || 'India'}. ${priceText ? `Price: ${priceText}.` : ''} Listed on 27 Estates.`,
    openGraph: {
      title: project.project_name,
      description: project.description,
      images: ogImages,
      type: 'website',
    },
  };
}

function defaultProjectFaqs(project: {
  project_name: string;
  developer_name?: string | null;
  location?: string | null;
  city?: string | null;
  is_rera_approved?: boolean | null;
  possession_date?: string | null;
  min_price?: number | null;
  max_price?: number | null;
}) {
  const where = project.location || project.city || 'Bangalore';
  const price =
    project.min_price && project.max_price
      ? `between ₹${project.min_price.toLocaleString('en-IN')} and ₹${project.max_price.toLocaleString('en-IN')}`
      : 'available on request';
  return [
    {
      question: `Where is ${project.project_name} located?`,
      answer: `${project.project_name} is located in ${where}.`,
    },
    {
      question: `Who is the developer of ${project.project_name}?`,
      answer: project.developer_name
        ? `${project.project_name} is developed by ${project.developer_name}.`
        : `Developer details for ${project.project_name} are available on request.`,
    },
    {
      question: `Is ${project.project_name} RERA approved?`,
      answer:
        project.is_rera_approved === true
          ? `Yes, ${project.project_name} is RERA approved.`
          : project.is_rera_approved === false
          ? `RERA approval status for ${project.project_name} is pending or unavailable.`
          : `RERA approval information is available on request.`,
    },
    {
      question: `What is the price of ${project.project_name}?`,
      answer: `Prices at ${project.project_name} are ${price}. Contact 27 Estates for current availability and exact pricing.`,
    },
    {
      question: `When is the possession date of ${project.project_name}?`,
      answer: project.possession_date
        ? `Possession at ${project.project_name} is scheduled for ${project.possession_date}.`
        : `Possession date for ${project.project_name} is available on request.`,
    },
  ];
}

export default async function ProjectLayout({ params, children }: Props) {
  const { id } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, project_name, description, images, location, city, state, category, sub_category, min_price, max_price, developer_name, status, bhk_options, is_rera_approved, latitude, longitude, possession_date')
    .eq('id', id)
    .single();

  const listingSchema = project
    ? buildRealEstateListingSchema({
        id: project.id,
        slug: project.slug ?? undefined,
        name: project.project_name,
        description: project.description,
        imageUrl: (project.images as string[] | null)?.[0] ?? null,
        priceMin: project.min_price,
        priceMax: project.max_price,
        location: project.location,
        city: project.city,
        state: project.state,
        latitude: project.latitude,
        longitude: project.longitude,
        category: project.category,
        subCategory: project.sub_category,
        status: project.status,
        developerName: project.developer_name,
        bhkOptions: project.bhk_options as string[] | null,
        isReraApproved: project.is_rera_approved,
        possessionDate: project.possession_date,
        pathPrefix: 'projects',
      })
    : null;

  const faqSchema = project ? buildFaqSchema(defaultProjectFaqs(project)) : null;
  const breadcrumbSchema = project
    ? buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Projects', url: '/properties/projects' },
        { name: project.project_name, url: `/projects/${project.slug ?? project.id}` },
      ])
    : null;

  return (
    <>
      <JsonLd data={listingSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
```

NOTE: The `slug` column doesn't exist yet — the `select('id, slug, ...)` will fail until Task 1.9 runs the migration. Step 2 below catches this. Order Tasks 1.4 → 1.9 if you want to merge incrementally; or run 1.9 first and 1.4 after. I prefer running 1.9 first.

- [ ] **Step 2: Reorder — execute Task 1.9 (slug migration) BEFORE finalizing this task**

Skip Steps 3–6 here, go to Task 1.9, then return.

- [ ] **Step 3: Type-check (after migration)**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Smoke — start dev server, hit a project URL, view-source**

Run: `npm run dev`
Open `http://localhost:3000/projects/<some-existing-uuid>` → View Source → confirm three JSON-LD blocks (RealEstateListing, FAQPage, BreadcrumbList).

- [ ] **Step 5: Validate at https://validator.schema.org/**

- [ ] **Step 6: Commit**

```bash
git add src/app/projects/[id]/layout.tsx
git commit -m "feat(seo): project layout uses builders + adds FAQ + Breadcrumb schema"
```

---

## Task 1.5: Un-cloak project page hidden H1

**Files:**
- Read: `src/app/projects/[id]/ProjectDetailClient.tsx`
- Modify: `src/app/projects/[id]/page.tsx`

- [ ] **Step 1: Read ProjectDetailClient to find what's already user-visible**

Open `src/app/projects/[id]/ProjectDetailClient.tsx`. Search for:
- Where `project.project_name` is rendered visibly
- Whether there's already an `<h1>` element

Write down findings (mental note):
- Visible heading element: ___
- Currently uses `<h1>`, `<h2>`, or generic styled text: ___

- [ ] **Step 2: Decide based on findings**

- **If ProjectDetailClient already renders project_name as `<h1>`:** delete the entire off-screen block from `page.tsx`. No replacement needed — JSON-LD already carries structured fields.
- **If ProjectDetailClient renders project_name visibly but NOT as `<h1>`:** change the visible heading inside ProjectDetailClient to use `<h1>` (only one `<h1>` per page). Then delete the off-screen block from `page.tsx`.
- **If ProjectDetailClient doesn't render project_name visibly:** add a visible `<h1>` in `page.tsx` BEFORE `<ProjectDetailClient />` like this:

```tsx
<header className="px-4 sm:px-6 lg:px-8 pt-6">
  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900">
    {project.project_name}
  </h1>
  {project.location && (
    <p className="text-gray-600 mt-2">
      {project.location}{project.city ? `, ${project.city}` : ''}
    </p>
  )}
</header>
```

Then delete the off-screen block.

- [ ] **Step 3: Delete the off-screen `<article>` block from `src/app/projects/[id]/page.tsx`**

Remove lines 51–97 (the `<article style={{ position: 'absolute', left: '-9999px', ... }} aria-hidden="true">` block and everything inside it).

The file's render block becomes simply:
```tsx
return <ProjectDetailClient params={params} />;
```

(plus whatever visible header you added in Step 2.)

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: 0 errors.

- [ ] **Step 5: Smoke — load a project page in dev, confirm visible H1, no overlapping headings, layout intact**

Run: `npm run dev`
Open: a project URL. Use browser inspector to confirm exactly one `<h1>` exists and it contains `project_name`.

- [ ] **Step 6: Commit**

```bash
git add src/app/projects/[id]/page.tsx src/app/projects/[id]/ProjectDetailClient.tsx
git commit -m "fix(seo): un-cloak project page h1 (remove off-screen aria-hidden block)"
```

---

## Task 1.6: Property detail parity — generateMetadata + JSON-LD

**Files:**
- Read: `src/app/properties/[id]/layout.tsx`
- Modify: `src/app/properties/[id]/layout.tsx`

- [ ] **Step 1: Read the existing property layout to see what's there**

Run mentally: open `src/app/properties/[id]/layout.tsx`. If it doesn't have `generateMetadata` or JSON-LD, this task adds them. If it has minimal exports, replace.

- [ ] **Step 2: Replace the layout with parity to project layout**

```tsx
// src/app/properties/[id]/layout.tsx
import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildRealEstateListingSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const { data: property } = await supabase
    .from('properties')
    .select('title, description, images, location, city, category, price')
    .eq('id', id)
    .single();
  if (!property) return {};
  const images = (property.images as string[] | null) || [];
  const mainImage = images.length > 0 ? images[0] : null;
  const previousImages = (await parent).openGraph?.images || [];
  const ogImages = mainImage
    ? [{ url: mainImage, width: 1200, height: 630, alt: property.title }]
    : previousImages;
  return {
    title: property.title,
    description:
      property.description ||
      `${property.category || 'Property'} in ${property.location || property.city || 'India'}. Listed on 27 Estates.`,
    openGraph: {
      title: property.title,
      description: property.description,
      images: ogImages,
      type: 'website',
    },
  };
}

function defaultPropertyFaqs(p: {
  title: string;
  location?: string | null;
  city?: string | null;
  category?: string | null;
  price?: number | null;
}) {
  const where = p.location || p.city || 'Bangalore';
  return [
    { question: `Where is ${p.title} located?`, answer: `${p.title} is located in ${where}.` },
    {
      question: `What type of property is ${p.title}?`,
      answer: p.category ? `${p.title} is a ${p.category} property.` : `Property type details are available on request.`,
    },
    {
      question: `What is the price of ${p.title}?`,
      answer: p.price
        ? `${p.title} is priced at ₹${p.price.toLocaleString('en-IN')}. Contact 27 Estates for current availability.`
        : `Pricing details for ${p.title} are available on request.`,
    },
    {
      question: `How can I schedule a site visit for ${p.title}?`,
      answer: `Contact 27 Estates at +91 80957 99929 or connect@27estates.com to schedule a site visit.`,
    },
  ];
}

export default async function PropertyLayout({ params, children }: Props) {
  const { id } = await params;
  const { data: property } = await supabase
    .from('properties')
    .select('id, slug, title, description, images, location, city, state, category, sub_category, price, status, latitude, longitude')
    .eq('id', id)
    .single();

  const listingSchema = property
    ? buildRealEstateListingSchema({
        id: property.id,
        slug: property.slug ?? undefined,
        name: property.title,
        description: property.description,
        imageUrl: (property.images as string[] | null)?.[0] ?? null,
        priceMin: property.price,
        priceMax: property.price,
        location: property.location,
        city: property.city,
        state: property.state,
        latitude: property.latitude,
        longitude: property.longitude,
        category: property.category,
        subCategory: property.sub_category,
        status: property.status,
        pathPrefix: 'properties',
      })
    : null;

  const faqSchema = property ? buildFaqSchema(defaultPropertyFaqs(property)) : null;
  const breadcrumbSchema = property
    ? buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Properties', url: '/properties' },
        { name: property.title, url: `/properties/${property.slug ?? property.id}` },
      ])
    : null;

  return (
    <>
      <JsonLd data={listingSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
```

If the existing file uses different column names (e.g. `name` instead of `title`), adjust the `.select()` clauses to match. Check the existing layout/page first.

- [ ] **Step 3: Same dependency on slug column as Task 1.4 — run Task 1.9 first if not done**

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 5: Smoke — load a property page, view-source, confirm three JSON-LD blocks**

- [ ] **Step 6: Validate schema**

- [ ] **Step 7: Commit**

```bash
git add src/app/properties/[id]/layout.tsx
git commit -m "feat(seo): property detail layout parity with project (metadata + schema)"
```

---

## Task 1.7: Article schema for blog posts

**Files:**
- Read: `src/app/blog/[slug]/page.tsx` (or `layout.tsx`)
- Modify: same file (or add `layout.tsx` if missing)

- [ ] **Step 1: Locate where the blog detail page server-fetches the post**

Open `src/app/blog/[slug]/page.tsx`. Find the Supabase query for a single blog post.

- [ ] **Step 2: Add Article + Breadcrumb JSON-LD to the page**

Add at the top of the file's render output (before whatever client component renders the post):

```tsx
import JsonLd from '@/components/seo/JsonLd';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';

// Inside the server component, after fetching `blog`:
const articleSchema = blog
  ? buildArticleSchema({
      title: blog.title,
      description: blog.excerpt ?? blog.description ?? null,
      url: `/blog/${blog.slug ?? blog.id}`,
      imageUrl: (blog.cover_image as string | null) ?? (blog.image as string | null) ?? null,
      authorName: blog.author_name ?? null,
      datePublished: blog.published_at ?? blog.created_at ?? null,
      dateModified: blog.updated_at ?? null,
    })
  : null;
const breadcrumbSchema = blog
  ? buildBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: blog.title, url: `/blog/${blog.slug ?? blog.id}` },
    ])
  : null;

// In the JSX:
<JsonLd data={articleSchema} />
<JsonLd data={breadcrumbSchema} />
```

Adjust column names to match your actual `blogs` table schema. If columns like `excerpt`, `author_name`, `cover_image` don't exist, fall back to whatever does exist (`description`, `null`, `image`).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Smoke — load a blog post, view-source, confirm Article + BreadcrumbList JSON-LD**

- [ ] **Step 5: Commit**

```bash
git add src/app/blog/[slug]/page.tsx
git commit -m "feat(seo): Article + Breadcrumb schema on blog post pages"
```

---

## Task 1.8: Visible breadcrumb component (UX + reinforces schema)

**Files:**
- Create: `src/components/seo/Breadcrumbs.tsx`

- [ ] **Step 1: Create the visible breadcrumb component**

```tsx
// src/components/seo/Breadcrumbs.tsx
import Link from 'next/link';

type Crumb = { name: string; href?: string };
type Props = { crumbs: Crumb[] };

export default function Breadcrumbs({ crumbs }: Props) {
  if (!crumbs.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600 px-4 sm:px-6 lg:px-8 py-3">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:underline">
                  {c.name}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-gray-900 font-medium' : ''}>
                  {c.name}
                </span>
              )}
              {!isLast && <span className="mx-1 text-gray-400">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Add to project page**

In `src/app/projects/[id]/page.tsx` or its visible header, render:

```tsx
import Breadcrumbs from '@/components/seo/Breadcrumbs';

// Inside the component, before <ProjectDetailClient />:
<Breadcrumbs
  crumbs={[
    { name: 'Home', href: '/' },
    { name: 'Projects', href: '/properties/projects' },
    { name: project.project_name },
  ]}
/>
```

Add the same to property and blog detail pages.

- [ ] **Step 3: Type-check + smoke**

Run: `npx tsc --noEmit && npm run dev`
Open project / property / blog pages → confirm visible breadcrumb appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/seo/Breadcrumbs.tsx src/app/projects/[id]/page.tsx src/app/properties/[id]/page.tsx src/app/blog/[slug]/page.tsx
git commit -m "feat(seo): visible breadcrumbs on detail pages"
```

---

## Task 1.9: Slug DB migration + URL helpers

**Files:**
- Create: `supabase/migrations/20260503_add_slug_to_projects_and_properties.sql`
- Create: `src/lib/seo/urls.ts`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260503_add_slug_to_projects_and_properties.sql
-- Adds slug columns to projects and properties for SEO-friendly URLs.
-- Backfill is non-destructive; existing UUID URLs continue to resolve via the
-- application layer.

-- Slug generation helper
create or replace function public.generate_slug(input text) returns text
language plpgsql immutable as $$
declare
  s text;
begin
  s := lower(coalesce(input, ''));
  -- Replace any non-alphanumeric with a single hyphen, trim leading/trailing hyphens
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  if s = '' then
    s := 'item';
  end if;
  return s;
end;
$$;

-- Projects
alter table public.projects add column if not exists slug text;
create unique index if not exists projects_slug_unique on public.projects(slug) where slug is not null;

-- Backfill projects (idempotent: only fills nulls)
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, project_name, location, city from public.projects where slug is null loop
    base := public.generate_slug(
      coalesce(r.project_name, '') ||
      case when r.location is not null then '-' || r.location else '' end ||
      case when r.city is not null then '-' || r.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.projects where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    update public.projects set slug = candidate where id = r.id;
  end loop;
end$$;

-- Properties (use `title` if that's the column name; adjust if different)
alter table public.properties add column if not exists slug text;
create unique index if not exists properties_slug_unique on public.properties(slug) where slug is not null;

do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id, title, location, city from public.properties where slug is null loop
    base := public.generate_slug(
      coalesce(r.title, '') ||
      case when r.location is not null then '-' || r.location else '' end ||
      case when r.city is not null then '-' || r.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.properties where slug = candidate) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    update public.properties set slug = candidate where id = r.id;
  end loop;
end$$;

-- Trigger: auto-generate slug on insert if NULL
create or replace function public.auto_slug_projects() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int;
begin
  if new.slug is null and new.project_name is not null then
    base := public.generate_slug(
      new.project_name ||
      case when new.location is not null then '-' || new.location else '' end ||
      case when new.city is not null then '-' || new.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.projects where slug = candidate and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

create or replace function public.auto_slug_properties() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int;
begin
  if new.slug is null and new.title is not null then
    base := public.generate_slug(
      new.title ||
      case when new.location is not null then '-' || new.location else '' end ||
      case when new.city is not null then '-' || new.city else '' end
    );
    candidate := base;
    n := 1;
    while exists (select 1 from public.properties where slug = candidate and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)) loop
      n := n + 1;
      candidate := base || '-' || n::text;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_slug_projects on public.projects;
create trigger trg_auto_slug_projects before insert or update of project_name, location, city on public.projects
  for each row execute function public.auto_slug_projects();

drop trigger if exists trg_auto_slug_properties on public.properties;
create trigger trg_auto_slug_properties before insert or update of title, location, city on public.properties
  for each row execute function public.auto_slug_properties();
```

NOTE: If the properties table uses a different column name than `title` (e.g. `name`, `property_name`), search and replace before applying. Run a quick check first:

```bash
# Check property columns
grep -E "from\(.properties.\)" -r src/app/properties/[id]/ | head -5
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__supabase__apply_migration` tool with name `add_slug_to_projects_and_properties` and the SQL from Step 1.

OR (if local): `supabase db push`

- [ ] **Step 3: Verify migration succeeded**

Use `mcp__supabase__execute_sql`:
```sql
select count(*) as total, count(slug) as with_slug from public.projects;
select count(*) as total, count(slug) as with_slug from public.properties;
```

Expected: `total = with_slug` for both.

- [ ] **Step 4: Spot-check a few slugs**

```sql
select project_name, location, city, slug from public.projects limit 10;
```

Slugs should look like `sobha-neopolis-panathur-bangalore`, no special chars, no double hyphens.

- [ ] **Step 5: Create the URL helpers**

```ts
// src/lib/seo/urls.ts
// Internal URL helpers — always prefer slug, fall back to UUID. Use these
// for ALL internal links to projects/properties so the sitemap, schema, and
// link equity all flow to the canonical (slug) URL.

type WithHandle = { id?: string | null; slug?: string | null };

export function projectUrl(p: WithHandle): string {
  const handle = p.slug || p.id;
  if (!handle) throw new Error('projectUrl requires id or slug');
  return `/projects/${handle}`;
}

export function propertyUrl(p: WithHandle): string {
  const handle = p.slug || p.id;
  if (!handle) throw new Error('propertyUrl requires id or slug');
  return `/properties/${handle}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(handle: string): boolean {
  return UUID_RE.test(handle);
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260503_add_slug_to_projects_and_properties.sql src/lib/seo/urls.ts
git commit -m "feat(seo): slug columns + URL helpers (additive, non-breaking)"
```

---

## Task 1.10: Slug-aware lookup in detail routes

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/app/projects/[id]/ProjectDetailClient.tsx`
- Modify: `src/app/projects/[id]/layout.tsx`
- Modify: `src/app/properties/[id]/page.tsx`
- Modify: `src/app/properties/[id]/PropertyDetailClient.tsx`
- Modify: `src/app/properties/[id]/layout.tsx`

The directory name stays as `[id]` (renaming would force a route reshuffle and risk breaking imports). The PARAM stays named `id`. The change is purely in lookup logic: try slug first, fall back to UUID.

- [ ] **Step 1: Update project page to look up by slug or UUID**

In `src/app/projects/[id]/page.tsx`:

```tsx
import { isUuid } from '@/lib/seo/urls';

// Inside the server component, replace the existing supabase query with:
const { data: project } = isUuid(resolvedParams.id)
  ? await supabase.from('projects').select('*').eq('id', resolvedParams.id).single()
  : await supabase.from('projects').select('*').eq('slug', resolvedParams.id).single();
```

- [ ] **Step 2: Apply the same pattern to `src/app/projects/[id]/layout.tsx`**

Both queries (`generateMetadata` and the layout default export) need the same UUID-vs-slug branching.

- [ ] **Step 3: Apply to ProjectDetailClient if it does its own lookup**

Open `src/app/projects/[id]/ProjectDetailClient.tsx`. If it fetches the project client-side using `params.id`, update the same way (using a client-side UUID regex check — copy `isUuid` logic inline since `urls.ts` is server-safe).

- [ ] **Step 4: Repeat Steps 1–3 for properties**

Same pattern on `src/app/properties/[id]/page.tsx`, `layout.tsx`, `PropertyDetailClient.tsx`.

- [ ] **Step 5: Type-check + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 6: Smoke — both URL shapes work**

Run: `npm run dev`. For one project, hit BOTH:
- `http://localhost:3000/projects/<uuid>` → 200
- `http://localhost:3000/projects/<slug>` → 200

Same for one property.

- [ ] **Step 7: Commit**

```bash
git add src/app/projects/[id]/ src/app/properties/[id]/
git commit -m "feat(seo): detail routes accept slug or UUID (additive)"
```

---

## Task 1.11: Update sitemap to emit slug URLs + split via generateSitemaps

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Restructure sitemap to use generateSitemaps for split**

Replace `src/app/sitemap.ts` with:

```ts
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { projectUrl, propertyUrl } from '@/lib/seo/urls';

const BASE_URL = 'https://www.27estates.com';
const CHUNK_SIZE = 5000; // Google's per-sitemap cap is 50k; we keep chunks small.

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  // We expose 5 sub-sitemaps:
  // 0 = static, 1 = projects, 2 = properties, 3 = blog, 4 = areas+developers (small, combined)
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) return staticRoutes();
  if (id === 1) return projectsSitemap();
  if (id === 2) return propertiesSitemap();
  if (id === 3) return blogSitemap();
  if (id === 4) return areasAndDevelopersSitemap();
  return [];
}

function staticRoutes(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE_URL}/properties`, lastModified: new Date(), priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/properties/search`, lastModified: new Date(), priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/properties/projects`, lastModified: new Date(), priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE_URL}/bangalore/office-spaces`, lastModified: new Date(), priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE_URL}/bangalore/commercial`, lastModified: new Date(), priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE_URL}/bangalore/villas`, lastModified: new Date(), priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE_URL}/pune/residential`, lastModified: new Date(), priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE_URL}/about`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/invest`, lastModified: new Date(), priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/services`, lastModified: new Date(), priority: 0.8, changeFrequency: 'monthly' },
    { url: `${BASE_URL}/careers`, lastModified: new Date(), priority: 0.6, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/llms.txt`, lastModified: new Date(), priority: 0.3, changeFrequency: 'monthly' },
  ];
}

async function projectsSitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabase()
    .from('projects')
    .select('id, slug, updated_at');
  return (data ?? []).map((p) => ({
    url: `${BASE_URL}${projectUrl({ id: p.id, slug: p.slug })}`,
    lastModified: new Date(p.updated_at || Date.now()),
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));
}

async function propertiesSitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabase()
    .from('properties')
    .select('id, slug, updated_at');
  return (data ?? []).map((p) => ({
    url: `${BASE_URL}${propertyUrl({ id: p.id, slug: p.slug })}`,
    lastModified: new Date(p.updated_at || Date.now()),
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));
}

async function blogSitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await supabase()
    .from('blogs')
    .select('id, slug, updated_at');
  return (data ?? []).map((b: { id: string; slug: string | null; updated_at: string | null }) => ({
    url: `${BASE_URL}/blog/${b.slug ?? b.id}`,
    lastModified: new Date(b.updated_at || Date.now()),
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }));
}

async function areasAndDevelopersSitemap(): Promise<MetadataRoute.Sitemap> {
  // Phase 2 populates these. For now, emit a placeholder so the sub-sitemap
  // exists and Google can pick up new entries when they're added.
  return [];
}
```

- [ ] **Step 2: Reference: Next.js generateSitemaps docs**

The sitemap-index will be served at `/sitemap.xml`. Sub-sitemaps are at `/sitemap/0.xml`, `/sitemap/1.xml`, etc. This is the standard Next.js pattern.

- [ ] **Step 3: Note the column rename**

The original sitemap used `/blogs/${blog.id}` (plural). The blog detail route is `/blog/[slug]` (singular). Step 1 fixes this — current sitemap had a bug emitting wrong URL.

- [ ] **Step 4: Build + verify**

Run: `npm run build && npm run dev`
Open: `http://localhost:3000/sitemap.xml` → should be a sitemap-index pointing at 5 sub-sitemaps.
Open: `http://localhost:3000/sitemap/1.xml` → should be project URLs using slugs.
Open: `http://localhost:3000/sitemap/2.xml` → property URLs.

Spot-check that URLs in the projects sitemap use slugs (e.g., `/projects/sobha-neopolis-panathur-bangalore`), not UUIDs.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): split sitemap via generateSitemaps + emit slug URLs"
```

---

## Task 1.12: Update internal links across the app to use URL helpers

**Files:**
- Search and modify: any file with hardcoded `/projects/${...id}` or `/properties/${...id}`

- [ ] **Step 1: Find every hardcoded link**

Run grep: `Grep -n "/projects/\$" --include="*.tsx" --include="*.ts"` (and same for `/properties/$`).

The expected hit list includes (but is not limited to):
- `src/components/emergent/ProjectCard.tsx`
- `src/components/emergent/PropertyCard.tsx`
- Listing pages, search results, related-listings, anywhere an `<a>` or `<Link href={...}>` is built from project/property IDs.

- [ ] **Step 2: For each match, replace with helper**

Pattern transform:

Before:
```tsx
<Link href={`/projects/${project.id}`}>...</Link>
```

After:
```tsx
import { projectUrl } from '@/lib/seo/urls';
// ...
<Link href={projectUrl(project)}>...</Link>
```

Component must receive both `id` and `slug` from the parent. If it currently only receives `id`, update the parent's Supabase select to include `slug`, and update the component prop type.

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 4: Smoke — homepage / listings / search results all link to slug URLs now**

Run: `npm run dev`. Inspect the rendered HTML in DevTools — confirm `<a href>` values use slugs, not UUIDs.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(seo): internal links use slug URL helpers"
```

---

## Phase 1 Closeout

- [ ] **Final smoke pass**

Run: `npm run build && npm run dev`. Hit:
- `/` (homepage — new title in `<head>`)
- `/projects/<uuid>` (still works)
- `/projects/<slug>` (works)
- `/properties/<uuid>` (still works)
- `/properties/<slug>` (works)
- `/blog/<some-blog-slug>` (Article + Breadcrumb schema)
- `/sitemap.xml` (sitemap-index)
- `/sitemap/1.xml` (slug URLs in project sitemap)

- [ ] **Schema validator pass**

For one project URL, paste into https://validator.schema.org/ → confirm:
- `RealEstateAgent` from root layout
- `WebSite` from root layout
- `RealEstateListing` from project layout
- `FAQPage` from project layout
- `BreadcrumbList` from project layout

All should validate with 0 errors.

- [ ] **Open PR**

```bash
gh pr create --title "feat(seo): foundation — slug URLs + schema + meta + sitemap split (Phase 1)" --body "Implements Phase 1 of docs/superpowers/specs/2026-05-03-seo-aeo-foundation-design.md. See spec for context. Phases 2 and 3 follow as separate PRs."
```

---

# Phase 2 — Content Infrastructure (PR 2)

## Task 2.1: AreaGuide type + 6 area data scaffolds

**Files:**
- Create: `src/data/areas/types.ts`
- Create: `src/data/areas/whitefield.ts`
- Create: `src/data/areas/koramangala.ts`
- Create: `src/data/areas/sarjapur-road.ts`
- Create: `src/data/areas/hsr-layout.ts`
- Create: `src/data/areas/electronic-city.ts`
- Create: `src/data/areas/indiranagar.ts`
- Create: `src/data/areas/index.ts`

- [ ] **Step 1: Define the AreaGuide type**

```ts
// src/data/areas/types.ts
export type AreaFaq = { question: string; answer: string };

export type AreaGuide = {
  slug: string;
  name: string;
  city: string;
  state: string;
  metaTitle: string;
  metaDescription: string;
  intro: string; // TODO: long-form (300-500 words)
  priceRangePerSqft?: { min: number; max: number; currency: 'INR' };
  topProjectKeywords?: string[]; // used to filter projects table
  infrastructure: string; // TODO
  investmentOutlook: string; // TODO
  faqs: AreaFaq[]; // 5–8 items
  noindex: boolean; // flip to false once content is filled
};
```

- [ ] **Step 2: Write whitefield.ts (template — copy this pattern for the other 5)**

```ts
// src/data/areas/whitefield.ts
import type { AreaGuide } from './types';

export const whitefield: AreaGuide = {
  slug: 'whitefield',
  name: 'Whitefield',
  city: 'Bangalore',
  state: 'Karnataka',
  metaTitle: 'Luxury Real Estate in Whitefield, Bangalore | 27 Estates',
  metaDescription:
    'Premium apartments, villas, and new project launches in Whitefield, Bangalore. Explore Whitefield real estate prices, top projects, and infrastructure with 27 Estates.',
  intro:
    'TODO: 300–500 word intro covering what makes Whitefield a top luxury real estate destination — IT corridor, infrastructure, lifestyle, schools, hospitals, connectivity to ORR.',
  priceRangePerSqft: { min: 7200, max: 12500, currency: 'INR' },
  topProjectKeywords: ['Whitefield', 'whitefield'],
  infrastructure:
    'TODO: paragraph on metro Phase 2, ORR connectivity, ITPL tech parks, schools (TISB, Inventure), hospitals (Manipal, Columbia Asia).',
  investmentOutlook:
    'TODO: 2026 outlook — price appreciation, rental yields, upcoming launches.',
  faqs: [
    {
      question: 'What is the average property price in Whitefield, Bangalore?',
      answer:
        'TODO: average ₹/sqft for apartments and villas in Whitefield as of Q2 2026.',
    },
    {
      question: 'Is Whitefield a good area to invest in real estate?',
      answer: 'TODO: investment thesis — IT job density, metro, established infra.',
    },
    {
      question: 'Which are the best luxury apartment projects in Whitefield?',
      answer: 'TODO: list 3–5 top projects with developer names.',
    },
    {
      question: 'How is connectivity from Whitefield to other parts of Bangalore?',
      answer: 'TODO: ORR, metro Phase 2 (Whitefield to KR Puram), train station.',
    },
    {
      question: 'What is the rental yield for property in Whitefield?',
      answer: 'TODO: typical 3–4% gross rental yield depending on segment.',
    },
  ],
  noindex: true,
};
```

- [ ] **Step 3: Create the other 5 (koramangala, sarjapur-road, hsr-layout, electronic-city, indiranagar)**

Copy whitefield.ts to each, edit:
- `slug`, `name`, `metaTitle`, `metaDescription` for the area
- `priceRangePerSqft` (use placeholder values — flagged in `intro` as TODO)
- `topProjectKeywords` (the area name and common alt spellings)
- All TODO body fields
- 5 FAQs — same structure, area-specific questions

- [ ] **Step 4: Create the index**

```ts
// src/data/areas/index.ts
import { whitefield } from './whitefield';
import { koramangala } from './koramangala';
import { sarjapurRoad } from './sarjapur-road';
import { hsrLayout } from './hsr-layout';
import { electronicCity } from './electronic-city';
import { indiranagar } from './indiranagar';
import type { AreaGuide } from './types';

export const ALL_AREAS: AreaGuide[] = [
  whitefield,
  koramangala,
  sarjapurRoad,
  hsrLayout,
  electronicCity,
  indiranagar,
];

export function getAreaBySlug(slug: string): AreaGuide | undefined {
  return ALL_AREAS.find((a) => a.slug === slug);
}

export function getAllAreaSlugs(): string[] {
  return ALL_AREAS.map((a) => a.slug);
}

export type { AreaGuide } from './types';
```

NOTE: The variable name `sarjapurRoad` (camelCase) is intentional — file name is kebab-case but JS exports must be valid identifiers.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/data/areas/
git commit -m "feat(seo): area guide data scaffolds for 6 Bangalore micromarkets (TODO content)"
```

---

## Task 2.2: `/areas/[slug]/page.tsx` route

**Files:**
- Create: `src/app/areas/[slug]/page.tsx`
- Create: `src/app/areas/[slug]/layout.tsx`

- [ ] **Step 1: Create the layout for metadata + JSON-LD**

```tsx
// src/app/areas/[slug]/layout.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { getAreaBySlug, getAllAreaSlugs } from '@/data/areas';

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllAreaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};
  return {
    title: area.metaTitle,
    description: area.metaDescription,
    alternates: { canonical: `/areas/${area.slug}` },
    robots: area.noindex ? { index: false, follow: true } : undefined,
  };
}

export default async function AreaLayout({ params, children }: Props) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();
  const faqSchema = buildFaqSchema(area.faqs.map((f) => ({ question: f.question, answer: f.answer })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Areas', url: '/areas' },
    { name: area.name, url: `/areas/${area.slug}` },
  ]);
  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
```

- [ ] **Step 2: Create the page**

```tsx
// src/app/areas/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getAreaBySlug, getAllAreaSlugs } from '@/data/areas';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { projectUrl } from '@/lib/seo/urls';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export async function generateStaticParams() {
  return getAllAreaSlugs().map((slug) => ({ slug }));
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  // Fetch projects whose location/city matches an area keyword
  const filters = (area.topProjectKeywords ?? [area.name]).join('|');
  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, project_name, location, city, min_price, max_price, images, developer_name, status')
    .or(filters.split('|').map((kw) => `location.ilike.%${kw}%,city.ilike.%${kw}%`).join(','))
    .eq('status', 'Available')
    .order('created_at', { ascending: false })
    .limit(12);

  return (
    <main className="min-h-screen">
      <Breadcrumbs
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Areas', href: '/areas' },
          { name: area.name },
        ]}
      />
      <header className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900">
          Luxury Real Estate in {area.name}, {area.city}
        </h1>
        <p className="mt-4 text-gray-700 max-w-3xl">{area.intro}</p>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-4">Top Projects in {area.name}</h2>
        {projects && projects.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <li key={p.id} className="border rounded p-4 hover:shadow">
                <Link href={projectUrl(p)} className="block">
                  <div className="font-medium text-gray-900">{p.project_name}</div>
                  {p.developer_name && <div className="text-sm text-gray-600">{p.developer_name}</div>}
                  {p.location && <div className="text-sm text-gray-500">{p.location}</div>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No projects currently listed in {area.name}. Check back soon.</p>
        )}
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-2">Infrastructure</h2>
        <p className="text-gray-700 max-w-3xl">{area.infrastructure}</p>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-2">Investment Outlook</h2>
        <p className="text-gray-700 max-w-3xl">{area.investmentOutlook}</p>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-4">Frequently Asked Questions</h2>
        <dl className="max-w-3xl space-y-4">
          {area.faqs.map((f, i) => (
            <div key={i}>
              <dt className="font-medium text-gray-900">{f.question}</dt>
              <dd className="text-gray-700 mt-1">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build emits 6 static `/areas/<slug>` pages.

- [ ] **Step 4: Smoke**

Run: `npm run dev`
Open: `http://localhost:3000/areas/whitefield` — confirm page renders with H1, breadcrumbs, FAQ, project list (or empty state).
Open: `http://localhost:3000/areas/foo` — should 404.

- [ ] **Step 5: Schema validator**

Paste a rendered area URL into https://validator.schema.org/. Expect FAQPage + BreadcrumbList valid.

- [ ] **Step 6: Commit**

```bash
git add src/app/areas/
git commit -m "feat(seo): /areas/[slug] route with FAQ + Breadcrumb schema (6 pages, noindex until content fills)"
```

---

## Task 2.3: `/developers/[slug]/page.tsx` route + 5 developer scaffolds

**Files:**
- Create: `src/data/developers/types.ts`
- Create: `src/data/developers/{prestige-group,sobha,godrej,brigade,lodha}.ts`
- Create: `src/data/developers/index.ts`
- Create: `src/app/developers/[slug]/page.tsx`
- Create: `src/app/developers/[slug]/layout.tsx`

- [ ] **Step 1: Define the Developer type**

```ts
// src/data/developers/types.ts
export type DeveloperFaq = { question: string; answer: string };
export type Developer = {
  slug: string;
  name: string;          // "Prestige Group"
  dbName: string;        // The exact value used in projects.developer_name
  founded?: number;
  brief: string;         // TODO
  metaTitle: string;
  metaDescription: string;
  faqs: DeveloperFaq[];
  noindex: boolean;
};
```

- [ ] **Step 2: Create 5 developer scaffolds (template)**

```ts
// src/data/developers/prestige-group.ts
import type { Developer } from './types';

export const prestigeGroup: Developer = {
  slug: 'prestige-group',
  name: 'Prestige Group',
  dbName: 'Prestige Group',
  founded: 1986,
  brief: 'TODO: 200-word brief on Prestige Group — flagship projects, RERA compliance, delivery track record.',
  metaTitle: 'Prestige Group Projects in Bangalore | 27 Estates',
  metaDescription:
    'Explore all Prestige Group projects in Bangalore — luxury apartments, villas, commercial, and new launches. RERA-approved listings on 27 Estates.',
  faqs: [
    { question: 'Is Prestige Group RERA approved?', answer: 'TODO' },
    { question: 'How many years has Prestige Group been delivering projects?', answer: 'TODO' },
    { question: 'What are the best Prestige Group projects in Bangalore?', answer: 'TODO' },
    { question: 'Where are Prestige Group offices located?', answer: 'TODO' },
  ],
  noindex: true,
};
```

Repeat for `sobha.ts`, `godrej.ts`, `brigade.ts`, `lodha.ts` with appropriate `dbName` values (must match exactly what the projects table stores in `developer_name`).

- [ ] **Step 3: Verify dbName values match the database**

Use `mcp__supabase__execute_sql`:
```sql
select developer_name, count(*) from public.projects group by developer_name order by count(*) desc;
```

Update `dbName` in each developer file to match the EXACT casing used in the database.

- [ ] **Step 4: Create index**

```ts
// src/data/developers/index.ts
import { prestigeGroup } from './prestige-group';
import { sobha } from './sobha';
import { godrej } from './godrej';
import { brigade } from './brigade';
import { lodha } from './lodha';
import type { Developer } from './types';

export const ALL_DEVELOPERS: Developer[] = [prestigeGroup, sobha, godrej, brigade, lodha];
export function getDeveloperBySlug(slug: string): Developer | undefined {
  return ALL_DEVELOPERS.find((d) => d.slug === slug);
}
export function getAllDeveloperSlugs(): string[] {
  return ALL_DEVELOPERS.map((d) => d.slug);
}
export type { Developer };
```

- [ ] **Step 5: Create `/developers/[slug]/layout.tsx` (mirror of areas layout)**

```tsx
// src/app/developers/[slug]/layout.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { getDeveloperBySlug, getAllDeveloperSlugs } from '@/data/developers';

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };
export const dynamicParams = false;
export async function generateStaticParams() {
  return getAllDeveloperSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dev = getDeveloperBySlug(slug);
  if (!dev) return {};
  return {
    title: dev.metaTitle,
    description: dev.metaDescription,
    alternates: { canonical: `/developers/${dev.slug}` },
    robots: dev.noindex ? { index: false, follow: true } : undefined,
  };
}

export default async function DeveloperLayout({ params, children }: Props) {
  const { slug } = await params;
  const dev = getDeveloperBySlug(slug);
  if (!dev) notFound();
  const faqSchema = buildFaqSchema(dev.faqs);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Developers', url: '/developers' },
    { name: dev.name, url: `/developers/${dev.slug}` },
  ]);
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dev.name,
    foundingDate: dev.founded ? `${dev.founded}` : undefined,
    url: `https://www.27estates.com/developers/${dev.slug}`,
  };
  return (
    <>
      <JsonLd data={orgSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
```

- [ ] **Step 6: Create `/developers/[slug]/page.tsx`**

```tsx
// src/app/developers/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getDeveloperBySlug, getAllDeveloperSlugs } from '@/data/developers';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { projectUrl } from '@/lib/seo/urls';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export async function generateStaticParams() {
  return getAllDeveloperSlugs().map((slug) => ({ slug }));
}

export default async function DeveloperPage({ params }: Props) {
  const { slug } = await params;
  const dev = getDeveloperBySlug(slug);
  if (!dev) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, project_name, location, city, min_price, max_price, status, is_rera_approved')
    .eq('developer_name', dev.dbName)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen">
      <Breadcrumbs
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Developers', href: '/developers' },
          { name: dev.name },
        ]}
      />
      <header className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-gray-900">
          {dev.name} Projects in Bangalore
        </h1>
        <p className="mt-4 text-gray-700 max-w-3xl">{dev.brief}</p>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-4">All {dev.name} Projects</h2>
        {projects && projects.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <li key={p.id} className="border rounded p-4 hover:shadow">
                <Link href={projectUrl(p)} className="block">
                  <div className="font-medium text-gray-900">{p.project_name}</div>
                  {p.location && <div className="text-sm text-gray-500">{p.location}</div>}
                  {p.is_rera_approved && (
                    <div className="text-xs text-green-700 mt-1">RERA Approved</div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No {dev.name} projects currently listed. Check back soon.</p>
        )}
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-4">Frequently Asked Questions</h2>
        <dl className="max-w-3xl space-y-4">
          {dev.faqs.map((f, i) => (
            <div key={i}>
              <dt className="font-medium text-gray-900">{f.question}</dt>
              <dd className="text-gray-700 mt-1">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Type-check + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 8: Smoke**

Run: `npm run dev`. Hit each of the 5 developer URLs. Confirm projects list populates correctly.

- [ ] **Step 9: Commit**

```bash
git add src/data/developers/ src/app/developers/
git commit -m "feat(seo): /developers/[slug] route with 5 hubs (Prestige, Sobha, Godrej, Brigade, Lodha)"
```

---

## Task 2.4: Update sitemap to include areas + developers

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Replace the `areasAndDevelopersSitemap()` placeholder with real data**

```ts
import { getAllAreaSlugs } from '@/data/areas';
import { getAllDeveloperSlugs } from '@/data/developers';
import { ALL_AREAS } from '@/data/areas';
import { ALL_DEVELOPERS } from '@/data/developers';

async function areasAndDevelopersSitemap(): Promise<MetadataRoute.Sitemap> {
  const areaEntries = ALL_AREAS
    .filter((a) => !a.noindex)
    .map((a) => ({
      url: `${BASE_URL}/areas/${a.slug}`,
      lastModified: new Date(),
      priority: 0.85,
      changeFrequency: 'weekly' as const,
    }));
  const devEntries = ALL_DEVELOPERS
    .filter((d) => !d.noindex)
    .map((d) => ({
      url: `${BASE_URL}/developers/${d.slug}`,
      lastModified: new Date(),
      priority: 0.85,
      changeFrequency: 'weekly' as const,
    }));
  return [...areaEntries, ...devEntries];
}
```

Areas/developers stay out of sitemap until `noindex: false` is flipped (i.e., until content is filled).

- [ ] **Step 2: Build + verify**

Run: `npm run build && npm run dev`
Open: `http://localhost:3000/sitemap/4.xml` — should be empty array initially (everything noindex). Once one area's `noindex` flips to `false`, that URL appears.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): sitemap honors area/developer noindex; auto-include when published"
```

---

## Task 2.5: ComparisonTemplate component

**Files:**
- Create: `src/components/blog/ComparisonTemplate.tsx`

- [ ] **Step 1: Build the component**

```tsx
// src/components/blog/ComparisonTemplate.tsx
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema } from '@/lib/seo/schema';

type Side = { name: string; bullets: string[] };
type Criterion = { label: string; left: string; right: string };
type Faq = { question: string; answer: string };

type Props = {
  title: string;
  intro: string;
  left: Side;
  right: Side;
  criteria: Criterion[];
  verdict: string;
  faqs: Faq[];
};

export default function ComparisonTemplate({
  title,
  intro,
  left,
  right,
  criteria,
  verdict,
  faqs,
}: Props) {
  return (
    <article className="prose max-w-3xl mx-auto px-4 py-8">
      <h1>{title}</h1>
      <p>{intro}</p>

      <h2>At a Glance</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>{left.name}</th>
            <th>{right.name}</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => (
            <tr key={c.label}>
              <td>{c.label}</td>
              <td>{c.left}</td>
              <td>{c.right}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{left.name} — Highlights</h2>
      <ul>{left.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>

      <h2>{right.name} — Highlights</h2>
      <ul>{right.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>

      <h2>Verdict</h2>
      <p>{verdict}</p>

      <h2>Frequently Asked Questions</h2>
      <dl>
        {faqs.map((f, i) => (
          <div key={i}>
            <dt><strong>{f.question}</strong></dt>
            <dd>{f.answer}</dd>
          </div>
        ))}
      </dl>

      <JsonLd data={buildFaqSchema(faqs)} />
    </article>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/blog/ComparisonTemplate.tsx
git commit -m "feat(seo): ComparisonTemplate component for blog comparison posts"
```

---

## Task 2.6: RelatedProjects + RelatedListings widgets

**Files:**
- Create: `src/components/blog/RelatedProjects.tsx`
- Create: `src/components/blog/RelatedListings.tsx`

- [ ] **Step 1: RelatedProjects (server component)**

```tsx
// src/components/blog/RelatedProjects.tsx
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { projectUrl } from '@/lib/seo/urls';

type Props = {
  developerName?: string;
  area?: string;
  limit?: number;
};

export default async function RelatedProjects({ developerName, area, limit = 3 }: Props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  let q = supabase
    .from('projects')
    .select('id, slug, project_name, location, developer_name')
    .eq('status', 'Available');
  if (developerName) q = q.eq('developer_name', developerName);
  if (area) q = q.ilike('location', `%${area}%`);
  const { data } = await q.limit(limit);

  if (!data || data.length === 0) return null;

  return (
    <aside className="border-t mt-8 pt-6">
      <h3 className="font-serif text-xl text-gray-900 mb-4">Related Projects</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((p) => (
          <li key={p.id} className="border rounded p-3 hover:shadow">
            <Link href={projectUrl(p)} className="block">
              <div className="font-medium text-gray-900">{p.project_name}</div>
              {p.developer_name && <div className="text-sm text-gray-600">{p.developer_name}</div>}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 2: RelatedListings — same pattern but for `properties` table**

```tsx
// src/components/blog/RelatedListings.tsx
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { propertyUrl } from '@/lib/seo/urls';

type Props = { area?: string; category?: string; limit?: number };

export default async function RelatedListings({ area, category, limit = 3 }: Props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  let q = supabase
    .from('properties')
    .select('id, slug, title, location, category')
    .eq('status', 'Available');
  if (area) q = q.ilike('location', `%${area}%`);
  if (category) q = q.eq('category', category);
  const { data } = await q.limit(limit);

  if (!data || data.length === 0) return null;

  return (
    <aside className="border-t mt-8 pt-6">
      <h3 className="font-serif text-xl text-gray-900 mb-4">Featured Listings</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((p) => (
          <li key={p.id} className="border rounded p-3 hover:shadow">
            <Link href={propertyUrl(p)} className="block">
              <div className="font-medium text-gray-900">{p.title}</div>
              {p.location && <div className="text-sm text-gray-600">{p.location}</div>}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 3: Wire into the blog detail page**

In `src/app/blog/[slug]/page.tsx`, after the post body, add:

```tsx
import RelatedProjects from '@/components/blog/RelatedProjects';
import RelatedListings from '@/components/blog/RelatedListings';

// At the bottom of the rendered page:
<RelatedProjects
  developerName={blog.related_developer ?? undefined}
  area={blog.related_area ?? undefined}
/>
<RelatedListings
  area={blog.related_area ?? undefined}
  category={blog.related_category ?? undefined}
/>
```

If `blogs` table has no `related_developer`/`related_area`/`related_category` columns, derive from tags or omit those props for now.

- [ ] **Step 4: Type-check + build + smoke**

Run: `npx tsc --noEmit && npm run build && npm run dev`
Open: a blog post → confirm the two widgets render at the bottom (or empty if no matches).

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/ src/app/blog/[slug]/page.tsx
git commit -m "feat(seo): RelatedProjects + RelatedListings widgets on blog detail (link equity)"
```

---

## Phase 2 Closeout

- [ ] **Smoke pass: 6 areas + 5 developers + 1 blog post all return 200, all have valid schema**
- [ ] **Open Phase 2 PR**

```bash
gh pr create --title "feat(seo): Phase 2 — area pages, developer hubs, blog enhancements" --body "Implements Phase 2 of docs/superpowers/specs/2026-05-03-seo-aeo-foundation-design.md. Pages noindex until prose is filled by content team."
```

---

# Phase 3 — GEO / E-E-A-T (PR 3)

## Task 3.1: `/market-data` static page

**Files:**
- Create: `src/data/market-data.ts`
- Create: `src/app/market-data/page.tsx`

- [ ] **Step 1: Create the market-data dataset (TODO values)**

```ts
// src/data/market-data.ts
export type AreaPriceTrend = {
  area: string;
  pricePerSqft: number; // ₹
  yoyChangePct: number;
  rentalYieldPct: number;
  topProject: string;
  asOf: string; // ISO date
};

export const BANGALORE_PRICE_TRENDS: AreaPriceTrend[] = [
  { area: 'Whitefield', pricePerSqft: 8500, yoyChangePct: 7.2, rentalYieldPct: 3.5, topProject: 'TODO', asOf: '2026-04-01' },
  { area: 'Sarjapur Road', pricePerSqft: 7200, yoyChangePct: 9.1, rentalYieldPct: 3.7, topProject: 'TODO', asOf: '2026-04-01' },
  { area: 'Koramangala', pricePerSqft: 12500, yoyChangePct: 4.5, rentalYieldPct: 2.8, topProject: 'TODO', asOf: '2026-04-01' },
  { area: 'HSR Layout', pricePerSqft: 9800, yoyChangePct: 6.0, rentalYieldPct: 3.2, topProject: 'TODO', asOf: '2026-04-01' },
  { area: 'Electronic City', pricePerSqft: 6500, yoyChangePct: 8.4, rentalYieldPct: 4.1, topProject: 'TODO', asOf: '2026-04-01' },
  { area: 'Indiranagar', pricePerSqft: 14000, yoyChangePct: 3.2, rentalYieldPct: 2.5, topProject: 'TODO', asOf: '2026-04-01' },
];
```

The team replaces TODO and verifies numbers against real CRM/RERA/CREDAI data before flipping `noindex` off.

- [ ] **Step 2: Create the page**

```tsx
// src/app/market-data/page.tsx
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema, buildArticleSchema } from '@/lib/seo/schema';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { BANGALORE_PRICE_TRENDS } from '@/data/market-data';

export const metadata: Metadata = {
  title: 'Bangalore Real Estate Market Data | Price Trends by Area | 27 Estates',
  description:
    'Latest Bangalore real estate market data — price per sqft, year-over-year change, and rental yield by area. Updated quarterly by 27 Estates.',
  alternates: { canonical: '/market-data' },
  robots: { index: false, follow: true }, // flip to index when team validates the data
};

export default function MarketDataPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Market Data', url: '/market-data' },
  ]);
  const articleSchema = buildArticleSchema({
    title: 'Bangalore Real Estate Market Data',
    description: 'Quarterly price trend report for Bangalore micromarkets',
    url: '/market-data',
    datePublished: BANGALORE_PRICE_TRENDS[0]?.asOf,
    dateModified: BANGALORE_PRICE_TRENDS[0]?.asOf,
  });

  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={articleSchema} />
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Market Data' }]} />
      <header className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-gray-900">
          Bangalore Real Estate Market Data
        </h1>
        <p className="mt-4 text-gray-700 max-w-3xl">
          Price trends, rental yields, and market movement across Bangalore's premium micromarkets, updated quarterly.
        </p>
      </header>
      <section className="px-4 sm:px-6 lg:px-8 py-6 overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4">Area</th>
              <th className="py-2 pr-4">Avg ₹ / sqft</th>
              <th className="py-2 pr-4">YoY Change</th>
              <th className="py-2 pr-4">Rental Yield</th>
              <th className="py-2 pr-4">Top Project</th>
              <th className="py-2">As Of</th>
            </tr>
          </thead>
          <tbody>
            {BANGALORE_PRICE_TRENDS.map((row) => (
              <tr key={row.area} className="border-b">
                <td className="py-2 pr-4 font-medium">{row.area}</td>
                <td className="py-2 pr-4">₹{row.pricePerSqft.toLocaleString('en-IN')}</td>
                <td className="py-2 pr-4">{row.yoyChangePct > 0 ? '+' : ''}{row.yoyChangePct}%</td>
                <td className="py-2 pr-4">{row.rentalYieldPct}%</td>
                <td className="py-2 pr-4">{row.topProject}</td>
                <td className="py-2 text-gray-500 text-sm">{row.asOf}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-4">
          Source: 27 Estates internal CRM data + RERA filings. Methodology and full report available on request.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Type-check + build + smoke**

Run: `npx tsc --noEmit && npm run build && npm run dev`
Open: `http://localhost:3000/market-data` — confirm table renders, schema present.

- [ ] **Step 4: Commit**

```bash
git add src/data/market-data.ts src/app/market-data/page.tsx
git commit -m "feat(seo): /market-data page (noindex until team validates numbers)"
```

---

## Task 3.2: About-page E-E-A-T enhancement

**Files:**
- Read: existing about page (route or in-component) — possibly missing
- Create or modify: `src/app/about/page.tsx`
- Create: `src/data/team.ts`

- [ ] **Step 1: Check whether `/about` exists**

```bash
ls src/app/about 2>/dev/null || echo "no about route — create it"
```

- [ ] **Step 2: Create team data**

```ts
// src/data/team.ts
export type TeamMember = {
  name: string;
  jobTitle: string;
  bio: string; // TODO
  imageUrl?: string;
  linkedin?: string;
  founder?: boolean;
};

export const TEAM: TeamMember[] = [
  {
    name: 'TODO: Founder name',
    jobTitle: 'Founder & CEO',
    bio: 'TODO: 150-word bio — years in real estate, prior firms, transactions value, areas of expertise.',
    linkedin: 'TODO: LinkedIn URL',
    founder: true,
  },
  // Add more members as needed
];

export const COMPANY_FACTS = {
  founded: 0, // TODO
  reraNumber: 'TODO: Karnataka RERA registration number',
  citiesServed: ['Bangalore', 'Mumbai', 'Pune', 'Hyderabad'],
  totalTransactionsValueINR: 0, // TODO — for "₹X crore facilitated" stat
};
```

- [ ] **Step 3: Create the about page**

```tsx
// src/app/about/page.tsx
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildPersonSchema,
} from '@/lib/seo/schema';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { TEAM, COMPANY_FACTS } from '@/data/team';

export const metadata: Metadata = {
  title: 'About 27 Estates | Premium Real Estate Advisory in Bangalore',
  description:
    "Founded in Bangalore, 27 Estates is a premium real estate advisory specialising in luxury apartments, villas, and new project launches across India's prime markets.",
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ]);
  const orgSchema = buildOrganizationSchema();
  const founderSchema = TEAM.find((t) => t.founder)
    ? buildPersonSchema({
        name: TEAM.find((t) => t.founder)!.name,
        jobTitle: TEAM.find((t) => t.founder)!.jobTitle,
        image: TEAM.find((t) => t.founder)!.imageUrl,
        sameAs: TEAM.find((t) => t.founder)!.linkedin
          ? [TEAM.find((t) => t.founder)!.linkedin!]
          : undefined,
        worksFor: '27 Estates',
      })
    : null;

  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={orgSchema} />
      <JsonLd data={founderSchema} />
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'About' }]} />
      <header className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-gray-900">About 27 Estates</h1>
        <p className="mt-4 text-gray-700 max-w-3xl">
          27 Estates is a premium real estate advisory & brokerage firm headquartered at
          Infantry Road, Bangalore. We specialise in luxury apartments, villas, and new
          project launches across {COMPANY_FACTS.citiesServed.join(', ')}.
        </p>
      </header>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-4">Credentials</h2>
        <ul className="text-gray-700 space-y-2 max-w-3xl">
          <li>RERA Registration: {COMPANY_FACTS.reraNumber}</li>
          {COMPANY_FACTS.founded > 0 && <li>Founded: {COMPANY_FACTS.founded}</li>}
          <li>Cities served: {COMPANY_FACTS.citiesServed.join(', ')}</li>
        </ul>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="font-serif text-2xl text-gray-900 mb-4">Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {TEAM.map((m) => (
            <div key={m.name} className="border rounded p-4">
              <div className="font-medium text-gray-900">{m.name}</div>
              <div className="text-sm text-gray-600">{m.jobTitle}</div>
              <p className="text-sm text-gray-700 mt-2">{m.bio}</p>
              {m.linkedin && (
                <a
                  href={m.linkedin}
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  LinkedIn →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Type-check + build + smoke**

Run: `npx tsc --noEmit && npm run build && npm run dev`
Open: `http://localhost:3000/about` — confirm page renders.

- [ ] **Step 5: Commit**

```bash
git add src/data/team.ts src/app/about/page.tsx
git commit -m "feat(seo): /about page with E-E-A-T (Person + Organization schema)"
```

---

## Task 3.3: Add `/about`, `/market-data`, `/areas`, `/developers` index landing pages

**Files:**
- Create: `src/app/areas/page.tsx`
- Create: `src/app/developers/page.tsx`

`/about` and `/market-data` are already pages from Task 3.2 and 3.1. We need landing pages for `/areas` and `/developers` so breadcrumb links don't 404.

- [ ] **Step 1: `/areas/page.tsx`**

```tsx
// src/app/areas/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { ALL_AREAS } from '@/data/areas';

export const metadata: Metadata = {
  title: 'Bangalore Areas | Luxury Real Estate Guides | 27 Estates',
  description:
    'Explore luxury real estate guides for Bangalore micromarkets — Whitefield, Koramangala, Sarjapur Road, HSR Layout, Electronic City, and Indiranagar.',
  alternates: { canonical: '/areas' },
};

export default function AreasIndexPage() {
  return (
    <main className="min-h-screen">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Areas' }]} />
      <header className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-gray-900">
          Bangalore Real Estate by Area
        </h1>
        <p className="mt-4 text-gray-700 max-w-3xl">
          Detailed guides for Bangalore's premium micromarkets — pricing, infrastructure, top projects, and investment outlook.
        </p>
      </header>
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_AREAS.map((a) => (
            <li key={a.slug} className="border rounded p-4 hover:shadow">
              <Link href={`/areas/${a.slug}`} className="block">
                <div className="font-medium text-gray-900">{a.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {a.priceRangePerSqft
                    ? `₹${a.priceRangePerSqft.min.toLocaleString('en-IN')} – ₹${a.priceRangePerSqft.max.toLocaleString('en-IN')} / sqft`
                    : 'Price on request'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: `/developers/page.tsx`** (mirror of areas index)

```tsx
// src/app/developers/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { ALL_DEVELOPERS } from '@/data/developers';

export const metadata: Metadata = {
  title: 'Real Estate Developers in Bangalore | 27 Estates',
  description:
    'Browse projects from top real estate developers in Bangalore — Prestige Group, Sobha, Godrej, Brigade, and Lodha.',
  alternates: { canonical: '/developers' },
};

export default function DevelopersIndexPage() {
  return (
    <main className="min-h-screen">
      <Breadcrumbs crumbs={[{ name: 'Home', href: '/' }, { name: 'Developers' }]} />
      <header className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-gray-900">
          Top Real Estate Developers in Bangalore
        </h1>
      </header>
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_DEVELOPERS.map((d) => (
            <li key={d.slug} className="border rounded p-4 hover:shadow">
              <Link href={`/developers/${d.slug}`} className="block">
                <div className="font-medium text-gray-900">{d.name}</div>
                {d.founded && <div className="text-sm text-gray-600 mt-1">Since {d.founded}</div>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add /about, /market-data, /areas, /developers to the static-routes sitemap**

Edit `src/app/sitemap.ts` `staticRoutes()` and add:

```ts
{ url: `${BASE_URL}/areas`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly' },
{ url: `${BASE_URL}/developers`, lastModified: new Date(), priority: 0.7, changeFrequency: 'monthly' },
// /about already there; /market-data add only after team validates data
```

- [ ] **Step 4: Type-check + build + smoke**

Run: `npx tsc --noEmit && npm run build && npm run dev`
Hit `/areas`, `/developers`, `/about`, `/market-data` → confirm all 200.

- [ ] **Step 5: Commit**

```bash
git add src/app/areas/page.tsx src/app/developers/page.tsx src/app/sitemap.ts
git commit -m "feat(seo): /areas and /developers index pages + sitemap entries"
```

---

## Phase 3 Closeout

- [ ] **Smoke pass: `/about`, `/market-data`, `/areas`, `/developers` all 200 + valid schema**

- [ ] **Open Phase 3 PR**

```bash
gh pr create --title "feat(seo): Phase 3 — market data + about E-E-A-T + index pages" --body "Implements Phase 3 of docs/superpowers/specs/2026-05-03-seo-aeo-foundation-design.md."
```

---

# Plan Self-Review

Coverage check (against spec § 2):

| Spec item | Task | Status |
|---|---|---|
| 1. Slug URLs additive | 1.9, 1.10, 1.12 | ✓ |
| 2. Centralized SEO module | 1.1, 1.2 | ✓ |
| 3. Homepage meta rewrite | 1.3 | ✓ |
| 4. Un-cloak project H1 | 1.5 | ✓ |
| 5. FAQPage schema | 1.4 (project), 1.6 (property), 2.2 (area), 2.3 (dev), 2.5 (blog comparison) | ✓ |
| 6. BreadcrumbList schema | 1.4, 1.6, 1.7, 1.8 | ✓ |
| 7. Article schema on blog | 1.7 | ✓ |
| 8. Property RealEstateListing parity | 1.6 | ✓ |
| 9. Property generateMetadata parity | 1.6 | ✓ |
| 10. Sitemap split | 1.11, 2.4, 3.3 | ✓ |
| 11. /areas/[slug] | 2.1, 2.2 | ✓ |
| 12. /developers/[slug] | 2.3 | ✓ |
| 13. ComparisonTemplate | 2.5 | ✓ |
| 14. RelatedProjects/Listings | 2.6 | ✓ |
| 15. /market-data | 3.1 | ✓ |
| 16. About + E-E-A-T | 3.2 | ✓ |
| 17. Review/HowTo schema | Deferred — these only apply when real reviews / how-to content exists. Spec § 9.5 flags as data-dependent. | Deferred |

Item 17 is intentionally deferred — `aggregateRating` requires real reviews and `HowTo` requires step-format content; neither exists yet. Tasks added only when content does.

Type / signature consistency: `projectUrl`, `propertyUrl`, `getAreaBySlug`, `getDeveloperBySlug` defined once, used consistently across tasks.

No placeholders inside the plan itself (TODO appears only inside generated content scaffolds, which is intentional and called out).

---

## Execution Handoff

Plan complete and committed. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session, batch with checkpoints.

Which approach?
