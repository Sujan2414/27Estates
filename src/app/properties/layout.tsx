import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Sidebar from '@/components/emergent/Sidebar';
import MobileNav from '@/components/emergent/MobileNav';
import JsonLd from '@/components/seo/JsonLd';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { propertyUrl, projectUrl } from '@/lib/seo/urls';
import styles from '@/components/emergent/Dashboard.module.css';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'Premium Properties for Sale & Rent in Bangalore | 27 Estates Listings',
    description:
        "Browse 365+ premium projects and 50+ properties for sale and rent in Bangalore — luxury apartments, villas, plots, commercial space, and warehouses curated by 27 Estates.",
    keywords: [
        'properties for sale bangalore',
        'properties for rent bangalore',
        'luxury apartments bangalore',
        'commercial space bangalore',
        'real estate listings bangalore',
        '27 estates listings',
    ],
    alternates: { canonical: '/properties' },
    openGraph: {
        title: 'Premium Properties for Sale & Rent in Bangalore | 27 Estates',
        description:
            'Browse luxury apartments, villas, plots, commercial space, and warehouses for sale and rent in Bangalore on 27 Estates.',
        url: `${SITE_URL}/properties`,
        type: 'website',
    },
};

async function fetchTopListings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return { projects: [], properties: [] };
    const supabase = createClient(supabaseUrl, supabaseKey);
    const [{ data: projects }, { data: properties }] = await Promise.all([
        supabase
            .from('projects')
            .select('id, slug, project_name, location, city, min_price, images')
            .order('created_at', { ascending: false })
            .limit(8),
        supabase
            .from('properties')
            .select('id, slug, title, location, city, price, images')
            .order('created_at', { ascending: false })
            .limit(8),
    ]);
    return { projects: projects ?? [], properties: properties ?? [] };
}

type ProjectRow = {
    id: string;
    slug: string | null;
    project_name: string;
    location: string | null;
    city: string | null;
    min_price: number | null;
    images: string[] | null;
};
type PropertyRow = {
    id: string;
    slug: string | null;
    title: string;
    location: string | null;
    city: string | null;
    price: number | null;
    images: string[] | null;
};

function buildItemListSchema(projects: ProjectRow[], properties: PropertyRow[]) {
    const items = [
        ...projects.map((p, i) => ({
            '@type': 'ListItem' as const,
            position: i + 1,
            url: `${SITE_URL}${projectUrl({ id: p.id, slug: p.slug })}`,
            name: p.project_name,
            ...(p.images?.[0] ? { image: p.images[0] } : {}),
        })),
        ...properties.map((p, i) => ({
            '@type': 'ListItem' as const,
            position: projects.length + i + 1,
            url: `${SITE_URL}${propertyUrl({ id: p.id, slug: p.slug })}`,
            name: p.title,
            ...(p.images?.[0] ? { image: p.images[0] } : {}),
        })),
    ];
    if (!items.length) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Premium Properties and Projects in Bangalore',
        numberOfItems: items.length,
        itemListElement: items,
    };
}

export default async function PropertiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { projects, properties } = await fetchTopListings();
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Properties', url: '/properties' },
    ]);
    const itemList = buildItemListSchema(projects as ProjectRow[], properties as PropertyRow[]);

    return (
        <div className={styles.dashboardLayout} data-lenis-prevent>
            <JsonLd data={breadcrumb} />
            <JsonLd data={itemList} />
            <Sidebar />
            <div className={styles.mainContent}>
                {/* SEO heading — server-rendered, visible to crawlers and users */}
                <header className="px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                    <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-gray-900 leading-tight">
                        Premium Properties for Sale &amp; Rent in Bangalore
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
                        Curated luxury apartments, villas, plots, commercial space, and warehouses across Whitefield, Sarjapur Road, Koramangala, HSR Layout, and more — listed by 27 Estates, Bangalore&apos;s premium real estate advisory.
                    </p>
                </header>
                {children}
            </div>
            <MobileNav />
        </div>
    );
}
