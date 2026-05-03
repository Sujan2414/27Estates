import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/emergent/ProjectCard';
import PropertyCard from '@/components/emergent/PropertyCard';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { projectUrl, propertyUrl } from '@/lib/seo/urls';
import { Building2, Home } from 'lucide-react';
import Head from 'next/head';

const SITE_URL = 'https://www.27estates.com';

// --- Type Definitions ---
type Props = {
    params: Promise<{ city: string; category: string }>;
};

// --- Helpers to map URL slugs to DB formats ---
function formatCityLabel(citySlug: string) {
    return citySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function mapCategorySlugToDB(categorySlug: string) {
    const map: Record<string, { dbCategory: string; type: 'projects' | 'properties' | 'both' }> = {
        'residential': { dbCategory: 'Residential', type: 'both' },
        'commercial': { dbCategory: 'Commercial', type: 'both' },
        'office-spaces': { dbCategory: 'Office Space', type: 'properties' },
        'apartments': { dbCategory: 'Apartment', type: 'properties' },
        'villas': { dbCategory: 'Villa', type: 'both' },
        'plots': { dbCategory: 'Plot', type: 'both' },
        'retail': { dbCategory: 'Retail', type: 'properties' },
        'warehouses': { dbCategory: 'Warehouse', type: 'properties' },
        'penthouses': { dbCategory: 'Penthouse', type: 'properties' },
    };
    return map[categorySlug.toLowerCase()] || null;
}

function formatCategoryLabel(categorySlug: string) {
    const mapping = mapCategorySlugToDB(categorySlug);
    if (mapping) return mapping.dbCategory + (categorySlug.endsWith('s') && mapping.dbCategory !== 'Commercial' && mapping.dbCategory !== 'Residential' ? 's' : '');
    return categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// --- Metadata Generation ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city, category } = await params;
    const cityLabel = formatCityLabel(city);
    const catLabel = formatCategoryLabel(category);
    const title = `${catLabel} in ${cityLabel} | 27 Estates`;
    const description = `Explore premium ${catLabel.toLowerCase()} in ${cityLabel}. Find your perfect property with 27 Estates, luxury real estate advisors in ${cityLabel}.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://www.27estates.com/${city}/${category}`,
        },
    };
}

