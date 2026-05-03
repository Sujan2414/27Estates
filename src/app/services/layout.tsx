import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Real Estate Services in Bangalore | Advisory, Investment, Project Marketing | 27 Estates',
    description:
        'Real estate services from 27 Estates — luxury residential & commercial advisory, NRI investment consulting, project marketing, and land advisory across Bangalore, Mumbai, Pune, Hyderabad.',
    keywords: [
        'real estate services bangalore',
        'real estate advisory services bangalore',
        'property consultant services bangalore',
        'real estate investment services bangalore',
        'nri real estate services',
        'project marketing services bangalore',
    ],
    alternates: { canonical: '/services' },
    openGraph: {
        title: 'Real Estate Services in Bangalore | 27 Estates',
        description:
            'Luxury residential & commercial advisory, NRI investment consulting, project marketing, land advisory across India by 27 Estates.',
        url: `${SITE_URL}/services`,
        type: 'website',
    },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Services', url: '/services' },
    ]);
    const orgServiceSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        provider: {
            '@type': 'RealEstateAgent',
            name: '27 Estates',
            url: SITE_URL,
        },
        areaServed: ['Bangalore', 'Mumbai', 'Pune', 'Hyderabad'],
        serviceType: 'Real Estate Advisory',
        description:
            'Premium real estate advisory, brokerage, investment consulting, and project marketing services across India.',
    };
    return (
        <>
            <JsonLd data={breadcrumb} />
            <JsonLd data={orgServiceSchema} />
            {children}
        </>
    );
}
