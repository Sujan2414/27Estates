import type { Metadata } from 'next';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Commercial Real Estate in Bangalore | Office Space, Retail, Shop for Sale & Rent | 27 Estates',
    description:
        "Premium commercial real estate in Bangalore — office spaces, retail outlets, and shops for sale and rent in Whitefield, ORR, Indiranagar, Koramangala, and more.",
    keywords: [
        'commercial real estate bangalore',
        'office space bangalore',
        'retail space bangalore',
        'commercial property for sale bangalore',
        'commercial property for rent bangalore',
        'office space whitefield',
        'office space orr bangalore',
    ],
    alternates: { canonical: '/properties/commercial' },
    openGraph: {
        title: 'Commercial Real Estate in Bangalore | 27 Estates',
        description:
            'Office spaces, retail outlets, and commercial properties for sale and rent across Bangalore on 27 Estates.',
        url: `${SITE_URL}/properties/commercial`,
        type: 'website',
    },
};

export default function PropertiesCommercialLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
