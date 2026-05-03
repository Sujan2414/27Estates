import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getAreaBySlug, getAllAreaSlugs } from '@/data/areas';
import { projectUrl } from '@/lib/seo/urls';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export async function generateStaticParams() {
    return getAllAreaSlugs().map((slug) => ({ slug }));
}

type ProjectRow = {
    id: string;
    slug: string | null;
    project_name: string;
    location: string | null;
    city: string | null;
    min_price: number | null;
    images: string[] | null;
    developer_name: string | null;
    status: string | null;
};

async function fetchProjectsForArea(area: { name: string; topProjectKeywords?: string[] }): Promise<ProjectRow[]> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    const supabase = createClient(url, key);
    const keywords = area.topProjectKeywords ?? [area.name];
    const filterParts = keywords.flatMap((kw) => [
        `location.ilike.%${kw}%`,
        `city.ilike.%${kw}%`,
    ]);
    const { data } = await supabase
        .from('projects')
        .select('id, slug, project_name, location, city, min_price, images, developer_name, status')
        .or(filterParts.join(','))
        .order('created_at', { ascending: false })
        .limit(12);
    return (data ?? []) as ProjectRow[];
}

function formatPrice(amount: number | null): string {
    if (!amount) return 'Price on Request';
    if (amount >= 10000000) return `From ₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `From ₹${(amount / 100000).toFixed(2)} L`;
    return `From ₹${amount.toLocaleString('en-IN')}`;
}

export default async function AreaPage({ params }: Props) {
    const { slug } = await params;
    const area = getAreaBySlug(slug);
    if (!area) notFound();

    const projects = await fetchProjectsForArea(area);

    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-white pt-24 pb-12">
                <header className="container mx-auto max-w-5xl px-4 py-8">
                    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
                        <ol className="flex flex-wrap gap-1">
                            <li><Link href="/" className="hover:underline">Home</Link></li>
                            <li>/</li>
                            <li><Link href="/areas" className="hover:underline">Areas</Link></li>
                            <li>/</li>
                            <li className="text-gray-900 font-medium" aria-current="page">{area.name}</li>
                        </ol>
                    </nav>
                    <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight">
                        Luxury Real Estate in {area.name}, {area.city}
                    </h1>
                    {area.priceRangePerSqft && (
                        <p className="mt-3 text-sm text-gray-600">
                            Premium projects: ₹{area.priceRangePerSqft.min.toLocaleString('en-IN')} – ₹{area.priceRangePerSqft.max.toLocaleString('en-IN')} per sqft
                        </p>
                    )}
                    <p className="mt-4 text-base text-gray-700 max-w-3xl leading-relaxed">{area.intro}</p>
                </header>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Top Projects in {area.name}</h2>
                    {projects.length > 0 ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((p) => (
                                <li key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <Link href={projectUrl({ id: p.id, slug: p.slug })} className="block">
                                        <div className="font-medium text-gray-900">{p.project_name}</div>
                                        {p.developer_name && <div className="text-sm text-gray-600 mt-1">by {p.developer_name}</div>}
                                        {p.location && <div className="text-sm text-gray-500 mt-1">{p.location}</div>}
                                        <div className="text-sm font-medium text-gray-900 mt-2">{formatPrice(p.min_price)}</div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No active projects currently listed in {area.name}. Check back soon or browse all <Link href="/properties" className="text-[#183C38] hover:underline">premium properties</Link>.</p>
                    )}
                </section>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-3">Infrastructure &amp; Connectivity</h2>
                    <p className="text-gray-700 max-w-3xl leading-relaxed">{area.infrastructure}</p>
                </section>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-3">Investment Outlook</h2>
                    <p className="text-gray-700 max-w-3xl leading-relaxed">{area.investmentOutlook}</p>
                </section>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Frequently Asked Questions</h2>
                    <dl className="max-w-3xl space-y-5">
                        {area.faqs.map((f, i) => (
                            <div key={i}>
                                <dt className="font-medium text-gray-900">{f.question}</dt>
                                <dd className="text-gray-700 mt-1 leading-relaxed">{f.answer}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <div className="border rounded-lg p-6 bg-gray-50">
                        <h3 className="font-serif text-xl text-gray-900 mb-2">Looking for a specific property in {area.name}?</h3>
                        <p className="text-gray-700 mb-4">Speak with a 27 Estates advisor for off-market and pre-launch opportunities.</p>
                        <Link href="/contact" className="inline-block px-5 py-2 bg-[#183C38] text-white rounded-md hover:bg-[#112a27] transition-colors">
                            Schedule a Consultation
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
