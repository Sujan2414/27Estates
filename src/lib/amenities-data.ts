/**
 * Master amenities list — single source of truth for admin wizards and detail pages.
 * Each amenity has a label, a Lucide icon name, and a category for grouping.
 */

export interface AmenityItem {
    label: string;
    icon: string; // Lucide icon name
    category: AmenityCategory;
}

export type AmenityCategory =
    | 'Fitness & Recreation'
    | 'Swimming & Water'
    | 'Sports'
    | 'Clubhouse & Community'
    | 'Children'
    | 'Outdoor & Landscape'
    | 'Security & Safety'
    | 'Parking & Transport'
    | 'Lifestyle & Wellness'
    | 'Utilities & Services'
    | 'Smart & Tech'
    | 'Commercial & Work';

export const AMENITY_CATEGORIES: AmenityCategory[] = [
    'Fitness & Recreation',
    'Swimming & Water',
    'Sports',
    'Clubhouse & Community',
    'Children',
    'Outdoor & Landscape',
    'Security & Safety',
    'Parking & Transport',
    'Lifestyle & Wellness',
    'Utilities & Services',
    'Smart & Tech',
    'Commercial & Work',
];

export const MASTER_AMENITIES: AmenityItem[] = [
    // Fitness & Recreation
    { label: 'Gymnasium', icon: 'Dumbbell', category: 'Fitness & Recreation' },
    { label: 'Yoga Deck', icon: 'Flower2', category: 'Fitness & Recreation' },
    { label: 'Aerobics Room', icon: 'HeartPulse', category: 'Fitness & Recreation' },
    { label: 'Jogging Track', icon: 'Footprints', category: 'Fitness & Recreation' },
    { label: 'Cycling Track', icon: 'Bike', category: 'Fitness & Recreation' },
    { label: 'Meditation Zone', icon: 'Brain', category: 'Fitness & Recreation' },
    { label: 'Spa & Sauna', icon: 'Sparkles', category: 'Fitness & Recreation' },
    { label: 'Steam Room', icon: 'CloudFog', category: 'Fitness & Recreation' },
    { label: 'Indoor Games Room', icon: 'Gamepad2', category: 'Fitness & Recreation' },
    { label: 'Billiards Room', icon: 'Circle', category: 'Fitness & Recreation' },
    { label: 'Table Tennis', icon: 'TableProperties', category: 'Fitness & Recreation' },

    // Swimming & Water
    { label: 'Swimming Pool', icon: 'Waves', category: 'Swimming & Water' },
    { label: 'Kids Pool', icon: 'Baby', category: 'Swimming & Water' },
    { label: 'Infinity Pool', icon: 'Infinity', category: 'Swimming & Water' },
    { label: 'Jacuzzi', icon: 'Bath', category: 'Swimming & Water' },
    { label: 'Rain Dance Area', icon: 'CloudRain', category: 'Swimming & Water' },
    { label: 'Water Features', icon: 'Droplets', category: 'Swimming & Water' },

    // Sports
    { label: 'Tennis Court', icon: 'CircleDot', category: 'Sports' },
    { label: 'Badminton Court', icon: 'Volleyball', category: 'Sports' },
    { label: 'Basketball Court', icon: 'Trophy', category: 'Sports' },
    { label: 'Squash Court', icon: 'Square', category: 'Sports' },
    { label: 'Cricket Pitch', icon: 'Swords', category: 'Sports' },
    { label: 'Football Turf', icon: 'Goal', category: 'Sports' },
    { label: 'Volleyball Court', icon: 'Volleyball', category: 'Sports' },
    { label: 'Skating Rink', icon: 'Wind', category: 'Sports' },
    { label: 'Golf Putting Green', icon: 'Flag', category: 'Sports' },
    { label: 'Archery Range', icon: 'Target', category: 'Sports' },
    { label: 'Multi-Purpose Court', icon: 'LayoutGrid', category: 'Sports' },

    // Clubhouse & Community
    { label: 'Clubhouse', icon: 'Building', category: 'Clubhouse & Community' },
    { label: 'Banquet Hall', icon: 'UtensilsCrossed', category: 'Clubhouse & Community' },
    { label: 'Party Hall', icon: 'PartyPopper', category: 'Clubhouse & Community' },
    { label: 'Community Hall', icon: 'Users', category: 'Clubhouse & Community' },
    { label: 'Library / Reading Room', icon: 'BookOpen', category: 'Clubhouse & Community' },
    { label: 'Mini Theatre', icon: 'Clapperboard', category: 'Clubhouse & Community' },
    { label: 'Cafeteria', icon: 'Coffee', category: 'Clubhouse & Community' },
    { label: 'Restaurant', icon: 'Utensils', category: 'Clubhouse & Community' },
    { label: 'Lounge Area', icon: 'Sofa', category: 'Clubhouse & Community' },
    { label: 'Guest Rooms', icon: 'BedDouble', category: 'Clubhouse & Community' },
    { label: 'Co-Working Space', icon: 'Laptop', category: 'Clubhouse & Community' },
    { label: 'Business Centre', icon: 'Briefcase', category: 'Clubhouse & Community' },
    { label: 'Conference Room', icon: 'Presentation', category: 'Clubhouse & Community' },

    // Children
    { label: "Children's Play Area", icon: 'Baby', category: 'Children' },
    { label: 'Kids Pool', icon: 'Waves', category: 'Children' },
    { label: 'Creche / Day Care', icon: 'School', category: 'Children' },
    { label: 'Toy Library', icon: 'ToyBrick', category: 'Children' },
    { label: 'Adventure Zone', icon: 'Mountain', category: 'Children' },
    { label: 'Sandbox Area', icon: 'Castle', category: 'Children' },
    { label: 'Trampoline Park', icon: 'ArrowUpFromLine', category: 'Children' },

    // Outdoor & Landscape
    { label: 'Landscaped Gardens', icon: 'TreePine', category: 'Outdoor & Landscape' },
    { label: 'Rooftop Garden', icon: 'Flower2', category: 'Outdoor & Landscape' },
    { label: 'Central Park', icon: 'Trees', category: 'Outdoor & Landscape' },
    { label: 'Walking Trails', icon: 'Footprints', category: 'Outdoor & Landscape' },
    { label: 'Sit-Out Areas', icon: 'Armchair', category: 'Outdoor & Landscape' },
    { label: 'Gazebo', icon: 'Tent', category: 'Outdoor & Landscape' },
    { label: 'Amphitheatre', icon: 'Theater', category: 'Outdoor & Landscape' },
    { label: 'BBQ Area', icon: 'Flame', category: 'Outdoor & Landscape' },
    { label: 'Terrace Lounge', icon: 'Sun', category: 'Outdoor & Landscape' },
    { label: 'Outdoor Gym', icon: 'Dumbbell', category: 'Outdoor & Landscape' },
    { label: 'Pet Park', icon: 'Dog', category: 'Outdoor & Landscape' },
    { label: 'Butterfly Garden', icon: 'Bug', category: 'Outdoor & Landscape' },
    { label: 'Herb Garden', icon: 'Leaf', category: 'Outdoor & Landscape' },
    { label: 'Fountain / Water Body', icon: 'Droplets', category: 'Outdoor & Landscape' },

    // Security & Safety
    { label: '24/7 Security', icon: 'ShieldCheck', category: 'Security & Safety' },
    { label: 'CCTV Surveillance', icon: 'Camera', category: 'Security & Safety' },
    { label: 'Gated Community', icon: 'DoorClosed', category: 'Security & Safety' },
    { label: 'Boom Barrier', icon: 'Fence', category: 'Security & Safety' },
    { label: 'Intercom System', icon: 'PhoneCall', category: 'Security & Safety' },
    { label: 'Video Door Phone', icon: 'Video', category: 'Security & Safety' },
    { label: 'Fire Safety System', icon: 'Flame', category: 'Security & Safety' },
    { label: 'Earthquake Resistant', icon: 'Shield', category: 'Security & Safety' },
    { label: 'Access Card Entry', icon: 'CreditCard', category: 'Security & Safety' },
    { label: 'Visitor Management', icon: 'UserCheck', category: 'Security & Safety' },

    // Parking & Transport
    { label: 'Covered Parking', icon: 'CarFront', category: 'Parking & Transport' },
    { label: 'Multi-Level Parking', icon: 'ParkingSquare', category: 'Parking & Transport' },
    { label: 'Visitor Parking', icon: 'Car', category: 'Parking & Transport' },
    { label: 'EV Charging Station', icon: 'Plug', category: 'Parking & Transport' },
    { label: 'Bicycle Parking', icon: 'Bike', category: 'Parking & Transport' },
    { label: 'Shuttle Service', icon: 'Bus', category: 'Parking & Transport' },

    // Lifestyle & Wellness
    { label: 'Salon / Spa', icon: 'Scissors', category: 'Lifestyle & Wellness' },
    { label: 'Shopping Arcade', icon: 'ShoppingBag', category: 'Lifestyle & Wellness' },
    { label: 'Convenience Store', icon: 'Store', category: 'Lifestyle & Wellness' },
    { label: 'Pharmacy', icon: 'Pill', category: 'Lifestyle & Wellness' },
    { label: 'ATM', icon: 'Wallet', category: 'Lifestyle & Wellness' },
    { label: 'Medical Centre', icon: 'Stethoscope', category: 'Lifestyle & Wellness' },
    { label: 'Temple / Prayer Room', icon: 'Church', category: 'Lifestyle & Wellness' },
    { label: 'Laundry Service', icon: 'Shirt', category: 'Lifestyle & Wellness' },
    { label: 'Concierge Service', icon: 'Bell', category: 'Lifestyle & Wellness' },
    { label: 'Art Gallery', icon: 'Palette', category: 'Lifestyle & Wellness' },
    { label: 'Music Room', icon: 'Music', category: 'Lifestyle & Wellness' },

    // Utilities & Services
    { label: 'Power Backup', icon: 'Zap', category: 'Utilities & Services' },
    { label: 'Water Treatment Plant', icon: 'Droplet', category: 'Utilities & Services' },
    { label: 'Sewage Treatment Plant', icon: 'Pipette', category: 'Utilities & Services' },
    { label: 'Rainwater Harvesting', icon: 'CloudRain', category: 'Utilities & Services' },
    { label: 'Solar Panels', icon: 'Sun', category: 'Utilities & Services' },
    { label: 'Gas Pipeline', icon: 'Flame', category: 'Utilities & Services' },
    { label: 'Piped Gas', icon: 'Cylinder', category: 'Utilities & Services' },
    { label: 'Waste Management', icon: 'Trash2', category: 'Utilities & Services' },
    { label: 'High-Speed Lifts', icon: 'ArrowUpDown', category: 'Utilities & Services' },
    { label: 'Service Lift', icon: 'Package', category: 'Utilities & Services' },
    { label: 'Maintenance Staff', icon: 'Wrench', category: 'Utilities & Services' },

    // Smart & Tech
    { label: 'Smart Home Automation', icon: 'Smartphone', category: 'Smart & Tech' },
    { label: 'High-Speed Internet', icon: 'Wifi', category: 'Smart & Tech' },
    { label: 'DTH / Cable TV', icon: 'Tv', category: 'Smart & Tech' },
    { label: 'App-Based Management', icon: 'AppWindow', category: 'Smart & Tech' },
    { label: 'Digital Lock System', icon: 'Lock', category: 'Smart & Tech' },
    { label: 'Smart Metering', icon: 'Gauge', category: 'Smart & Tech' },

    // Commercial & Work
    { label: 'Reception / Lobby', icon: 'Building2', category: 'Commercial & Work' },
    { label: 'Waiting Lounge', icon: 'Sofa', category: 'Commercial & Work' },
    { label: 'Food Court', icon: 'UtensilsCrossed', category: 'Commercial & Work' },
    { label: 'Central AC', icon: 'AirVent', category: 'Commercial & Work' },
    { label: 'Modular Kitchen', icon: 'ChefHat', category: 'Commercial & Work' },
    { label: 'Servant Quarter', icon: 'DoorOpen', category: 'Commercial & Work' },
    { label: 'Study Room', icon: 'GraduationCap', category: 'Commercial & Work' },
    { label: 'Walk-In Closet', icon: 'Warehouse', category: 'Commercial & Work' },
    { label: 'Balcony / Deck', icon: 'Fence', category: 'Commercial & Work' },
    { label: 'Vastu Compliant', icon: 'Compass', category: 'Commercial & Work' },
];

/**
 * Lookup map: amenity label -> icon name (for fast access on detail pages).
 */
export const AMENITY_ICON_MAP: Record<string, string> = Object.fromEntries(
    MASTER_AMENITIES.map((a) => [a.label, a.icon])
);

/**
 * Grouped amenities by category (for admin dropdown UI).
 */
export const AMENITIES_BY_CATEGORY: Record<AmenityCategory, AmenityItem[]> = AMENITY_CATEGORIES.reduce(
    (acc, cat) => {
        acc[cat] = MASTER_AMENITIES.filter((a) => a.category === cat);
        return acc;
    },
    {} as Record<AmenityCategory, AmenityItem[]>
);

/**
 * Flatten old categorized format { clubhouse: [...], outdoor: [...] } to a flat string[].
 */
export function flattenAmenities(amenities: unknown): string[] {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities.filter((a) => typeof a === 'string' && a.trim());
    if (typeof amenities === 'object') {
        const flat: string[] = [];
        for (const values of Object.values(amenities as Record<string, unknown>)) {
            if (Array.isArray(values)) {
                for (const v of values) {
                    if (typeof v === 'string' && v.trim()) flat.push(v.trim());
                }
            }
        }
        return flat;
    }
    return [];
}
