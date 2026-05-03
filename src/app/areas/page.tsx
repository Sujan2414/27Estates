import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { ALL_AREAS } from '@/data/areas';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Bangalore Areas | Luxury Real Estate Guides by Micromarket | 27 Estates',
    description:
        'In-depth area guides for Bangalore\'s premium real estate micromarkets — Whitefield, Sarjapur Road, Koramangala, HSR Layout, Electronic City, and Indiranagar. Pricing, infrastructure, top projects, investment outlook.',
    keywords: [
        'bangalore real estate areas',
        'bangalore micromarket guide',
        'best areas to buy property bangalore',
        'whitefield koramangala sarjapur',
        'bangalore neighbourhood real estate',
    ],
    alternates: { canonical: '/areas' },
    openGraph: {
        title: 'Bangalore Areas | Luxury Real Estate Guides | 27 Estates',
        description:
            'In-depth area guides for Bangalore\'s premium real estate micromarkets.',
        url: `${SITE_URL}/areas`,
        type: 'website',
    },
};

export default function AreasIndexPage() {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Areas', url: '/areas' },
    ]);
    const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Bangalore Real Estate Areas',
        numberOfItems: ALL_AREAS.length,
        itemListElement: ALL_AREAS.map((a, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/areas/${a.slug}`,
            name: `Luxury Real Estate in ${a.name}, ${a.city}`,
        })),
    };

    return (
        <>
            <JsonLd data={breadcrumb} />
            <JsonLd data={itemList} />
            <Navigation />
            <main className="min-h-screen bg-white pt-24 pb-12">
                <header className="container mx-auto max-w-5xl px-4 py-8">
                    <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-3">
                        Bangalore Real Estate by Area
                    </h1>
                    <p className="text-base text-gray-700 max-w-3xl leading-relaxed">
                        In-depth guides for Bangalore&apos;s premium real estate micromarkets — pricing, infrastructure, top projects, and investment outlook for each neighbourhood.
                    </p>
                </header>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ALL_AREAS.map((a) => (
                            <li key={a.slug} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                                <Link href={`/areas/${a.slug}`} className="block">
                                    <div className="font-serif text-xl text-gray-900">{a.name}</div>
                                    <div className="text-sm text-gray-500 mt-1">{a.city}, {a.state}</div>
                                    {a.priceRangePerSqft && (
                                        <div className="text-sm text-gray-700 mt-3">
                                            ₹{a.priceRangePerSqft.min.toLocaleString('en-IN')} – ₹{a.priceRangePerSqft.max.toLocaleString('en-IN')} / sqft
                                        </div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}
