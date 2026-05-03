import ProjectDetailClient from './ProjectDetailClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
    // The visible H1 + project content is rendered by ProjectDetailClient.
    // Structured data (RealEstateListing, FAQPage, BreadcrumbList) is emitted
    // server-side from src/app/projects/[id]/layout.tsx.
    return <ProjectDetailClient params={params} />;
}
