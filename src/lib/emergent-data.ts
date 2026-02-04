// Mock data for Emergent dashboard - matching the original backend structure

export interface Property {
    id: string;
    propertyId: string;
    title: string;
    description: string;
    image: string;
    images: string[];
    price: number;
    pricePerSqft: number;
    location: string;
    address: {
        street: string;
        area: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lotSize: number;
    floors: number;
    propertyType: 'Sales' | 'Rent';
    category: string;
    isFeatured: boolean;
    agentId: string;
    amenities: {
        interior: string[];
        outdoor: string[];
        utilities: string[];
        other: string[];
    };
    videoUrl?: string;
    floorPlans?: {
        name: string;
        image: string;
    }[];
}

export interface Agent {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    image: string;
}

export interface Bookmark {
    id: string;
    propertyId: string;
}

// Helper function to format price in Indian Rupees
export function formatIndianRupee(amount: number): string {
    if (amount >= 10000000) {
        // Crores (1 Cr = 10,000,000)
        const crores = amount / 10000000;
        return `₹${crores.toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        // Lakhs (1 L = 100,000)
        const lakhs = amount / 100000;
        return `₹${lakhs.toFixed(2)} L`;
    } else {
        // Regular format with Indian number system
        return `₹${amount.toLocaleString('en-IN')}`;
    }
}

// Sample properties data
export const properties: Property[] = [
    {
        id: "1",
        propertyId: "PRO-001",
        title: "Suburb Home",
        description: "Located in a charming suburban neighborhood, this beautiful home offers modern comfort with traditional elegance. Features include a spacious living room, updated kitchen with granite countertops, and a master suite with walk-in closet. The backyard is perfect for entertaining with a covered patio and mature landscaping.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop"
        ],
        price: 230000,
        pricePerSqft: 100,
        location: "Pleasantville",
        address: {
            street: "123 Oak Avenue",
            area: "Green Valley",
            city: "Pleasantville",
            state: "New York",
            zip: "10570",
            country: "USA",
            coordinates: { lat: 41.1339, lng: -73.7915 }
        },
        rooms: 5,
        bedrooms: 3,
        bathrooms: 3,
        sqft: 2300,
        lotSize: 5000,
        floors: 2,
        propertyType: "Sales",
        category: "Duplex",
        isFeatured: true,
        agentId: "1",
        amenities: {
            interior: ["Central AC", "Fireplace", "Hardwood Floors", "Walk-in Closets"],
            outdoor: ["Garden", "Patio", "Garage", "Swimming Pool"],
            utilities: ["Gas", "Electric", "Water", "Sewer"],
            other: ["Security System", "Smart Home", "Pet Friendly"]
        },
        videoUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
        floorPlans: [
            { name: "Ground Floor", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=800&auto=format&fit=crop" },
            { name: "First Floor", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=800&auto=format&fit=crop" }
        ]
    },
    {
        id: "2",
        propertyId: "PRO-002",
        title: "Luxury House",
        description: "Nestled amidst serene woodlands, this luxury house gracefully sits atop a hill, offering breathtaking panoramic views. The architecture seamlessly blends contemporary design with natural elements, featuring floor-to-ceiling windows that flood the interior with natural light.",
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop"
        ],
        price: 294000,
        pricePerSqft: 86.47,
        location: "Catskills",
        address: {
            street: "456 Mountain View Road",
            area: "Hillside Estate",
            city: "Catskills",
            state: "New York",
            zip: "12414",
            country: "USA",
            coordinates: { lat: 42.1987, lng: -74.3195 }
        },
        rooms: 5,
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3400,
        lotSize: 8000,
        floors: 2,
        propertyType: "Sales",
        category: "House",
        isFeatured: true,
        agentId: "2",
        amenities: {
            interior: ["Home Theater", "Wine Cellar", "Sauna", "Marble Floors"],
            outdoor: ["Pool", "Tennis Court", "BBQ Area", "Landscaped Garden"],
            utilities: ["Solar Panels", "Generator", "Well Water"],
            other: ["Guest House", "Home Office", "Gym"]
        }
    },
    {
        id: "3",
        propertyId: "PRO-003",
        title: "Smart Home Duplex",
        description: "Situated in a bustling urban enclave, this smart home duplex elevates city living to new heights. Experience seamless automation with voice-controlled lighting, climate, and security systems. The open-concept design maximizes space while the rooftop terrace offers stunning skyline views.",
        image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&auto=format&fit=crop"
        ],
        price: 2300,
        pricePerSqft: 1.1,
        location: "Catskills",
        address: {
            street: "789 Tech Boulevard",
            area: "Innovation District",
            city: "Catskills",
            state: "New York",
            zip: "12414",
            country: "USA",
            coordinates: { lat: 42.2087, lng: -74.3295 }
        },
        rooms: 3,
        bedrooms: 2,
        bathrooms: 3,
        sqft: 2100,
        lotSize: 3000,
        floors: 2,
        propertyType: "Rent",
        category: "Duplex",
        isFeatured: true,
        agentId: "3",
        amenities: {
            interior: ["Smart Home System", "Built-in Speaker", "Modern Kitchen"],
            outdoor: ["Rooftop Terrace", "Balcony", "EV Charging"],
            utilities: ["Fiber Internet", "Smart Meter"],
            other: ["Concierge Service", "Bike Storage"]
        }
    },
    {
        id: "4",
        propertyId: "PRO-004",
        title: "Modern Apartment",
        description: "A sleek and stylish apartment in the heart of the city. Perfect for young professionals, this unit features modern finishes, an open kitchen with stainless steel appliances, and access to premium building amenities including a fitness center and rooftop lounge.",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop"
        ],
        price: 1800,
        pricePerSqft: 1.5,
        location: "West Side",
        address: {
            street: "101 Downtown Plaza",
            area: "Central Business District",
            city: "Manhattan",
            state: "New York",
            zip: "10001",
            country: "USA",
            coordinates: { lat: 40.7484, lng: -73.9967 }
        },
        rooms: 2,
        bedrooms: 1,
        bathrooms: 1,
        sqft: 1200,
        lotSize: 0,
        floors: 1,
        propertyType: "Rent",
        category: "Apartment",
        isFeatured: false,
        agentId: "1",
        amenities: {
            interior: ["Gym Access", "Rooftop Lounge", "Concierge"],
            outdoor: ["Balcony"],
            utilities: ["Central HVAC", "High-speed Internet"],
            other: ["Doorman", "Package Room", "Laundry Room"]
        }
    },
    {
        id: "5",
        propertyId: "PRO-005",
        title: "Premium Villa",
        description: "An exquisite villa offering unparalleled luxury and privacy. Set on a sprawling estate, this property features marble flooring, custom woodwork, a gourmet kitchen, and a private pool. The manicured gardens and outdoor entertaining areas make this the perfect retreat.",
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&auto=format&fit=crop"
        ],
        price: 850000,
        pricePerSqft: 154.55,
        location: "Capitol Hill",
        address: {
            street: "500 Elite Enclave",
            area: "Whitefield",
            city: "Capitol Hill",
            state: "Washington DC",
            zip: "20003",
            country: "USA",
            coordinates: { lat: 38.8899, lng: -76.9962 }
        },
        rooms: 6,
        bedrooms: 5,
        bathrooms: 5,
        sqft: 5500,
        lotSize: 15000,
        floors: 3,
        propertyType: "Sales",
        category: "House",
        isFeatured: true,
        agentId: "2",
        amenities: {
            interior: ["Private Pool", "Garden", "Home Office", "Guest House"],
            outdoor: ["Tennis Court", "Pool House", "Outdoor Kitchen"],
            utilities: ["Solar", "Backup Generator", "Water Softener"],
            other: ["Wine Cellar", "Home Theater", "Staff Quarters"]
        }
    },
    {
        id: "6",
        propertyId: "PRO-006",
        title: "Commercial Office Space",
        description: "Prime commercial office space in the heart of downtown. This modern building offers flexible floor plans, state-of-the-art facilities, and excellent accessibility. Ideal for businesses looking to establish a prestigious presence.",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
        images: [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop"
        ],
        price: 5000,
        pricePerSqft: 1.25,
        location: "Jersey City",
        address: {
            street: "200 Business Center",
            area: "Exchange Place",
            city: "Jersey City",
            state: "New Jersey",
            zip: "07302",
            country: "USA",
            coordinates: { lat: 40.7178, lng: -74.0431 }
        },
        rooms: 10,
        bedrooms: 0,
        bathrooms: 4,
        sqft: 4000,
        lotSize: 0,
        floors: 1,
        propertyType: "Rent",
        category: "Offices",
        isFeatured: false,
        agentId: "3",
        amenities: {
            interior: ["Conference Rooms", "Break Room", "Reception Area"],
            outdoor: ["Parking Garage"],
            utilities: ["Fiber Internet", "HVAC", "24/7 Security"],
            other: ["Elevator Access", "ADA Compliant", "Mail Room"]
        }
    }
];

// Sample agents data
export const agents: Agent[] = [
    {
        id: "1",
        name: "Sarah Johnson",
        role: "Senior Property Consultant",
        email: "sarah.johnson@27estates.com",
        phone: "+1 (555) 123-4567",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop"
    },
    {
        id: "2",
        name: "Michael Chen",
        role: "Luxury Properties Specialist",
        email: "michael.chen@27estates.com",
        phone: "+1 (555) 234-5678",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop"
    },
    {
        id: "3",
        name: "Emily Rodriguez",
        role: "Commercial Properties Expert",
        email: "emily.rodriguez@27estates.com",
        phone: "+1 (555) 345-6789",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop"
    }
];

// Local storage key for bookmarks
const BOOKMARKS_KEY = 'emergent_bookmarks';

// Helper functions (mimicking the API)
export function getAllProperties(): Property[] {
    return properties;
}

export function getFeaturedProperties(): Property[] {
    return properties.filter(p => p.isFeatured);
}

export function getPropertyById(id: string): Property | undefined {
    return properties.find(p => p.id === id);
}

export function searchProperties(query: string, category?: string, location?: string, featured?: boolean): Property[] {
    let result = [...properties];

    if (query) {
        const searchTerm = query.toLowerCase();
        result = result.filter(p =>
            p.title.toLowerCase().includes(searchTerm) ||
            p.location.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    if (category) {
        result = result.filter(p => p.category === category);
    }

    if (location) {
        result = result.filter(p => p.location === location);
    }

    if (featured) {
        result = result.filter(p => p.isFeatured);
    }

    return result;
}

export function getAgentById(id: string): Agent | undefined {
    return agents.find(a => a.id === id);
}

export function getAllAgents(): Agent[] {
    return agents;
}

// Bookmark functions using localStorage
export function getBookmarks(): Bookmark[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function addBookmark(propertyId: string): void {
    const bookmarks = getBookmarks();
    if (!bookmarks.some(b => b.propertyId === propertyId)) {
        bookmarks.push({ id: `bm-${Date.now()}`, propertyId });
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    }
}

export function removeBookmark(propertyId: string): void {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => b.propertyId !== propertyId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

export function isPropertyBookmarked(propertyId: string): boolean {
    return getBookmarks().some(b => b.propertyId === propertyId);
}
