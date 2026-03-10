import { createClient } from '@supabase/supabase-js';
import HomeClient from './HomeClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function HomePage() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch featured projects for SEO
    const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name, location, city, category, developer_name, min_price, max_price, bhk_options')
        .order('created_at', { ascending: false })
        .limit(20);

    // Fetch featured properties for SEO
    const { data: properties } = await supabase
        .from('properties')
        .select('id, title, location, city, category, price, price_text, bedrooms, sqft, property_type')
        .order('created_at', { ascending: false })
        .limit(20);

    // Format price
    const formatPrice = (amount: number): string => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <>
            {/* SEO content — hidden visually, readable by crawlers */}
            <article
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                aria-hidden="true"
            >
                <h1>27 Estates — Premium Real Estate in Bangalore, India</h1>
                <p>
                    27 Estates is a premium real estate advisory and brokerage firm in Bangalore, India.
                    We specialize in luxury apartments, villas, commercial office spaces, plots, and new project launches
                    across Bangalore, Pune, Hyderabad, and Mumbai.
                </p>

                {projects && projects.length > 0 && (
                    <div>
                        <h2>Featured Projects & New Launches</h2>
                        <ul>
                            {projects.map(p => (
                                <li key={p.id}>
                                    <a href={`/projects/${p.id}`}>
                                        {p.project_name} — {p.category} in {p.location || p.city}
                                        {p.developer_name ? ` by ${p.developer_name}` : ''}
                                        {p.min_price ? ` — Starting ${formatPrice(p.min_price)}` : ''}
                                        {p.bhk_options?.length ? ` — ${p.bhk_options.join(', ')}` : ''}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {properties && properties.length > 0 && (
                    <div>
                        <h2>Properties for Sale & Rent</h2>
                        <ul>
                            {properties.map(p => (
                                <li key={p.id}>
                                    <a href={`/properties/${p.id}`}>
                                        {p.title} — {p.category} for {p.property_type} in {p.location || p.city}
                                        {p.price ? ` — ${p.price_text || formatPrice(p.price)}` : ''}
                                        {p.bedrooms ? ` — ${p.bedrooms} BHK` : ''}
                                        {p.sqft ? ` — ${p.sqft} sqft` : ''}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <h2>Services</h2>
                <ul>
                    <li>Residential Real Estate — Luxury apartments, villas, penthouses, plots in Bangalore</li>
                    <li>Commercial Real Estate — Office spaces, retail shops, co-working spaces</li>
                    <li>Land Advisory — Agricultural land, industrial plots, development land</li>
                    <li>Project Marketing — New launch marketing for developers</li>
                    <li>Investment Advisory — Real estate investment consulting</li>
                </ul>

                <h2>Contact 27 Estates</h2>
                <p>Phone: +91 8095799929 | Email: connect@27estates.com</p>
                <p>Address: 83, Prestige Copper Arch, Infantry Road, Bangalore 560001, Karnataka, India</p>
            </article>

            {/* Interactive client homepage */}
            <HomeClient />
        </>
    );
}
