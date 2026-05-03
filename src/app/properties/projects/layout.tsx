import type { Metadata } from 'next';

const SITE_URL = 'https://www.27estates.com';

export const metadata: Metadata = {
    title: 'New Project Launches in Bangalore | Pre-Launch & Under-Construction | 27 Estates',
    description:
        "Browse new project launches, pre-launches, and under-construction premium real estate projects in Bangalore from Prestige, Sobha, Godrej, Brigade, Lodha, and more.",
    keywords: [
        'new project launches bangalore',
        'pre launch projects bangalore',
        'under construction projects bangalore',
        'upcoming residential projects bangalore',
        'new luxury projects bangalore',
    ],
    alternates: { canonical: '/properties/projects' },
    openGraph: {
        title: 'New Project Launches in Bangalore | 27 Estates',
        description:
            'Pre-launch and under-construction premium real estate projects in Bangalore from top developers. Browse on 27 Estates.',
        url: `${SITE_URL}/properties/projects`,
        type: 'website',
    },
};

export default function PropertiesProjectsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
