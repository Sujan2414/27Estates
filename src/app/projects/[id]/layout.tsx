import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;

    const { data: project } = await supabase
        .from('projects')
        .select('project_name, description, images')
        .eq('id', resolvedParams.id)
        .single();

    if (!project) return {};

    const images = project.images || [];
    const mainImage = images.length > 0 ? images[0] : null;

    const previousImages = (await parent).openGraph?.images || [];

    const ogImages = mainImage
        ? [{ url: mainImage, width: 1200, height: 630, alt: project.project_name }]
        : previousImages;

    return {
        title: project.project_name,
        description: project.description,
        openGraph: {
            title: project.project_name,
            description: project.description,
            images: ogImages,
            type: 'website',
        }
    };
}

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}
