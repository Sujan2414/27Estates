import type { Metadata } from 'next';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Search Properties in Bangalore | Filter Apartments, Villas, Plots & Commercial | 27 Estates',
    description:
        "Search 365+ projects and 50+ properties in Bangalore by location, BHK, price, and category. Find luxury apartments, villas, plots, commercial space, and warehouses.",
    keywords: [
        'search properties bangalore',
        'filter properties bangalore',
        'find luxury apartment bangalore',
        'real estate search bangalore',
    ],
    alternates: { canonical: '/properties/search' },
    openGraph: {
        title: 'Search Properties in Bangalore | 27 Estates',
        description:
            'Search luxury apartments, villas, plots, commercial space, and warehouses in Bangalore. Filter by location, BHK, price, and more on 27 Estates.',
        url: `${SITE_URL}/properties/search`,
        type: 'website',
    },
};

export default function PropertiesSearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