// --- Main Server Component ---
export default async function TopLevelCityCategoryPage({ params }: Props) {
    const { city, category } = await params;
    const cityLabel = formatCityLabel(city);
    const mapping = mapCategorySlugToDB(category);
    const dbCategory = mapping?.dbCategory || formatCategoryLabel(category);

    // Initialize Supabase (Server Component needs URL and Key explicitly or use standard client creation)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Using fetch directly or supabase-js to ensure SSR data fetching
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    let projects: any[] = [];
    let properties: any[] = [];

    // Fetch dependent on type
    if (mapping?.type !== 'properties') {
        const { data: projData } = await supabase
            .from('projects')
            .select('*')
            .ilike('city', `%${cityLabel}%`)
            .eq('category', dbCategory)
            .eq('status', 'Available')
            .order('created_at', { ascending: false })
            .limit(20);
        if (projData) projects = projData;
    }

    if (mapping?.type !== 'projects') {
        const { data: propData } = await supabase
            .from('properties')
            .select('*')
            .ilike('city', `%${cityLabel}%`)
            .eq('category', dbCategory)
            .in('visibility', ['Public', 'Protected'])
            .eq('status', 'Available')
            .order('created_at', { ascending: false })
            .limit(20);
        if (propData) properties = propData;
    }

    // Determine H1
    const h1Title = `Premium ${formatCategoryLabel(category)} in ${cityLabel}`;

    const faqSchema = buildFaqSchema([
        {
            question: `What are the best ${dbCategory.toLowerCase()}s in ${cityLabel}?`,
            answer: `27 Estates offers a curated selection of premium ${dbCategory.toLowerCase()}s in ${cityLabel}. Browse our extensive catalog of verified, RERA-compliant properties above.`,
        },
        {
            question: `How can I buy or rent a ${dbCategory.toLowerCase()} in ${cityLabel}?`,
            answer: `Contact 27 Estates at connect@27estates.com or +91 80957 99929. Our expert advisors will guide you through the process of securing a ${dbCategory.toLowerCase()} in ${cityLabel}.`,
        },
        {
            question: `What is the average price of a ${dbCategory.toLowerCase()} in ${cityLabel}?`,
            answer: `Prices vary by location, size, and amenities. ${cityLabel} offers ${dbCategory.toLowerCase()}s across a wide price range — contact 27 Estates for a personalised price report based on your budget and preferred micromarket.`,
        },
        {
            question: `Are the ${dbCategory.toLowerCase()}s on 27 Estates RERA approved?`,
            answer: `27 Estates lists only verified projects. RERA approval status is shown on each project page. We prioritise RERA-compliant ${dbCategory.toLowerCase()}s for buyer protection.`,
        },
        {
            question: `How do I schedule a site visit for a ${dbCategory.toLowerCase()} in ${cityLabel}?`,
            answer: `Click on any listing to view details, then use the "Schedule Site Visit" or WhatsApp button. Our advisors will arrange a guided tour at your convenience.`,
        },
    ]);

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: cityLabel, url: `/${city}` },
        { name: formatCategoryLabel(category), url: `/${city}/${category}` },
    ]);

    type ListingItem = { id: string; slug?: string | null; name: string; image?: string };
    const projectItems: ListingItem[] = projects.map((p) => ({
        id: p.id,
        slug: (p as { slug?: string | null }).slug ?? null,
        name: p.project_name,
        image: p.images?.[0],
    }));
    const propertyItems: ListingItem[] = properties.map((p) => ({
        id: p.id,
        slug: (p as { slug?: string | null }).slug ?? null,
        name: p.title,
        image: p.images?.[0],
    }));

    const itemListSchema = (projectItems.length || propertyItems.length)
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${formatCategoryLabel(category)} in ${cityLabel}`,
            numberOfItems: projectItems.length + propertyItems.length,
            itemListElement: [
                ...projectItems.map((p, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: `${SITE_URL}${projectUrl({ id: p.id, slug: p.slug })}`,
                    name: p.name,
                    ...(p.image ? { image: p.image } : {}),
                })),
                ...propertyItems.map((p, i) => ({
                    '@type': 'ListItem',
                    position: projectItems.length + i + 1,
                    url: `${SITE_URL}${propertyUrl({ id: p.id, slug: p.slug })}`,
                    name: p.name,
                    ...(p.image ? { image: p.image } : {}),
                })),
            ],
        }
        : null;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <JsonLd data={faqSchema} />
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={itemListSchema} />

            <Navigation />

            <main className="flex-grow pt-24 pb-12">
                {/* Hero Section */}
                <div className="bg-[#183C38] text-white py-16 px-4">
                    <div className="container mx-auto max-w-7xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{h1Title}</h1>
                        <p className="text-lg md:text-xl opacity-90 max-w-3xl">
                            Discover the finest {dbCategory.toLowerCase()}s in the heart of {cityLabel}.
                            Whether you're looking for luxury, convenience, or pure investment value,
                            27 Estates brings you exclusive listings tailored specifically for the {cityLabel} market.
                        </p>
                    </div>
                </div>

                {/* Listings Section */}
                <div className="container mx-auto max-w-7xl px-4 py-12">

                    {projects.length === 0 && properties.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No active listings right now</h2>
                            <p className="text-gray-500">We are currently updating our inventory for {formatCategoryLabel(category)} in {cityLabel}.</p>
                            <a href="/" className="inline-block mt-6 px-6 py-2 bg-[#183C38] text-white rounded-md hover:bg-[#112a27] transition-colors">
                                Browse All Offerings
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-16">

                            {/* New Projects */}
                            {projects.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                                        <Building2 className="text-[#BFA270]" size={28} />
                                        <h2 className="text-3xl font-bold text-gray-900">New {formatCategoryLabel(category)} Projects in {cityLabel}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {projects.map(p => (
                                            <ProjectCard
                                                key={p.id}
                                                id={p.id}
                                                slug={(p as { slug?: string | null }).slug ?? null}
                                                project_name={p.project_name}
                                                location={p.location || ''}
                                                city={p.city}
                                                min_price={p.min_price}
                                                max_price={p.max_price}
                                                bhk_options={p.bhk_options}
                                                image={p.images?.[0] || ''}
                                                status={p.status || 'Upcoming'}
                                                developer_name={p.developer_name}
                                                is_rera_approved={p.is_rera_approved}
                                                category={p.category}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Ready Properties */}
                            {properties.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                                        <Home className="text-[#183C38]" size={28} />
                                        <h2 className="text-3xl font-bold text-gray-900">{formatCategoryLabel(category)} Properties in {cityLabel}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {properties.map(p => (
                                            <PropertyCard
                                                key={p.id}
                                                property={p}
                                                isBookmarked={false}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>

                {/* SEO Text Footer Content */}
                <div className="container mx-auto max-w-4xl px-4 py-12 mt-8 border-t border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Why invest in {formatCategoryLabel(category)} in {cityLabel}?</h2>
                    <div className="prose text-gray-600">
                        <p className="mb-4">
                            {cityLabel} continues to be one of the most dynamic real estate markets in India.
                            The demand for {dbCategory.toLowerCase()}s has seen consistent growth driven by
                            infrastructure development, rising corporate footprint, and an expanding premium buyer segment.
                        </p>
                        <p className="mb-4">
                            At 27 Estates, we understand that finding the perfect {dbCategory.toLowerCase()} requires
                            deep local expertise and access to exclusive inventory. Our curated selection of properties in {cityLabel}
                            undergoes rigorous verification for quality, legal compliance (including RERA where applicable), and long-term value appreciation.
                        </p>
                        <p>
                            Whether you are a seasoned investor or a first-time buyer, our advisory team brings
                            unmatched transparency and dedication to your real estate journey. Explore our listings above
                            or contact our experts for a personalized property consultation.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
