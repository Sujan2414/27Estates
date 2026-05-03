import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Home Loan EMI Calculator | Calculate Mortgage Payments | 27 Estates',
    description:
        'Free home loan EMI calculator for Bangalore real estate purchases. Calculate monthly mortgage payments, total interest, and amortization for your luxury property purchase.',
    keywords: [
        'home loan emi calculator',
        'mortgage calculator india',
        'home loan calculator bangalore',
        'property loan emi',
        'real estate emi calculator',
    ],
    alternates: { canonical: '/mortgage-calculator' },
    openGraph: {
        title: 'Home Loan EMI Calculator | 27 Estates',
        description: 'Free home loan EMI calculator for Bangalore real estate purchases.',
        url: `${SITE_URL}/mortgage-calculator`,
        type: 'website',
    },
};

export default function MortgageCalculatorLayout({ children }: { children: React.ReactNode }) {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Mortgage Calculator', url: '/mortgage-calculator' },
    ]);
    return (
        <>
            <JsonLd data={breadcrumb} />
            {children}
        </>
    );
}
