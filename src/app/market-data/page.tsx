import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { BANGALORE_PRICE_TRENDS, MARKET_HIGHLIGHTS } from '@/data/market-data';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: `Bangalore Real Estate Market Data ${MARKET_HIGHLIGHTS.asOfQuarter} | Price Trends by Area | 27 Estates`,
    description: `Latest Bangalore real estate price trends ${MARKET_HIGHLIGHTS.asOfQuarter} — ₹/sqft, YoY change, and rental yield by area. Whitefield, Sarjapur, Koramangala, HSR, and more, updated quarterly by 27 Estates.`,
    keywords: [
        'bangalore real estate prices',
        'bangalore property price trends',
        'real estate market data bangalore',
        'whitefield property prices',
        'sarjapur property prices',
        'koramangala property prices',
        'bangalore rental yield',
        'bangalore property appreciation',
    ],
    alternates: { canonical: '/market-data' },
    openGraph: {
        title: `Bangalore Real Estate Market Data ${MARKET_HIGHLIGHTS.asOfQuarter} | 27 Estates`,
        description: `Latest Bangalore property price trends and rental yields by area, ${MARKET_HIGHLIGHTS.asOfQuarter}.`,
        url: `${SITE_URL}/market-data`,
        type: 'website',
    },
    // noindex until team validates the placeholder numbers against internal
    // CRM / RERA / CREDAI data. Flip to follow:true and remove robots block
    // when content team approves.
    robots: { index: false, follow: true },
};

export default function MarketDataPage() {
    const breadcrumb = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Market Data', url: '/market-data' },
    ]);
    const article = buildArticleSchema({
        title: `Bangalore Real Estate Market Data — ${MARKET_HIGHLIGHTS.asOfQuarter}`,
        description: `Quarterly price-trend report for Bangalore micromarkets, ${MARKET_HIGHLIGHTS.asOfQuarter}.`,
        url: '/market-data',
        datePublished: BANGALORE_PRICE_TRENDS[0]?.asOf,
        dateModified: BANGALORE_PRICE_TRENDS[0]?.asOf,
    });
    const dataset = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: `Bangalore Real Estate Price Trends — ${MARKET_HIGHLIGHTS.asOfQuarter}`,
        description: 'Average ₹/sqft, year-over-year change, and gross rental yield by Bangalore micromarket.',
        url: `${SITE_URL}/market-data`,
        creator: { '@type': 'Organization', name: '27 Estates' },
        temporalCoverage: BANGALORE_PRICE_TRENDS[0]?.asOf,
        spatialCoverage: { '@type': 'Place', name: 'Bangalore, Karnataka, India' },
        license: 'https://www.27estates.com/terms',
        keywords: ['real estate', 'bangalore', 'property prices', 'rental yield', 'micromarket'],
    };

    return (
        <>
            <JsonLd data={breadcrumb} />
            <JsonLd data={article} />
            <JsonLd data={dataset} />
            <Navigation />
            <main className="min-h-screen bg-white pt-24 pb-12">
                <header className="container mx-auto max-w-5xl px-4 py-8">
                    <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-2">
                        Bangalore Real Estate Market Data
                    </h1>
                    <p className="text-sm text-gray-500">{MARKET_HIGHLIGHTS.asOfQuarter} · Updated quarterly · Source: 27 Estates</p>
                    <p className="text-base text-gray-700 mt-4 max-w-3xl leading-relaxed">
                        Quarterly snapshot of Bangalore&apos;s premium real estate micromarkets — average price per sqft, year-over-year movement, and gross rental yields. Numbers are aggregated from RERA filings, internal transaction data, and listing-market scans.
                    </p>
                </header>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">City Average YoY</div>
                            <div className="text-2xl font-semibold text-gray-900 mt-1">+{MARKET_HIGHLIGHTS.cityAverageYoY}%</div>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Highest Appreciation</div>
                            <div className="text-2xl font-semibold text-gray-900 mt-1">{MARKET_HIGHLIGHTS.bestPerformingArea}</div>
                        </div>
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Best Rental Yield</div>
                            <div className="text-2xl font-semibold text-gray-900 mt-1">{MARKET_HIGHLIGHTS.bestRentalYieldArea}</div>
                        </div>
                    </div>
                </section>

                <section className="container mx-auto max-w-5xl px-4 py-6 overflow-x-auto">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Price Trends by Area</h2>
                    <table className="min-w-full text-left border-collapse">
                        <thead className="border-b-2 border-gray-200">
                            <tr className="text-sm text-gray-600">
                                <th className="py-3 pr-4 font-medium">Area</th>
                                <th className="py-3 pr-4 font-medium">₹ / sqft (range)</th>
                                <th className="py-3 pr-4 font-medium">YoY Change</th>
                                <th className="py-3 pr-4 font-medium">Rental Yield</th>
                                <th className="py-3 pr-4 font-medium">Typical Segment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BANGALORE_PRICE_TRENDS.map((row) => (
                                <tr key={row.area} className="border-b border-gray-100 text-sm">
                                    <td className="py-3 pr-4 font-medium text-gray-900">{row.area}</td>
                                    <td className="py-3 pr-4 text-gray-700">
                                        ₹{row.pricePerSqftMin.toLocaleString('en-IN')} – ₹{row.pricePerSqftMax.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`py-3 pr-4 font-medium ${row.yoyChangePct > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {row.yoyChangePct > 0 ? '+' : ''}{row.yoyChangePct}%
                                    </td>
                                    <td className="py-3 pr-4 text-gray-700">{row.rentalYieldPct}%</td>
                                    <td className="py-3 text-gray-600">{row.typicalSegment}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-4 max-w-2xl">
                        Source: 27 Estates internal CRM data + RERA Karnataka filings + CREDAI Bangalore quarterly report. Figures are indicative ranges for premium projects within each micromarket and may vary by configuration, builder, and project status.
                    </p>
                </section>

                <section className="container mx-auto max-w-5xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Methodology</h2>
                    <ul className="text-gray-700 space-y-2 list-disc pl-5">
                        <li>Price per sqft ranges reflect new-launch and resale premium projects within each micromarket.</li>
                        <li>YoY change compares Q1 2026 average prices vs Q1 2025 average prices using transaction data and active-listing benchmarks.</li>
                        <li>Rental yield = annualised gross rent / capital value, before maintenance and taxes.</li>
                        <li>Numbers exclude budget housing (&lt; ₹4,500 / sqft) which would skew the premium-segment averages.</li>
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}
