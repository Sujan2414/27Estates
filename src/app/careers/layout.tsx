import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Careers at 27 Estates | Join Bangalore\'s Premier Real Estate Advisory',
    description:
        "Build your real estate career at 27 Estates — Bangalore's premium real estate advisory. Open roles in sales, advisory, marketing, and operations across India.",
    keywords: [
        'real estate careers bangalore',
        'real estate jobs bangalore',
        '27 estates careers',
        'real estate advisor jobs',
        'property consultant jobs bangalore',
    ],
    alternates: { canonical: '/careers' },
    openGraph: {
        title: 'Careers at 27 Estates | Bangalore Real Estate Advisory',
        description: "Build your real estate career at 27 Estates. Open roles across India.",
        url: `${SITE_URL}/careers`,
        type: 'website',
    },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Careers', url: '/careers' },
    ]);
    return (
        <>
            <JsonLd data={breadcrumb} />
            {children}
        </>
    );
}
