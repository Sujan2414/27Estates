import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { ALL_DEVELOPERS } from '@/data/developers';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Top Real Estate Developers in Bangalore | Prestige, Sobha, Godrej, Brigade, Lodha | 27 Estates',
    description:
        'Browse projects from Bangalore\'s top real estate developers — Prestige Group, Sobha Limited, Godrej Properties, Brigade Group, and Lodha. RERA-approved luxury inventory listed on 27 Estates.',
    keywords: [
        'top real estate developers bangalore',
        'best builders bangalore',
        'prestige projects bangalore',
        'sobha projects bangalore',
        'godrej projects bangalore',
        'brigade projects bangalore',
        'lodha projects bangalore',
    ],
    alternates: { canonical: '/developers' },
    openGraph: {
        title: 'Top Real Estate Developers in Bangalore | 27 Estates',
        description: 'Browse projects from Bangalore\'s top developers — Prestige, Sobha, Godrej, Brigade, Lodha.',
        url: `${SITE_URL}/developers`,
        type: 'website',
    },
};

export default function DevelopersIndexPage() {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Developers', url: '/developers' },
    ]);
    const itemList = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Top Real Estate Developers in Bangalore',
        numberOfItems: ALL_DEVELOPERS.length,
        itemListElement: ALL_DEVELOPERS.map((d, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/developers/${d.slug}`,
            name: d.name,
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
                        Top Real Estate Developers in Bangalore
                    </h1>
                    <p className="text-base text-gray-700 max-w-3xl leading-relaxed">
                        Browse projects from Bangalore&apos;s most established real estate developers. Each developer hub on 27 Estates lists active inventory, RERA status, and full project details.
                    </p>
                </header>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ALL_DEVELOPERS.map((d) => (
                            <li key={d.slug} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                                <Link href={`/developers/${d.slug}`} className="block">
                                    <div className="font-serif text-xl text-gray-900">{d.name}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {d.founded && <span>Since {d.founded}</span>}
                                        {d.headquarters && <span> · HQ: {d.headquarters}</span>}
                                    </div>
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
