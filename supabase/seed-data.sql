-- =====================================================
-- 27 ESTATES - SEED DATA
-- Run this in Supabase SQL Editor after schema.sql
-- =====================================================

-- First, fix the RLS policy issue (drop first to avoid duplicate error)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;

CREATE POLICY "Enable read access for authenticated users" 
ON profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- =====================================================
-- INSERT AGENTS
-- =====================================================
INSERT INTO agents (id, name, email, phone, image, role, bio) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'Sarah Johnson',
    'sarah.johnson@27estates.com',
    '+1 (555) 123-4567',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop',
    'Senior Property Consultant',
    'With over 10 years of experience in real estate, Sarah specializes in luxury residential properties.'
),
(
    'a2222222-2222-2222-2222-222222222222',
    'Michael Chen',
    'michael.chen@27estates.com',
    '+1 (555) 234-5678',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop',
    'Luxury Properties Specialist',
    'Michael has closed over 200 high-end property deals and is known for his attention to detail.'
),
(
    'a3333333-3333-3333-3333-333333333333',
    'Emily Rodriguez',
    'emily.rodriguez@27estates.com',
    '+1 (555) 345-6789',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop',
    'Commercial Properties Expert',
    'Emily brings expertise in commercial real estate with a focus on office spaces and retail properties.'
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- INSERT PROPERTIES
-- =====================================================
INSERT INTO properties (
    property_id, title, description, price, price_per_sqft, location,
    address, bedrooms, bathrooms, sqft, lot_size, floors, rooms,
    property_type, category, is_featured, agent_id, images, amenities, video_url, floor_plans
) VALUES
(
    'PRO-001',
    'Suburb Home',
    'Located in a charming suburban neighborhood, this beautiful home offers modern comfort with traditional elegance. Features include a spacious living room, updated kitchen with granite countertops, and a master suite with walk-in closet. The backyard is perfect for entertaining with a covered patio and mature landscaping.',
    230000,
    100,
    'Pleasantville',
    '{"street": "123 Oak Avenue", "area": "Green Valley", "city": "Pleasantville", "state": "New York", "zip": "10570", "country": "USA", "coordinates": {"lat": 41.1339, "lng": -73.7915}}'::jsonb,
    3, 3, 2300, 5000, 2, 5,
    'Sales',
    'Duplex',
    true,
    'a1111111-1111-1111-1111-111111111111',
    ARRAY[
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop'
    ],
    '{"interior": ["Central AC", "Fireplace", "Hardwood Floors", "Walk-in Closets"], "outdoor": ["Garden", "Patio", "Garage", "Swimming Pool"], "utilities": ["Gas", "Electric", "Water", "Sewer"], "other": ["Security System", "Smart Home", "Pet Friendly"]}'::jsonb,
    'https://www.youtube.com/embed/ScMzIvxBSi4',
    '[{"name": "Ground Floor", "image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=800&auto=format&fit=crop"}, {"name": "First Floor", "image": "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?w=800&auto=format&fit=crop"}]'::jsonb
),
(
    'PRO-002',
    'Luxury House',
    'Nestled amidst serene woodlands, this luxury house gracefully sits atop a hill, offering breathtaking panoramic views. The architecture seamlessly blends contemporary design with natural elements, featuring floor-to-ceiling windows that flood the interior with natural light.',
    294000,
    86.47,
    'Catskills',
    '{"street": "456 Mountain View Road", "area": "Hillside Estate", "city": "Catskills", "state": "New York", "zip": "12414", "country": "USA", "coordinates": {"lat": 42.1987, "lng": -74.3195}}'::jsonb,
    4, 3, 3400, 8000, 2, 5,
    'Sales',
    'House',
    true,
    'a2222222-2222-2222-2222-222222222222',
    ARRAY[
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&auto=format&fit=crop'
    ],
    '{"interior": ["Home Theater", "Wine Cellar", "Sauna", "Marble Floors"], "outdoor": ["Pool", "Tennis Court", "BBQ Area", "Landscaped Garden"], "utilities": ["Solar Panels", "Generator", "Well Water"], "other": ["Guest House", "Home Office", "Gym"]}'::jsonb,
    NULL,
    NULL
),
(
    'PRO-003',
    'Smart Home Duplex',
    'Situated in a bustling urban enclave, this smart home duplex elevates city living to new heights. Experience seamless automation with voice-controlled lighting, climate, and security systems. The open-concept design maximizes space while the rooftop terrace offers stunning skyline views.',
    2300,
    1.1,
    'Catskills',
    '{"street": "789 Tech Boulevard", "area": "Innovation District", "city": "Catskills", "state": "New York", "zip": "12414", "country": "USA", "coordinates": {"lat": 42.2087, "lng": -74.3295}}'::jsonb,
    2, 3, 2100, 3000, 2, 3,
    'Rent',
    'Duplex',
    true,
    'a3333333-3333-3333-3333-333333333333',
    ARRAY[
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&auto=format&fit=crop'
    ],
    '{"interior": ["Smart Home System", "Built-in Speaker", "Modern Kitchen"], "outdoor": ["Rooftop Terrace", "Balcony", "EV Charging"], "utilities": ["Fiber Internet", "Smart Meter"], "other": ["Concierge Service", "Bike Storage"]}'::jsonb,
    NULL,
    NULL
),
(
    'PRO-004',
    'Modern Apartment',
    'A sleek and stylish apartment in the heart of the city. Perfect for young professionals, this unit features modern finishes, an open kitchen with stainless steel appliances, and access to premium building amenities including a fitness center and rooftop lounge.',
    1800,
    1.5,
    'West Side',
    '{"street": "101 Downtown Plaza", "area": "Central Business District", "city": "Manhattan", "state": "New York", "zip": "10001", "country": "USA", "coordinates": {"lat": 40.7484, "lng": -73.9967}}'::jsonb,
    1, 1, 1200, 0, 1, 2,
    'Rent',
    'Apartment',
    false,
    'a1111111-1111-1111-1111-111111111111',
    ARRAY[
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop'
    ],
    '{"interior": ["Gym Access", "Rooftop Lounge", "Concierge"], "outdoor": ["Balcony"], "utilities": ["Central HVAC", "High-speed Internet"], "other": ["Doorman", "Package Room", "Laundry Room"]}'::jsonb,
    NULL,
    NULL
),
(
    'PRO-005',
    'Premium Villa',
    'An exquisite villa offering unparalleled luxury and privacy. Set on a sprawling estate, this property features marble flooring, custom woodwork, a gourmet kitchen, and a private pool. The manicured gardens and outdoor entertaining areas make this the perfect retreat.',
    850000,
    154.55,
    'Capitol Hill',
    '{"street": "500 Elite Enclave", "area": "Whitefield", "city": "Capitol Hill", "state": "Washington DC", "zip": "20003", "country": "USA", "coordinates": {"lat": 38.8899, "lng": -76.9962}}'::jsonb,
    5, 5, 5500, 15000, 3, 6,
    'Sales',
    'Villa',
    true,
    'a2222222-2222-2222-2222-222222222222',
    ARRAY[
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&auto=format&fit=crop'
    ],
    '{"interior": ["Private Pool", "Garden", "Home Office", "Guest House"], "outdoor": ["Tennis Court", "Pool House", "Outdoor Kitchen"], "utilities": ["Solar", "Backup Generator", "Water Softener"], "other": ["Wine Cellar", "Home Theater", "Staff Quarters"]}'::jsonb,
    NULL,
    NULL
),
(
    'PRO-006',
    'Commercial Office Space',
    'Prime commercial office space in the heart of downtown. This modern building offers flexible floor plans, state-of-the-art facilities, and excellent accessibility. Ideal for businesses looking to establish a prestigious presence.',
    5000,
    1.25,
    'Jersey City',
    '{"street": "200 Business Center", "area": "Exchange Place", "city": "Jersey City", "state": "New Jersey", "zip": "07302", "country": "USA", "coordinates": {"lat": 40.7178, "lng": -74.0431}}'::jsonb,
    0, 4, 4000, 0, 1, 10,
    'Rent',
    'Commercial',
    false,
    'a3333333-3333-3333-3333-333333333333',
    ARRAY[
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop'
    ],
    '{"interior": ["Conference Rooms", "Break Room", "Reception Area"], "outdoor": ["Parking Garage"], "utilities": ["Fiber Internet", "HVAC", "24/7 Security"], "other": ["Elevator Access", "ADA Compliant", "Mail Room"]}'::jsonb,
    NULL,
    NULL
)
ON CONFLICT (property_id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Seed data inserted successfully! Properties: ' || 
       (SELECT COUNT(*) FROM properties) || 
       ', Agents: ' || 
       (SELECT COUNT(*) FROM agents) as message;
