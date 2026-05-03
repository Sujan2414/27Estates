import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { getAreaBySlug, getAllAreaSlugs } from '@/data/areas';

const SITE_URL = 'https://www.27estates.com';

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
        openGraph: {
            title: area.metaTitle,
            description: area.metaDescription,
            url: `${SITE_URL}/areas/${area.slug}`,
            type: 'website',
        },
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
