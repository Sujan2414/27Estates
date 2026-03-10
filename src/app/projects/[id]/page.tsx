import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ProjectDetailClient from './ProjectDetailClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Format Indian Rupee for SEO content
function formatPrice(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
    const resolvedParams = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

    if (!project) {
        // Fallback: just render the client component (it does its own data fetch)
        return <ProjectDetailClient params={params} />;
    }

    const minPrice = project.min_price ? formatPrice(project.min_price) : '';
    const maxPrice = project.max_price ? formatPrice(project.max_price) : '';
    const priceRange = minPrice && maxPrice ? `${minPrice} — ${maxPrice}` : minPrice || maxPrice || 'Price on Request';

    // Flatten amenities for SEO
    const amenityList: string[] = [];
    if (project.amenities) {
        const am = project.amenities as Record<string, string[]>;
        Object.values(am).forEach(arr => {
            if (Array.isArray(arr)) amenityList.push(...arr);
        });
    }

    // Extract highlights
    const highlights = (project.highlights || []) as { icon?: string; label: string; value: string }[];

    return (
        <>
            {/* SEO-visible content for crawlers — hidden visually but readable by Google/AI */}
            <article
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                aria-hidden="true"
            >
                <h1>{project.project_name}</h1>
                <p><strong>Price Range:</strong> {priceRange}</p>
                <p><strong>Category:</strong> {project.category}{project.sub_category ? ` — ${project.sub_category}` : ''}</p>
                <p><strong>Location:</strong> {project.location || ''}{project.city ? `, ${project.city}` : ''}{project.state ? `, ${project.state}` : ''}</p>
                {project.developer_name && <p><strong>Developer:</strong> {project.developer_name}</p>}
                {project.status && <p><strong>Status:</strong> {project.status}</p>}
                {project.bhk_options?.length > 0 && <p><strong>BHK Options:</strong> {project.bhk_options.join(', ')}</p>}
                <p><strong>RERA Approved:</strong> {project.is_rera_approved ? 'Yes' : 'No'}</p>
                {project.possession_date && <p><strong>Possession Date:</strong> {project.possession_date}</p>}
                {project.total_units && <p><strong>Total Units:</strong> {project.total_units}</p>}
                {project.total_towers && <p><strong>Total Towers:</strong> {project.total_towers}</p>}
                {project.total_floors && <p><strong>Total Floors:</strong> {project.total_floors}</p>}
                {project.specifications && (
                    <div>
                        <h2>Specifications</h2>
                        <p>{project.specifications}</p>
                    </div>
                )}
                {project.description && (
                    <div>
                        <h2>About {project.project_name}</h2>
                        <p>{project.description}</p>
                    </div>
                )}
                {highlights.length > 0 && (
                    <div>
                        <h2>Key Highlights</h2>
                        <ul>
                            {highlights.map((h, i) => <li key={i}>{h.label}: {h.value}</li>)}
                        </ul>
                    </div>
                )}
                {amenityList.length > 0 && (
                    <div>
                        <h2>Amenities</h2>
                        <ul>
                            {amenityList.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    </div>
                )}
            </article>

            {/* Interactive client component */}
            <ProjectDetailClient params={params} />
        </>
    );
}
