import type { Metadata } from 'next';

const SITE_URL = 'https://www.27estates.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    // Career detail is rendered by a 'use client' component that fetches from
    // Supabase at runtime. We don't have static access to the title here, so
    // we emit a generic but route-aware metadata block.
    return {
        title: 'Career Opening | 27 Estates',
        description: "Join 27 Estates — Bangalore's premium real estate advisory. View job description, apply online.",
        alternates: { canonical: `/careers/${id}` },
        openGraph: {
            title: 'Career Opening at 27 Estates',
            description: "Join 27 Estates — Bangalore's premium real estate advisory.",
            url: `${SITE_URL}/careers/${id}`,
            type: 'website',
        },
    };
}

export default function CareersDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
