import { permanentRedirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isUuid } from '@/lib/seo/urls';
import PropertyDetailClient from './PropertyDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: Props) {
    const { id } = await params;

    // If the URL uses the legacy UUID handle, look up the slug and 308-redirect
    // to the canonical slug URL. 308 = permanent (SEO-equivalent to 301 for Google).
    if (isUuid(id)) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data } = await supabase
            .from('properties')
            .select('slug')
            .eq('id', id)
            .single();
        if (data?.slug) {
            permanentRedirect(`/properties/${data.slug}`);
        }
    }

    // The visible H1 + property content is rendered by PropertyDetailClient.
    // Structured data (RealEstateListing, FAQPage, BreadcrumbList) is emitted
    // server-side from src/app/properties/[id]/layout.tsx, which also handles
    // slug-aware lookup.
    return <PropertyDetailClient params={params} />;
}
