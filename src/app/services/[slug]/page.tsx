import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services-data";
import ServiceDetailClient from "./ServiceDetailClient";
import JsonLd from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";

const SITE_URL = "https://www.27estates.com";

interface ServicePageProps {
    params: Promise<{
        slug: string;
    }>;
}

export function generateStaticParams() {
    return services.map((service) => ({
        slug: service.slug,
    }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
    const { slug } = await params;
    const service = services.find((s) => s.slug === slug);
    if (!service) return {};
    return {
        title: `${service.title} | 27 Estates`,
        description: service.description,
        alternates: { canonical: `/services/${service.slug}` },
        openGraph: {
            title: `${service.title} | 27 Estates`,
            description: service.description,
            url: `${SITE_URL}/services/${service.slug}`,
            type: "website",
        },
    };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
    const { slug } = await params;
    const service = services.find((s) => s.slug === slug);
    if (!service) notFound();

    const breadcrumb = buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Services", url: "/services" },
        { name: service.title, url: `/services/${service.slug}` },
    ]);
    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.title,
        description: service.description,
        provider: {
            "@type": "RealEstateAgent",
            name: "27 Estates",
            url: SITE_URL,
        },
        areaServed: ["Bangalore", "Mumbai", "Pune", "Hyderabad"],
    };

    return (
        <>
            <JsonLd data={breadcrumb} />
            <JsonLd data={serviceSchema} />
            <ServiceDetailClient slug={slug} />
        </>
    );
}
