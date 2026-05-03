import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { getDeveloperBySlug, getAllDeveloperSlugs } from '@/data/developers';

const SITE_URL = 'https://www.27estates.com';

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
        openGraph: {
            title: dev.metaTitle,
            description: dev.metaDescription,
            url: `${SITE_URL}/developers/${dev.slug}`,
            type: 'website',
        },
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
        ...(dev.founded ? { foundingDate: `${dev.founded}` } : {}),
        ...(dev.headquarters ? {
            address: { '@type': 'PostalAddress', addressLocality: dev.headquarters, addressCountry: 'IN' },
        } : {}),
        url: `${SITE_URL}/developers/${dev.slug}`,
        description: dev.brief,
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
