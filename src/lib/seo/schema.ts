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
