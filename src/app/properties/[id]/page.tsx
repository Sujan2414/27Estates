import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';

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

export default async function PropertyPage({ params }: Props) {
    const resolvedParams = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

    if (!property) {
        // Fallback: just render the client component (it does its own data fetch)
        return <PropertyDetailClient params={params} />;
    }

    const priceDisplay = property.price_text || (property.price ? formatPrice(property.price) : 'Price on Request');

    // Flatten amenities for SEO
    const amenityList: string[] = [];
    if (property.amenities) {
        const am = property.amenities as Record<string, string[]>;
        Object.values(am).forEach(arr => {
            if (Array.isArray(arr)) amenityList.push(...arr);
        });
    }

    return (
        <>
            {/* SEO-visible content for crawlers — hidden visually but readable by Google/AI */}
            <article
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
                aria-hidden="true"
            >
                <h1>{property.title}</h1>
                <p><strong>Price:</strong> {priceDisplay}{property.property_type === 'Rent' ? '/month' : ''}</p>
                <p><strong>Type:</strong> {property.property_type} | <strong>Category:</strong> {property.category}{property.sub_category ? ` — ${property.sub_category}` : ''}</p>
                <p><strong>Location:</strong> {property.location || ''}{property.city ? `, ${property.city}` : ''}{property.state ? `, ${property.state}` : ''}</p>
                {property.bedrooms > 0 && <p><strong>Bedrooms:</strong> {property.bedrooms}</p>}
                {property.bathrooms > 0 && <p><strong>Bathrooms:</strong> {property.bathrooms}</p>}
                {property.sqft > 0 && <p><strong>Area:</strong> {property.sqft} sqft</p>}
                {property.carpet_area && <p><strong>Carpet Area:</strong> {property.carpet_area} sqft</p>}
                {property.built_up_area && <p><strong>Built-up Area:</strong> {property.built_up_area} sqft</p>}
                {property.furnishing && <p><strong>Furnishing:</strong> {property.furnishing}</p>}
                {property.project_name && <p><strong>Project:</strong> {property.project_name}</p>}
                {property.description && (
                    <div>
                        <h2>Description</h2>
                        <p>{property.description}</p>
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
            <PropertyDetailClient params={params} />
        </>
    );
}
