import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import {
    buildBreadcrumbSchema,
    buildOrganizationSchema,
    buildPersonSchema,
} from '@/lib/seo/schema';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'About 27 Estates | Premium Real Estate Advisory in Bangalore',
    description:
        "Founded in Bangalore, 27 Estates is a premium real estate advisory specialising in luxury apartments, villas, plots, and new project launches across India's prime markets — Bangalore, Mumbai, Pune, Hyderabad.",
    alternates: { canonical: '/about' },
    openGraph: {
        title: 'About 27 Estates | Premium Real Estate Advisory in Bangalore',
        description:
            "27 Estates — Bangalore's premium real estate advisory specialising in luxury properties across India.",
        url: `${SITE_URL}/about`,
        type: 'website',
    },
};

export default function AboutPage() {
    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'About', url: '/about' },
    ]);
    const orgSchema = buildOrganizationSchema();
    // Founder Person schema — name, role, bio populated by team. Schema is
    // emitted with placeholder values that are still factually correct
    // (worksFor + jobTitle). Update bio + image + linkedin when content team
    // provides them.
    const founderSchema = buildPersonSchema({
        name: 'The 27 Estates Founder',
        jobTitle: 'Founder & CEO',
        worksFor: '27 Estates',
    });

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={orgSchema} />
            <JsonLd data={founderSchema} />
            <Navigation />
            <main className="min-h-screen bg-white pt-24 pb-12">
                <header className="container mx-auto max-w-4xl px-4 py-8">
                    <h1 className="font-serif text-4xl md:text-5xl text-gray-900 mb-4">
                        About 27 Estates
                    </h1>
                    <p className="text-lg text-gray-700 leading-relaxed">
                        27 Estates is a premium real estate advisory and brokerage firm headquartered at Infantry Road, Bangalore. We specialise in luxury apartments, villas, plots, commercial spaces, and new project launches across Bangalore, Mumbai, Pune, and Hyderabad.
                    </p>
                </header>

                <section className="container mx-auto max-w-4xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Our Approach</h2>
                    <p className="text-gray-700 leading-relaxed">
                        We work as an independent advisory — not a developer&apos;s sales arm. Every recommendation is grounded in first-hand market knowledge, RERA-verified data, and a deep understanding of the buyer&apos;s long-term goals. Our advisors have facilitated transactions across some of Bangalore&apos;s most prestigious projects from Prestige Group, Sobha, Godrej Properties, Brigade Group, and Lodha.
                    </p>
                </section>

                <section className="container mx-auto max-w-4xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Cities We Serve</h2>
                    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-700">
                        <li className="border rounded p-3">Bangalore (HQ)</li>
                        <li className="border rounded p-3">Mumbai</li>
                        <li className="border rounded p-3">Pune</li>
                        <li className="border rounded p-3">Hyderabad</li>
                    </ul>
                </section>

                <section className="container mx-auto max-w-4xl px-4 py-6">
                    <h2 className="font-serif text-2xl text-gray-900 mb-4">Get in Touch</h2>
                    <ul className="text-gray-700 space-y-2">
                        <li>📍 83, Prestige Copper Arch, Infantry Road, Bangalore 560001, Karnataka</li>
                        <li>📞 +91 80957 99929</li>
                        <li>✉️ connect@27estates.com</li>
                    </ul>
                    <div className="mt-6">
                        <Link
                            href="/contact"
                            className="inline-block px-6 py-3 bg-[#183C38] text-white rounded-md hover:bg-[#112a27] transition-colors"
                        >
                            Schedule a Consultation
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
