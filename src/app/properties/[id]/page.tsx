import PropertyDetailClient from './PropertyDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PropertyPage({ params }: Props) {
    // The visible H1 + property content is rendered by PropertyDetailClient.
    // Structured data (RealEstateListing, FAQPage, BreadcrumbList) is emitted
    // server-side from src/app/properties/[id]/layout.tsx, which also handles
    // slug-aware lookup.
    return <PropertyDetailClient params={params} />;
}
