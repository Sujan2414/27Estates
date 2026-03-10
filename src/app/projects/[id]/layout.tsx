import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
    params: Promise<{ id: string }>
    children: React.ReactNode
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;

    const { data: project } = await supabase
        .from('projects')
        .select('project_name, description, images, location, city, category, min_price, max_price, developer_name')
        .eq('id', resolvedParams.id)
        .single();

    if (!project) return {};

    const images = project.images || [];
    const mainImage = images.length > 0 ? images[0] : null;

    const previousImages = (await parent).openGraph?.images || [];

    const ogImages = mainImage
        ? [{ url: mainImage, width: 1200, height: 630, alt: project.project_name }]
        : previousImages;

    const priceText = project.min_price && project.max_price
        ? `${project.min_price} - ${project.max_price}`
        : project.min_price || project.max_price || '';

    return {
        title: project.project_name,
        description: project.description || `${project.category} project by ${project.developer_name || '27 Estates'} in ${project.location || project.city || 'India'}. ${priceText ? `Price: ${priceText}.` : ''} Listed on 27 Estates.`,
        openGraph: {
            title: project.project_name,
            description: project.description,
            images: ogImages,
            type: 'website',
        }
    };
}

export default async function ProjectLayout({
    params,
    children,
}: Props) {
    const resolvedParams = await params;

    const { data: project } = await supabase
        .from('projects')
        .select('id, project_name, description, images, location, city, state, category, sub_category, min_price, max_price, developer_name, status, bhk_options, is_rera_approved, latitude, longitude, possession_date')
        .eq('id', resolvedParams.id)
        .single();

    // Build JSON-LD for RealEstateListing (AEO)
    const jsonLd = project ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": project.project_name,
        "description": project.description || `${project.category} project in ${project.location || project.city || 'India'}`,
        "url": `https://www.27estates.com/projects/${project.id}`,
        "image": project.images?.[0] || undefined,
        "datePosted": new Date().toISOString(),
        ...(project.min_price ? {
            "offers": {
                "@type": "AggregateOffer",
                "lowPrice": project.min_price,
                "highPrice": project.max_price || project.min_price,
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
            }
        } : {}),
        "address": {
            "@type": "PostalAddress",
            "addressLocality": project.location || project.city || undefined,
            "addressRegion": project.state || "Karnataka",
            "addressCountry": "IN",
        },
        ...(project.latitude && project.longitude ? {
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": project.latitude,
                "longitude": project.longitude,
            }
        } : {}),
        "additionalProperty": [
            { "@type": "PropertyValue", "name": "Category", "value": project.category },
            ...(project.sub_category ? [{ "@type": "PropertyValue", "name": "Sub Category", "value": project.sub_category }] : []),
            { "@type": "PropertyValue", "name": "Status", "value": project.status },
            ...(project.developer_name ? [{ "@type": "PropertyValue", "name": "Developer", "value": project.developer_name }] : []),
            ...(project.bhk_options?.length ? [{ "@type": "PropertyValue", "name": "BHK Options", "value": project.bhk_options.join(', ') }] : []),
            { "@type": "PropertyValue", "name": "RERA Approved", "value": project.is_rera_approved ? "Yes" : "No" },
            ...(project.possession_date ? [{ "@type": "PropertyValue", "name": "Possession Date", "value": project.possession_date }] : []),
        ],
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
