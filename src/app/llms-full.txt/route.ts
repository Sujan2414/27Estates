import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all properties
    const { data: properties } = await supabase
        .from('properties')
        .select('id, title, description, price, price_text, location, city, category, sub_category, bedrooms, bathrooms, sqft, property_type, furnishing, project_name')
        .order('created_at', { ascending: false })
        .limit(200);

    // Fetch all projects
    const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name, description, location, city, category, sub_category, developer_name, min_price, max_price, status, bhk_options, is_rera_approved, possession_date')
        .order('created_at', { ascending: false })
        .limit(200);

    const baseUrl = 'https://www.27estates.com';

    // Format price for display
    const formatPrice = (amount: number): string => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    let content = `# 27 Estates — Current Listings\n`;
    content += `> Last updated: ${new Date().toISOString()}\n`;
    content += `> Website: ${baseUrl}\n\n`;

    // Properties Section
    content += `## Properties for Sale & Rent (${properties?.length || 0} listings)\n\n`;

    if (properties && properties.length > 0) {
        for (const p of properties) {
            const priceDisplay = p.price_text || (p.price ? formatPrice(p.price) : 'Price on Request');
            content += `### ${p.title}\n`;
            content += `- **Type**: ${p.property_type} | **Category**: ${p.category}${p.sub_category ? ` (${p.sub_category})` : ''}\n`;
            content += `- **Price**: ${priceDisplay}${p.property_type === 'Rent' ? '/month' : ''}\n`;
            content += `- **Location**: ${p.location || ''}${p.city ? `, ${p.city}` : ''}\n`;
            if (p.bedrooms || p.bathrooms || p.sqft) {
                content += `- **Config**: ${p.bedrooms ? `${p.bedrooms} BHK` : ''}${p.bathrooms ? ` | ${p.bathrooms} Bath` : ''}${p.sqft ? ` | ${p.sqft} sqft` : ''}\n`;
            }
            if (p.furnishing) content += `- **Furnishing**: ${p.furnishing}\n`;
            if (p.project_name) content += `- **Project**: ${p.project_name}\n`;
            content += `- **View**: ${baseUrl}/properties/${p.id}\n\n`;
        }
    }

    // Projects Section
    content += `---\n\n## Projects & New Launches (${projects?.length || 0} listings)\n\n`;

    if (projects && projects.length > 0) {
        for (const pr of projects) {
            content += `### ${pr.project_name}\n`;
            content += `- **Category**: ${pr.category}${pr.sub_category ? ` (${pr.sub_category})` : ''}\n`;
            if (pr.developer_name) content += `- **Developer**: ${pr.developer_name}\n`;
            if (pr.min_price || pr.max_price) {
                const minP = pr.min_price ? formatPrice(pr.min_price) : '';
                const maxP = pr.max_price ? formatPrice(pr.max_price) : '';
                content += `- **Price Range**: ${minP}${minP && maxP ? ' — ' : ''}${maxP}\n`;
            }
            content += `- **Location**: ${pr.location || ''}${pr.city ? `, ${pr.city}` : ''}\n`;
            if (pr.status) content += `- **Status**: ${pr.status}\n`;
            if (pr.bhk_options?.length) content += `- **BHK Options**: ${pr.bhk_options.join(', ')}\n`;
            content += `- **RERA Approved**: ${pr.is_rera_approved ? 'Yes' : 'No'}\n`;
            if (pr.possession_date) content += `- **Possession**: ${pr.possession_date}\n`;
            if (pr.description) content += `- **About**: ${pr.description.substring(0, 200)}${pr.description.length > 200 ? '...' : ''}\n`;
            content += `- **View**: ${baseUrl}/projects/${pr.id}\n\n`;
        }
    }

    content += `---\n\n`;
    content += `For more details on any listing, visit the individual property/project page linked above.\n`;
    content += `Contact: connect@27estates.com | +91 8095799929\n`;

    return new Response(content, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Robots-Tag': 'index, follow',
        },
    });
}
