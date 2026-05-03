import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { projectUrl } from '@/lib/seo/urls';

type Props = {
    developerName?: string;
    area?: string;
    limit?: number;
};

type ProjectRow = {
    id: string;
    slug: string | null;
    project_name: string;
    location: string | null;
    developer_name: string | null;
};

export default async function RelatedProjects({ developerName, area, limit = 3 }: Props) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key);
    let q = supabase
        .from('projects')
        .select('id, slug, project_name, location, developer_name');
    if (developerName) q = q.eq('developer_name', developerName);
    if (area) q = q.ilike('location', `%${area}%`);
    const { data } = (await q.limit(limit)) as { data: ProjectRow[] | null };

    if (!data || data.length === 0) return null;

    return (
        <aside className="border-t mt-8 pt-6 max-w-3xl mx-auto px-4">
            <h3 className="font-serif text-xl text-gray-900 mb-4">Related Projects</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.map((p) => (
                    <li key={p.id} className="border rounded p-3 hover:shadow">
                        <Link href={projectUrl({ id: p.id, slug: p.slug })} className="block">
                            <div className="font-medium text-gray-900">{p.project_name}</div>
                            {p.developer_name && <div className="text-sm text-gray-600 mt-1">{p.developer_name}</div>}
                            {p.location && <div className="text-sm text-gray-500">{p.location}</div>}
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
