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

async function fetchProject(handle: string, columns: string) {
    const query = supabase.from('projects').select(columns);
    return isUuid(handle)
        ? await query.eq('id', handle).single()
        : await query.eq('slug', handle).single();
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const { id } = await params;
    const { data: project } = await fetchProject(
        id,
        'project_name, description, images, location, city, category, min_price, max_price, developer_name, slug',
    ) as { data: {
        project_name: string;
        description: string | null;
        images: string[] | null;
        location: string | null;
        city: string | null;
        category: string | null;
        min_price: number | null;
        max_price: number | null;
        developer_name: string | null;
        slug: string | null;
    } | null };
    if (!project) return {};

    const images = project.images || [];
    const mainImage = images.length > 0 ? images[0] : null;
    const previousImages = (await parent).openGraph?.images || [];
    const ogImages = mainImage
        ? [{ url: mainImage, width: 1200, height: 630, alt: project.project_name }]
        : previousImages;

    const priceText =
        project.min_price && project.max_price
            ? `${project.min_price} - ${project.max_price}`
            : project.min_price || project.max_price || '';

    const canonicalHandle = project.slug || id;

    return {
        title: project.project_name,
        description:
            project.description ||
            `${project.category} project by ${project.developer_name || '27 Estates'} in ${project.location || project.city || 'India'}. ${priceText ? `Price: ${priceText}.` : ''} Listed on 27 Estates.`,
        alternates: { canonical: `/projects/${canonicalHandle}` },
        openGraph: {
            title: project.project_name,
            description: project.description ?? undefined,
            images: ogImages,
            type: 'website',
        },
    };
}

type ProjectFaqInput = {
    project_name: string;
    developer_name?: string | null;
    location?: string | null;
    city?: string | null;
    is_rera_approved?: boolean | null;
    possession_date?: string | null;
    min_price?: number | null;
    max_price?: number | null;
};

function defaultProjectFaqs(project: ProjectFaqInput) {
    const where = project.location || project.city || 'Bangalore';
    const price =
        project.min_price && project.max_price
            ? `between ₹${project.min_price.toLocaleString('en-IN')} and ₹${project.max_price.toLocaleString('en-IN')}`
            : 'available on request';
    return [
        {
            question: `Where is ${project.project_name} located?`,
            answer: `${project.project_name} is located in ${where}.`,
        },
        {
            question: `Who is the developer of ${project.project_name}?`,
            answer: project.developer_name
                ? `${project.project_name} is developed by ${project.developer_name}.`
                : `Developer details for ${project.project_name} are available on request.`,
        },
        {
            question: `Is ${project.project_name} RERA approved?`,
            answer:
                project.is_rera_approved === true
                    ? `Yes, ${project.project_name} is RERA approved.`
                    : project.is_rera_approved === false
                        ? `RERA approval status for ${project.project_name} is pending or unavailable.`
                        : `RERA approval information is available on request.`,
        },
        {
            question: `What is the price of ${project.project_name}?`,
            answer: `Prices at ${project.project_name} are ${price}. Contact 27 Estates for current availability and exact pricing.`,
        },
        {
            question: `When is the possession date of ${project.project_name}?`,
            answer: project.possession_date
                ? `Possession at ${project.project_name} is scheduled for ${project.possession_date}.`
                : `Possession date for ${project.project_name} is available on request.`,
        },
    ];
}

export default async function ProjectLayout({ params, children }: Props) {
    const { id } = await params;
    const { data: project } = await fetchProject(
        id,
        'id, slug, project_name, description, images, location, city, state, category, sub_category, min_price, max_price, developer_name, status, bhk_options, is_rera_approved, latitude, longitude, possession_date',
    ) as { data: {
        id: string;
        slug: string | null;
        project_name: string;
        description: string | null;
        images: string[] | null;
        location: string | null;
        city: string | null;
        state: string | null;
        category: string | null;
        sub_category: string | null;
        min_price: number | null;
        max_price: number | null;
        developer_name: string | null;
        status: string | null;
        bhk_options: string[] | null;
        is_rera_approved: boolean | null;
        latitude: number | null;
        longitude: number | null;
        possession_date: string | null;
    } | null };

    const listingSchema = project
        ? buildRealEstateListingSchema({
            id: project.id,
            slug: project.slug ?? undefined,
            name: project.project_name,
            description: project.description,
            imageUrl: project.images?.[0] ?? null,
            priceMin: project.min_price,
            priceMax: project.max_price,
            location: project.location,
            city: project.city,
            state: project.state,
            latitude: project.latitude,
            longitude: project.longitude,
            category: project.category,
            subCategory: project.sub_category,
            status: project.status,
            developerName: project.developer_name,
            bhkOptions: project.bhk_options,
            isReraApproved: project.is_rera_approved,
            possessionDate: project.possession_date,
            pathPrefix: 'projects',
        })
        : null;

    const faqSchema = project ? buildFaqSchema(defaultProjectFaqs(project)) : null;
    const breadcrumbSchema = project
        ? buildBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Projects', url: '/properties/projects' },
            { name: project.project_name, url: `/projects/${project.slug ?? project.id}` },
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
