import { permanentRedirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isUuid } from '@/lib/seo/urls';
import ProjectDetailClient from './ProjectDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
    const { id } = await params;

    // If the URL uses the legacy UUID handle, look up the slug and 308-redirect
    // to the canonical slug URL. 308 = permanent (SEO-equivalent to 301 for Google).
    // Slug URLs render directly without a round-trip.
    if (isUuid(id)) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data } = await supabase
            .from('projects')
            .select('slug')
            .eq('id', id)
            .single();
        if (data?.slug) {
            permanentRedirect(`/projects/${data.slug}`);
        }
    }

    // The visible H1 + project content is rendered by ProjectDetailClient.
    // Structured data (RealEstateListing, FAQPage, BreadcrumbList) is emitted
    // server-side from src/app/projects/[id]/layout.tsx.
    return <ProjectDetailClient params={params} />;
}
