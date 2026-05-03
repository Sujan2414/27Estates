import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Contact 27 Estates | Bangalore Real Estate Advisory | Schedule a Consultation',
    description:
        'Reach 27 Estates for premium real estate advisory in Bangalore. Visit our Infantry Road office, call +91 80957 99929, or email connect@27estates.com to schedule a consultation.',
    keywords: [
        'contact 27 estates',
        'real estate advisory contact bangalore',
        'luxury real estate consultation bangalore',
        '27 estates infantry road office',
    ],
    alternates: { canonical: '/contact' },
    openGraph: {
        title: 'Contact 27 Estates | Bangalore Real Estate Advisory',
        description:
            'Reach 27 Estates for premium real estate advisory in Bangalore. Schedule a consultation today.',
        url: `${SITE_URL}/contact`,
        type: 'website',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Contact', url: '/contact' },
    ]);
    return (
        <>
            <JsonLd data={breadcrumb} />
            {children}
        </>
    );
}
