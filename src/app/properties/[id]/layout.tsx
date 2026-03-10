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

    const { data: property } = await supabase
        .from('properties')
        .select('title, description, images, price, location, city, category, bedrooms, bathrooms, sqft')
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
        description: property.description || `${property.category} property in ${property.location || property.city || 'India'} — ${property.bedrooms} BHK, ${property.sqft} sqft. Listed on 27 Estates.`,
        openGraph: {
            title: property.title,
            description: property.description,
            images: ogImages,
            type: 'website',
        }
    };
}

export default async function PropertyLayout({
    params,
    children,
}: Props) {
    const resolvedParams = await params;

    const { data: property } = await supabase
        .from('properties')
        .select('id, title, description, images, price, price_text, location, city, state, category, sub_category, bedrooms, bathrooms, sqft, property_type, latitude, longitude')
        .eq('id', resolvedParams.id)
        .single();

    // Build JSON-LD for RealEstateListing (AEO)
    const jsonLd = property ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": property.title,
        "description": property.description || `${property.category} property in ${property.location || property.city || 'India'}`,
        "url": `https://www.27estates.com/properties/${property.id}`,
        "image": property.images?.[0] || undefined,
        "datePosted": new Date().toISOString(),
        "offers": {
            "@type": "Offer",
            "price": property.price || undefined,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
        },
        "address": {
            "@type": "PostalAddress",
            "addressLocality": property.location || property.city || undefined,
            "addressRegion": property.state || "Karnataka",
            "addressCountry": "IN",
        },
        ...(property.latitude && property.longitude ? {
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": property.latitude,
                "longitude": property.longitude,
            }
        } : {}),
        "additionalProperty": [
            { "@type": "PropertyValue", "name": "Category", "value": property.category },
            ...(property.sub_category ? [{ "@type": "PropertyValue", "name": "Sub Category", "value": property.sub_category }] : []),
            { "@type": "PropertyValue", "name": "Bedrooms", "value": property.bedrooms },
            { "@type": "PropertyValue", "name": "Bathrooms", "value": property.bathrooms },
            { "@type": "PropertyValue", "name": "Area (sqft)", "value": property.sqft },
            { "@type": "PropertyValue", "name": "Listing Type", "value": property.property_type },
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
