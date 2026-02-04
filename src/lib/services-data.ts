export interface Service {
    id: string;
    title: string;
    description: string;
    slug: string;
    image: string;
    heroTitle: string;
    heroImage: string;
    heroCta: string;
    serviceList: string[];
    insights: string[];
    ctaTitle: string;
}

export const services: Service[] = [
    {
        id: "corporate",
        title: "Corporate Real Estate",
        description: "Unlock premium office spaces for GCCs and MNCs.",
        slug: "corporate-real-estate",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Unlock premium office spaces for GCCs and MNCs",
        heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070",
        heroCta: "Get Quote",
        serviceList: [
            "Tenant representation and lease structuring",
            "Renewal negotiations and rent reviews",
            "Flexible workspaces and portfolio optimization"
        ],
        insights: [
            "50+ GCC setups yearly",
            "Client logos: Zepto, Beckn"
        ],
        ctaTitle: "Read More"
    },
    {
        id: "residential",
        title: "Residential Real Estate",
        description: "Primary sales, resales, and management representing luxury homes.",
        slug: "residential-real-estate",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Primary sales, resales, and management",
        heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2053",
        heroCta: "Submit Requirements",
        serviceList: [
            "Buying/renting advisory",
            "Property management",
            "Investment analysis for homes"
        ],
        insights: [
            "Market trends (Bangalore prices)",
            "Sample listings teaser"
        ],
        ctaTitle: "Submit Requirements"
    },
    {
        id: "warehousing",
        title: "Warehousing & Logistics",
        description: "Strategic logistics hubs and industrial park solutions.",
        slug: "warehousing-logistics",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Strategic logistics hubs",
        heroImage: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2070",
        heroCta: "Search Warehouses",
        serviceList: [
            "Landlord/tenant representation",
            "Technical due diligence",
            "Lease renewals for industrial parks"
        ],
        insights: [
            "Demand drivers (e-commerce)",
            "Heat map of Bangalore zones"
        ],
        ctaTitle: "Custom Search"
    },
    {
        id: "land",
        title: "Land & Industrial",
        description: "Land acquisition, JV structuring, and industrial advisory.",
        slug: "land-industrial",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Land acquisition and JV structuring",
        heroImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2013",
        heroCta: "Land Query",
        serviceList: [
            "Industrial land purchase/disposal",
            "Operator search and build-to-suit",
            "Advisory for factories/zones"
        ],
        insights: [
            "Pro-business policy highlights",
            "Project timelines"
        ],
        ctaTitle: "Land Query"
    },
    {
        id: "hospitality",
        title: "Hospitality & Retail",
        description: "Hotels, malls, and pop-ups with retail footage.",
        slug: "hospitality-retail",
        image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1200",
        heroTitle: "Hotels, malls, and pop-ups",
        heroImage: "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&q=80&w=2076",
        heroCta: "Explore Spaces",
        serviceList: [
            "High-street leasing",
            "Retail design/build",
            "Hospitality venue advisory"
        ],
        insights: [
            "Pop-up success stories (e.g., FIMER India office)"
        ],
        ctaTitle: "Explore Spaces"
    }
];
