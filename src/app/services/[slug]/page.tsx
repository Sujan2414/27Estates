import { services } from "@/lib/services-data";
import ServiceDetailClient from "./ServiceDetailClient";

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

export default async function ServiceDetailPage({ params }: ServicePageProps) {
    const resolvedParams = await params;
    return <ServiceDetailClient slug={resolvedParams.slug} />;
}
