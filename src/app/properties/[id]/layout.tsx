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

    const { data: property } = await supabase
        .from('properties')
        .select('title, description, images')
        .eq('id', resolvedParams.id)
        .single();

    if (!property) return {};

    const images = property.images || [];
    const mainImage = images.length > 0 ? images[0] : null;

    const previousImages = (await parent).openGraph?.images || [];

    const ogImages = mainImage
        ? [{ url: mainImage, width: 1200, height: 630, alt: property.title }]
        : previousImages;

    return {
        title: property.title,
        description: property.description,
        openGraph: {
            title: property.title,
            description: property.description,
            images: ogImages,
            type: 'website',
        }
    };
}

export default function PropertyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>;
}
