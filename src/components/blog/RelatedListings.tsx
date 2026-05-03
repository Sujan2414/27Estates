import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { propertyUrl } from '@/lib/seo/urls';

type Props = { area?: string; category?: string; limit?: number };

type PropertyRow = {
    id: string;
    slug: string | null;
    title: string;
    location: string | null;
    category: string | null;
};

export default async function RelatedListings({ area, category, limit = 3 }: Props) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key);
    let q = supabase
        .from('properties')
        .select('id, slug, title, location, category');
    if (area) q = q.ilike('location', `%${area}%`);
    if (category) q = q.eq('category', category);
    const { data } = (await q.limit(limit)) as { data: PropertyRow[] | null };

    if (!data || data.length === 0) return null;

    return (
        <aside className="border-t mt-8 pt-6 max-w-3xl mx-auto px-4">
            <h3 className="font-serif text-xl text-gray-900 mb-4">Featured Listings</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.map((p) => (
                    <li key={p.id} className="border rounded p-3 hover:shadow">
                        <Link href={propertyUrl({ id: p.id, slug: p.slug })} className="block">
                            <div className="font-medium text-gray-900">{p.title}</div>
                            {p.location && <div className="text-sm text-gray-600">{p.location}</div>}
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
