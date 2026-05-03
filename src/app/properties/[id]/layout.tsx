import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import JsonLd from '@/components/seo/JsonLd';
import {
    buildRealEstateListingSchema,
    buildFaqSchema,
    buildBreadcrumbSchema,
} from '@/lib/seo/schema';
import { isUuid } from '@/lib/seo/urls';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Props = {
    params: Promise<{ id: string }>;
    children: React.ReactNode;
};

async function fetchProperty(handle: string, columns: string) {
    const query = supabase.from('properties').select(columns);
    return isUuid(handle)
        ? await query.eq('id', handle).single()
        : await query.eq('slug', handle).single();
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const { id } = await params;
    const { data: property } = await fetchProperty(
        id,
        'title, description, images, price, location, city, category, bedrooms, bathrooms, sqft, slug',
    ) as { data: {
        title: string;
        description: string | null;
        images: string[] | null;
        price: number | null;
        location: string | null;
        city: string | null;
        category: string | null;
        bedrooms: number | null;
        bathrooms: number | null;
        sqft: number | null;
        slug: string | null;
    } | null };

    if (!property) return {};

    const images = property.images || [];
    const mainImage = images.length > 0 ? images[0] : null;
    const previousImages = (await parent).openGraph?.images || [];
    const ogImages = mainImage
        ? [{ url: mainImage, width: 1200, height: 630, alt: property.title }]
        : previousImages;

    const canonicalHandle = property.slug || id;

    return {
        title: property.title,
        description:
            property.description ||
            `${property.category} property in ${property.location || property.city || 'India'} — ${property.bedrooms} BHK, ${property.sqft} sqft. Listed on 27 Estates.`,
        alternates: { canonical: `/properties/${canonicalHandle}` },
        openGraph: {
            title: property.title,
            description: property.description ?? undefined,
            images: ogImages,
            type: 'website',
        },
    };
}

type PropertyFaqInput = {
    title: string;
    location?: string | null;
    city?: string | null;
    category?: string | null;
    price?: number | null;
    bedrooms?: number | null;
    sqft?: number | null;
    property_type?: string | null;
};

function defaultPropertyFaqs(p: PropertyFaqInput) {
    const where = p.location || p.city || 'Bangalore';
    const listingType = p.property_type || 'Sale';
    return [
        {
            question: `Where is ${p.title} located?`,
            answer: `${p.title} is located in ${where}.`,
        },
        {
            question: `What type of property is ${p.title}?`,
            answer: p.category
                ? `${p.title} is a ${p.category} property listed for ${listingType.toLowerCase()}${p.bedrooms ? ` with ${p.bedrooms} bedrooms` : ''}${p.sqft ? `, ${p.sqft} sqft` : ''}.`
                : `Property type details are available on request.`,
        },
        {
            question: `What is the price of ${p.title}?`,
            answer: p.price
                ? `${p.title} is priced at ₹${p.price.toLocaleString('en-IN')}. Contact 27 Estates for current availability and exact pricing.`
                : `Pricing details for ${p.title} are available on request.`,
        },
        {
            question: `How can I schedule a site visit for ${p.title}?`,
            answer: `Contact 27 Estates at +91 80957 99929 or connect@27estates.com to schedule a site visit.`,
        },
    ];
}

export default async function PropertyLayout({ params, children }: Props) {
    const { id } = await params;
    const { data: property } = await fetchProperty(
        id,
        'id, slug, title, description, images, price, price_text, location, city, state, category, sub_category, bedrooms, bathrooms, sqft, property_type, latitude, longitude, status',
    ) as { data: {
        id: string;
        slug: string | null;
        title: string;
        description: string | null;
        images: string[] | null;
        price: number | null;
        price_text: string | null;
        location: string | null;
        city: string | null;
        state: string | null;
        category: string | null;
        sub_category: string | null;
        bedrooms: number | null;
        bathrooms: number | null;
        sqft: number | null;
        property_type: string | null;
        latitude: number | null;
        longitude: number | null;
        status: string | null;
    } | null };

    const listingSchema = property
        ? buildRealEstateListingSchema({
            id: property.id,
            slug: property.slug ?? undefined,
            name: property.title,
            description: property.description,
            imageUrl: property.images?.[0] ?? null,
            priceMin: property.price,
            priceMax: property.price,
            location: property.location,
            city: property.city,
            state: property.state,
            latitude: property.latitude,
            longitude: property.longitude,
            category: property.category,
            subCategory: property.sub_category,
            status: property.status,
            pathPrefix: 'properties',
        })
        : null;

    const faqSchema = property ? buildFaqSchema(defaultPropertyFaqs(property)) : null;
    const breadcrumbSchema = property
        ? buildBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Properties', url: '/properties' },
            { name: property.title, url: `/properties/${property.slug ?? property.id}` },
        ])
        : null;

    return (
        <>
            <JsonLd data={listingSchema} />
            <JsonLd data={faqSchema} />
            <JsonLd data={breadcrumbSchema} />
            {children}
        </>
    );
}
