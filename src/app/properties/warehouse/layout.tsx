import type { Metadata } from 'next';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Warehouses & Industrial Property in Bangalore | For Sale & Rent | 27 Estates',
    description:
        "Warehouses, godowns, and industrial property for sale and rent in Bangalore. Bommasandra, Peenya, Hoskote, Yelahanka and other industrial corridors covered by 27 Estates.",
    keywords: [
        'warehouse bangalore',
        'industrial property bangalore',
        'warehouse for sale bangalore',
        'warehouse for rent bangalore',
        'godown bangalore',
        'warehouse bommasandra',
        'warehouse peenya',
    ],
    alternates: { canonical: '/properties/warehouse' },
    openGraph: {
        title: 'Warehouses & Industrial Property in Bangalore | 27 Estates',
        description:
            'Warehouses, godowns, and industrial property for sale and rent across Bangalore industrial corridors on 27 Estates.',
        url: `${SITE_URL}/properties/warehouse`,
        type: 'website',
    },
};

export default function PropertiesWarehouseLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
