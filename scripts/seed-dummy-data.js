const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

console.log(`Using ${env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon'} key`);
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── PROJECTS DATA ────────────────────────────────────────────────

const projects = [
    // ── RESIDENTIAL (5) ──
    {
        project_id: 'PRJ-001',
        project_name: 'Sobha Athena',
        title: 'Sobha Athena - Premium Living',
        description: 'Sobha Athena is a premium residential development in Whitefield, Bangalore, offering world-class amenities and modern architecture. Designed for discerning homebuyers who value quality craftsmanship and elegant living spaces.',
        rera_number: 'PRM/KA/RERA/1251/2025/A12345',
        developer_name: 'Sobha Limited',
        status: 'Under Construction',
        category: 'Residential',
        sub_category: 'Apartment',
        total_units: 450,
        min_price: '₹1.2 Cr', max_price: '₹2.8 Cr',
        min_price_numeric: 12000000, max_price_numeric: 28000000,
        price_per_sqft: 9500,
        min_area: 1250, max_area: 2800,
        property_type: 'Sale', bhk_options: ['2 BHK', '3 BHK', '4 BHK'],
        transaction_type: 'New',
        launch_date: 'January 2025', possession_date: 'December 2027',
        address: 'ITPL Main Road', location: 'Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066', country: 'India',
        latitude: 12.9716, longitude: 77.7501,
        images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: true, is_rera_approved: true,
        show_ad_on_home: true,
        ad_card_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        employee_name: 'Rajesh Kumar', employee_phone: '+91 98765 43210', employee_email: 'rajesh@21estates.com',
        amenities: ['Gymnasium', 'Swimming Pool', 'Clubhouse', 'Jogging Track', '24/7 Security', 'Power Backup', 'Car Parking', 'Landscaped Garden', 'Yoga Deck', 'Children\'s Play Area', 'Indoor Games', 'Party Hall', 'Amphitheatre', 'Cycling Track'],
        towers_data: [
            { name: 'Tower A - Zenith', total_floors: 28, total_units: 150, completion_date: 'June 2027', status: 'Under Construction' },
            { name: 'Tower B - Apex', total_floors: 32, total_units: 160, completion_date: 'December 2027', status: 'Under Construction' },
            { name: 'Tower C - Summit', total_floors: 25, total_units: 140, completion_date: 'March 2028', status: 'Under Construction' },
        ],
        project_plan: [
            { type: 'Apartment', bhk: '2 BHK', area: '1,250 sq.ft', price_rate: '₹9,500/sq.ft', basic_price: '₹1.19 Cr', completion_date: 'June 2027' },
            { type: 'Apartment', bhk: '3 BHK', area: '1,850 sq.ft', price_rate: '₹9,500/sq.ft', basic_price: '₹1.76 Cr', completion_date: 'December 2027' },
            { type: 'Penthouse', bhk: '4 BHK', area: '2,800 sq.ft', price_rate: '₹10,000/sq.ft', basic_price: '₹2.80 Cr', completion_date: 'March 2028' },
        ],
        floor_plans: [
            { name: '2 BHK Type A', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80', bhk: '2 BHK', area: '1,250 sq.ft' },
            { name: '3 BHK Type B', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80', bhk: '3 BHK', area: '1,850 sq.ft' },
        ],
        connectivity: [
            { type: 'Metro', name: 'Whitefield Metro Station', distance: '2 km' },
            { type: 'Airport', name: 'Kempegowda International Airport', distance: '35 km' },
            { type: 'Hospital', name: 'Columbia Asia Hospital', distance: '3 km' },
            { type: 'School', name: 'International School Bangalore', distance: '4 km' },
            { type: 'Mall', name: 'Phoenix Marketcity', distance: '5 km' },
            { type: 'IT Park', name: 'ITPL', distance: '1 km' },
        ],
        highlights: [
            { icon: 'Building2', label: 'Configuration', value: '2, 3, 4 BHK' },
            { icon: 'Maximize', label: 'Area Range', value: '1,250 - 2,800 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Dec 2027' },
            { icon: 'CheckCircle', label: 'RERA', value: 'Approved' },
        ],
        specifications_complex: {
            structure: { type: 'RCC Framed', walls: 'AAC Blocks', ceiling_height: '10 ft' },
            flooring: { living: 'Italian Marble', bedrooms: 'Vitrified Tiles', bathrooms: 'Anti-skid Tiles' },
            electrical: { wiring: 'Concealed Copper', switches: 'Modular', power_points: 'Adequate' },
        },
    },
    {
        project_id: 'PRJ-002',
        project_name: 'Assetz Zen and Sato',
        title: 'Assetz Zen and Sato - Serene Living',
        description: 'A tranquil residential enclave on Sarjapur Road, Assetz Zen and Sato blends Japanese-inspired design with modern Indian living. Spread across 12 acres of lush greenery.',
        rera_number: 'PRM/KA/RERA/1252/2024/B67890',
        developer_name: 'Assetz Property Group',
        status: 'Ready to Move',
        category: 'Residential', sub_category: 'Apartment',
        total_units: 380,
        min_price: '₹85 L', max_price: '₹1.5 Cr',
        min_price_numeric: 8500000, max_price_numeric: 15000000,
        price_per_sqft: 7200,
        min_area: 1100, max_area: 2100,
        property_type: 'Sale', bhk_options: ['1 BHK', '2 BHK', '3 BHK'],
        transaction_type: 'New',
        launch_date: 'March 2023', possession_date: 'June 2025',
        address: 'Survey No. 45, Sarjapur Road', location: 'Sarjapur Road', city: 'Bangalore', state: 'Karnataka', pincode: '560035', country: 'India',
        latitude: 12.9081, longitude: 77.7460,
        images: [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: true, is_rera_approved: true,
        show_ad_on_home: true,
        ad_card_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
        employee_name: 'Priya Sharma', employee_phone: '+91 98765 43211', employee_email: 'priya@21estates.com',
        amenities: ['Gymnasium', 'Infinity Pool', 'Zen Garden', 'Meditation Zone', 'Clubhouse', 'Library', 'Co-working Space', 'Jogging Track', 'Badminton Court', 'Power Backup', 'Rainwater Harvesting', 'EV Charging'],
        towers_data: [
            { name: 'Zen Block', total_floors: 18, total_units: 190, completion_date: 'March 2025', status: 'Ready' },
            { name: 'Sato Block', total_floors: 20, total_units: 190, completion_date: 'June 2025', status: 'Ready' },
        ],
        project_plan: [
            { type: 'Studio', bhk: '1 BHK', area: '650 sq.ft', price_rate: '₹7,200/sq.ft', basic_price: '₹46.8 L', completion_date: 'March 2025' },
            { type: 'Apartment', bhk: '2 BHK', area: '1,100 sq.ft', price_rate: '₹7,200/sq.ft', basic_price: '₹79.2 L', completion_date: 'March 2025' },
            { type: 'Apartment', bhk: '3 BHK', area: '1,650 sq.ft', price_rate: '₹7,500/sq.ft', basic_price: '₹1.24 Cr', completion_date: 'June 2025' },
        ],
        floor_plans: [
            { name: '1 BHK Studio', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80', bhk: '1 BHK', area: '650 sq.ft' },
            { name: '2 BHK Compact', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80', bhk: '2 BHK', area: '1,100 sq.ft' },
        ],
        connectivity: [
            { type: 'IT Park', name: 'Wipro Corporate Office', distance: '3 km' },
            { type: 'School', name: 'Greenwood High', distance: '2 km' },
            { type: 'Hospital', name: 'Narayana Health', distance: '5 km' },
            { type: 'Mall', name: 'Total Mall', distance: '4 km' },
            { type: 'Metro', name: 'HSR Layout Metro (upcoming)', distance: '6 km' },
        ],
        highlights: [
            { icon: 'Building2', label: 'Configuration', value: '1, 2, 3 BHK' },
            { icon: 'Maximize', label: 'Area Range', value: '650 - 2,100 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Ready to Move' },
            { icon: 'CheckCircle', label: 'RERA', value: 'Approved' },
        ],
        specifications_complex: {
            structure: { type: 'RCC Framed', walls: 'Clay Bricks', ceiling_height: '9.5 ft' },
            flooring: { living: 'Vitrified Tiles', bedrooms: 'Wooden Flooring', bathrooms: 'Ceramic Tiles' },
        },
    },
    {
        project_id: 'PRJ-003',
        project_name: 'Amigo Amparo',
        title: 'Amigo Amparo - Ultra Luxury',
        description: 'An ultra-luxury residential tower in the heart of Bandra, Mumbai. Amigo Amparo offers panoramic sea views, designer interiors, and an unmatched lifestyle experience.',
        rera_number: 'P51800028765',
        developer_name: 'Amigo Group',
        status: 'Pre-Launch',
        category: 'Residential', sub_category: 'Penthouse',
        total_units: 120,
        min_price: '₹3.5 Cr', max_price: '₹8 Cr',
        min_price_numeric: 35000000, max_price_numeric: 80000000,
        price_per_sqft: 32000,
        min_area: 1800, max_area: 4500,
        property_type: 'Sale', bhk_options: ['3 BHK', '4 BHK', '5 BHK'],
        transaction_type: 'New',
        launch_date: 'June 2026', possession_date: 'March 2030',
        address: 'Hill Road, Bandra West', location: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', country: 'India',
        latitude: 19.0596, longitude: 72.8295,
        images: [
            'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: true, is_rera_approved: true,
        show_ad_on_home: true,
        ad_card_image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&auto=format&fit=crop&q=80',
        employee_name: 'Ankit Verma', employee_phone: '+91 98765 43212', employee_email: 'ankit@21estates.com',
        amenities: ['Private Pool', 'Sky Lounge', 'Concierge Service', 'Helipad', 'Home Theatre', 'Wine Cellar', 'Spa & Sauna', 'Gymnasium', 'Squash Court', 'Business Centre', 'Valet Parking', 'Smart Home Automation'],
        towers_data: [
            { name: 'Amparo Tower', total_floors: 45, total_units: 120, completion_date: 'March 2030', status: 'Pre-Launch' },
        ],
        project_plan: [
            { type: 'Apartment', bhk: '3 BHK', area: '1,800 sq.ft', price_rate: '₹32,000/sq.ft', basic_price: '₹5.76 Cr', completion_date: 'March 2030' },
            { type: 'Penthouse', bhk: '4 BHK', area: '3,200 sq.ft', price_rate: '₹35,000/sq.ft', basic_price: '₹11.2 Cr', completion_date: 'March 2030' },
            { type: 'Sky Villa', bhk: '5 BHK', area: '4,500 sq.ft', price_rate: '₹38,000/sq.ft', basic_price: '₹17.1 Cr', completion_date: 'March 2030' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Railway', name: 'Bandra Station', distance: '1.5 km' },
            { type: 'Airport', name: 'Chhatrapati Shivaji Airport', distance: '12 km' },
            { type: 'Beach', name: 'Bandstand Promenade', distance: '800 m' },
            { type: 'Mall', name: 'Linking Road Market', distance: '1 km' },
            { type: 'Hospital', name: 'Lilavati Hospital', distance: '3 km' },
        ],
        highlights: [
            { icon: 'Building2', label: 'Configuration', value: '3, 4, 5 BHK' },
            { icon: 'Maximize', label: 'Area Range', value: '1,800 - 4,500 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Mar 2030' },
            { icon: 'Eye', label: 'View', value: 'Sea Facing' },
        ],
        specifications_complex: {
            structure: { type: 'Steel-RCC Composite', walls: 'Dry Wall Partition', ceiling_height: '12 ft' },
            flooring: { living: 'Italian Marble', bedrooms: 'Engineered Wood', bathrooms: 'Imported Marble' },
            fittings: { kitchen: 'Modular European', bathroom: 'Grohe/Duravit', doors: 'Veneer Finish' },
        },
    },
    {
        project_id: 'PRJ-004',
        project_name: 'Brigade Eternia',
        title: 'Brigade Eternia - Tech City Living',
        description: 'Located in the bustling HITEC City corridor, Brigade Eternia offers smart homes with cutting-edge technology integration. Perfect for IT professionals seeking contemporary living.',
        rera_number: 'P02400005432',
        developer_name: 'Brigade Group',
        status: 'Under Construction',
        category: 'Residential', sub_category: 'Apartment',
        total_units: 600,
        min_price: '₹95 L', max_price: '₹2.2 Cr',
        min_price_numeric: 9500000, max_price_numeric: 22000000,
        price_per_sqft: 8200,
        min_area: 1150, max_area: 2650,
        property_type: 'Sale', bhk_options: ['2 BHK', '3 BHK', '3.5 BHK'],
        transaction_type: 'New',
        launch_date: 'August 2024', possession_date: 'September 2028',
        address: 'Nanakramguda', location: 'HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500032', country: 'India',
        latitude: 17.4435, longitude: 78.3772,
        images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: true, is_rera_approved: true,
        show_ad_on_home: true,
        ad_card_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
        employee_name: 'Sanjay Reddy', employee_phone: '+91 98765 43213', employee_email: 'sanjay@21estates.com',
        amenities: ['Smart Home System', 'Gymnasium', 'Swimming Pool', 'Tennis Court', 'Basketball Court', 'Jogging Track', 'Clubhouse', 'Mini Theatre', 'Library', 'Co-working Space', 'EV Charging', 'Rainwater Harvesting', 'Solar Panels', 'Waste Management'],
        towers_data: [
            { name: 'Alpha', total_floors: 30, total_units: 200, completion_date: 'March 2028', status: 'Under Construction' },
            { name: 'Beta', total_floors: 30, total_units: 200, completion_date: 'June 2028', status: 'Under Construction' },
            { name: 'Gamma', total_floors: 28, total_units: 200, completion_date: 'September 2028', status: 'Under Construction' },
        ],
        project_plan: [
            { type: 'Apartment', bhk: '2 BHK', area: '1,150 sq.ft', price_rate: '₹8,200/sq.ft', basic_price: '₹94.3 L', completion_date: 'March 2028' },
            { type: 'Apartment', bhk: '3 BHK', area: '1,750 sq.ft', price_rate: '₹8,200/sq.ft', basic_price: '₹1.44 Cr', completion_date: 'June 2028' },
            { type: 'Apartment', bhk: '3.5 BHK', area: '2,200 sq.ft', price_rate: '₹8,500/sq.ft', basic_price: '₹1.87 Cr', completion_date: 'September 2028' },
        ],
        floor_plans: [
            { name: '2 BHK Standard', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80', bhk: '2 BHK', area: '1,150 sq.ft' },
        ],
        connectivity: [
            { type: 'IT Park', name: 'HITEC City', distance: '1 km' },
            { type: 'Metro', name: 'Raidurg Metro', distance: '2.5 km' },
            { type: 'Mall', name: 'Inorbit Mall', distance: '3 km' },
            { type: 'Hospital', name: 'Continental Hospital', distance: '4 km' },
            { type: 'School', name: 'Oakridge International', distance: '5 km' },
        ],
        highlights: [
            { icon: 'Building2', label: 'Configuration', value: '2, 3, 3.5 BHK' },
            { icon: 'Maximize', label: 'Area Range', value: '1,150 - 2,650 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Sep 2028' },
            { icon: 'Cpu', label: 'Smart Home', value: 'Included' },
        ],
        specifications_complex: {
            structure: { type: 'RCC Framed', walls: 'AAC Blocks', ceiling_height: '10 ft' },
            flooring: { living: 'Vitrified Tiles', bedrooms: 'Laminate Wood', bathrooms: 'Anti-skid Tiles' },
            smart: { automation: 'Alexa/Google Compatible', security: 'Video Doorbell', lighting: 'App Controlled' },
        },
    },
    {
        project_id: 'PRJ-005',
        project_name: 'L&T Elara Celestia',
        title: 'L&T Elara Celestia - Coastal Living',
        description: 'Set along the scenic OMR corridor, L&T Elara Celestia brings coastal-inspired architecture with open layouts and cross-ventilated apartments. A new standard in Chennai living.',
        rera_number: 'TN/29/Building/0345/2025',
        developer_name: 'L&T Realty',
        status: 'Upcoming',
        category: 'Residential', sub_category: 'Apartment',
        total_units: 520,
        min_price: '₹65 L', max_price: '₹1.8 Cr',
        min_price_numeric: 6500000, max_price_numeric: 18000000,
        price_per_sqft: 6800,
        min_area: 950, max_area: 2400,
        property_type: 'Sale', bhk_options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK'],
        transaction_type: 'New',
        launch_date: 'December 2026', possession_date: 'June 2030',
        address: 'Sholinganallur Junction', location: 'OMR', city: 'Chennai', state: 'Tamil Nadu', pincode: '600119', country: 'India',
        latitude: 12.8996, longitude: 80.2209,
        images: [
            'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: true, is_rera_approved: true,
        show_ad_on_home: true,
        ad_card_image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&auto=format&fit=crop&q=80',
        employee_name: 'Meera Nair', employee_phone: '+91 98765 43214', employee_email: 'meera@21estates.com',
        amenities: ['Olympic Pool', 'Gymnasium', 'Beach Volleyball', 'Squash Court', 'Amphitheatre', 'Organic Garden', 'Pet Park', 'Senior Citizen Corner', 'Multipurpose Hall', 'Badminton Court', 'Cricket Pitch', 'Skating Rink'],
        towers_data: [
            { name: 'Celestia North', total_floors: 22, total_units: 260, completion_date: 'March 2030', status: 'Upcoming' },
            { name: 'Celestia South', total_floors: 22, total_units: 260, completion_date: 'June 2030', status: 'Upcoming' },
        ],
        project_plan: [
            { type: 'Apartment', bhk: '1 BHK', area: '550 sq.ft', price_rate: '₹6,800/sq.ft', basic_price: '₹37.4 L', completion_date: 'March 2030' },
            { type: 'Apartment', bhk: '2 BHK', area: '1,100 sq.ft', price_rate: '₹6,800/sq.ft', basic_price: '₹74.8 L', completion_date: 'March 2030' },
            { type: 'Apartment', bhk: '3 BHK', area: '1,700 sq.ft', price_rate: '₹7,000/sq.ft', basic_price: '₹1.19 Cr', completion_date: 'June 2030' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'IT Park', name: 'Tidel Park', distance: '8 km' },
            { type: 'Beach', name: 'Neelankarai Beach', distance: '3 km' },
            { type: 'School', name: 'PSBB School', distance: '4 km' },
            { type: 'Hospital', name: 'Apollo Hospital OMR', distance: '5 km' },
            { type: 'Airport', name: 'Chennai Airport', distance: '18 km' },
        ],
        highlights: [
            { icon: 'Building2', label: 'Configuration', value: '1, 2, 3, 4 BHK' },
            { icon: 'Maximize', label: 'Area Range', value: '950 - 2,400 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Jun 2030' },
            { icon: 'Trees', label: 'Green Area', value: '70%' },
        ],
        specifications_complex: {
            structure: { type: 'RCC Framed', walls: 'Red Bricks', ceiling_height: '10 ft' },
            flooring: { living: 'Double-charged Vitrified', bedrooms: 'Vitrified Tiles', bathrooms: 'Anti-skid Ceramic' },
        },
    },

    // ── VILLA (4) ──
    {
        project_id: 'PRJ-006',
        project_name: 'Signature One Villas',
        title: 'Signature One Villas - Exclusive Living',
        description: 'Ultra-luxury independent villas near Kempegowda International Airport. Each villa sits on a generous plot with private garden, pool provision, and smart home features.',
        rera_number: 'PRM/KA/RERA/1253/2024/V11111',
        developer_name: 'Signature Developers',
        status: 'Ready to Move',
        category: 'Villa', sub_category: 'Independent Villa',
        total_units: 85,
        min_price: '₹3.5 Cr', max_price: '₹6.5 Cr',
        min_price_numeric: 35000000, max_price_numeric: 65000000,
        price_per_sqft: 8500,
        min_area: 3200, max_area: 5500,
        property_type: 'Sale', bhk_options: ['3 BHK', '4 BHK', '5 BHK'],
        transaction_type: 'New',
        launch_date: 'January 2023', possession_date: 'March 2025',
        address: 'NH-44, Devanahalli', location: 'Devanahalli', city: 'Bangalore', state: 'Karnataka', pincode: '562110', country: 'India',
        latitude: 13.2473, longitude: 77.7120,
        images: [
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Vikram Singh', employee_phone: '+91 98765 43215', employee_email: 'vikram@21estates.com',
        amenities: ['Private Garden', 'Swimming Pool Provision', 'Clubhouse', 'Tennis Court', 'Jogging Track', 'Children\'s Play Area', 'Community Hall', 'Gymnasium', '24/7 Security', 'CCTV Surveillance', 'Gated Community', 'Landscaped Avenue'],
        towers_data: [
            { cluster_name: 'Emerald Cluster', total_villas: 30, villa_types: ['3 BHK', '4 BHK'], completion_date: 'December 2024', status: 'Ready' },
            { cluster_name: 'Sapphire Cluster', total_villas: 35, villa_types: ['4 BHK', '5 BHK'], completion_date: 'March 2025', status: 'Ready' },
            { cluster_name: 'Diamond Cluster', total_villas: 20, villa_types: ['5 BHK'], completion_date: 'June 2025', status: 'Under Construction' },
        ],
        project_plan: [
            { villa_type: 'Classic', bhk: 3, plot_area: '2,400 sq.ft', built_up_area: '3,200 sq.ft', floors: 2, price_range: '₹3.5 - 4.2 Cr', status: 'Available' },
            { villa_type: 'Premium', bhk: 4, plot_area: '3,000 sq.ft', built_up_area: '4,200 sq.ft', floors: 2, price_range: '₹4.5 - 5.5 Cr', status: 'Available' },
            { villa_type: 'Grandeur', bhk: 5, plot_area: '4,000 sq.ft', built_up_area: '5,500 sq.ft', floors: 3, price_range: '₹5.8 - 6.5 Cr', status: 'Sold Out' },
        ],
        floor_plans: [
            { name: '3 BHK Classic Villa', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80', bhk: '3 BHK', area: '3,200 sq.ft' },
        ],
        connectivity: [
            { type: 'Airport', name: 'KIA Airport', distance: '8 km' },
            { type: 'School', name: 'Ryan International', distance: '5 km' },
            { type: 'Hospital', name: 'Aster CMI', distance: '12 km' },
            { type: 'Highway', name: 'NH-44', distance: '500 m' },
            { type: 'IT Park', name: 'Manyata Tech Park', distance: '20 km' },
        ],
        highlights: [
            { icon: 'Home', label: 'Configuration', value: '3, 4, 5 BHK Villas' },
            { icon: 'Maximize', label: 'Plot Size', value: '2,400 - 4,000 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Ready to Move' },
            { icon: 'Shield', label: 'Gated', value: 'Yes' },
        ],
        specifications_complex: {
            structure: { type: 'Load Bearing + RCC', walls: 'Red Bricks', ceiling_height: '11 ft' },
            flooring: { living: 'Italian Marble', bedrooms: 'Wooden Flooring', terrace: 'Rustic Tiles' },
        },
    },
    {
        project_id: 'PRJ-007',
        project_name: 'Prestige Sanctuary',
        title: 'Prestige Sanctuary - Coastal Retreat',
        description: 'A breathtaking villa community in Candolim, Goa. Prestige Sanctuary offers resort-style living with Portuguese-inspired architecture, private pools, and lush tropical landscaping.',
        rera_number: 'PRGO-RER-5678-2025',
        developer_name: 'Prestige Group',
        status: 'Under Construction',
        category: 'Villa', sub_category: 'Independent Villa',
        total_units: 45,
        min_price: '₹4.5 Cr', max_price: '₹12 Cr',
        min_price_numeric: 45000000, max_price_numeric: 120000000,
        price_per_sqft: 15000,
        min_area: 3500, max_area: 8000,
        property_type: 'Sale', bhk_options: ['3 BHK', '4 BHK', '5 BHK'],
        transaction_type: 'New',
        launch_date: 'September 2025', possession_date: 'December 2028',
        address: 'Fort Aguada Road', location: 'Candolim', city: 'Goa', state: 'Goa', pincode: '403515', country: 'India',
        latitude: 15.5179, longitude: 73.7626,
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Deepak Patel', employee_phone: '+91 98765 43216', employee_email: 'deepak@21estates.com',
        amenities: ['Private Pool', 'Beach Access', 'Spa & Wellness', 'Wine Bar', 'Infinity Pool', 'Concierge', 'Water Sports', 'Cycling Track', 'Yoga Pavilion', 'Open-air Theatre', 'Clubhouse', 'Guest Suites'],
        towers_data: [
            { cluster_name: 'Beach Cove', total_villas: 15, villa_types: ['3 BHK', '4 BHK'], completion_date: 'June 2028', status: 'Under Construction' },
            { cluster_name: 'Hilltop Estate', total_villas: 15, villa_types: ['4 BHK', '5 BHK'], completion_date: 'December 2028', status: 'Under Construction' },
            { cluster_name: 'The Peninsula', total_villas: 15, villa_types: ['5 BHK'], completion_date: 'December 2028', status: 'Under Construction' },
        ],
        project_plan: [
            { villa_type: 'Coastal', bhk: 3, plot_area: '3,000 sq.ft', built_up_area: '3,500 sq.ft', floors: 2, price_range: '₹4.5 - 6 Cr', status: 'Available' },
            { villa_type: 'Heritage', bhk: 4, plot_area: '4,500 sq.ft', built_up_area: '5,500 sq.ft', floors: 2, price_range: '₹7 - 9 Cr', status: 'Available' },
            { villa_type: 'Royal', bhk: 5, plot_area: '6,000 sq.ft', built_up_area: '8,000 sq.ft', floors: 3, price_range: '₹10 - 12 Cr', status: 'Available' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Beach', name: 'Candolim Beach', distance: '500 m' },
            { type: 'Airport', name: 'Goa International Airport', distance: '40 km' },
            { type: 'Hospital', name: 'Manipal Hospital Goa', distance: '15 km' },
            { type: 'Market', name: 'Calangute Market', distance: '3 km' },
        ],
        highlights: [
            { icon: 'Home', label: 'Configuration', value: '3, 4, 5 BHK Villas' },
            { icon: 'Waves', label: 'Beach', value: '500m Away' },
            { icon: 'Calendar', label: 'Possession', value: 'Dec 2028' },
            { icon: 'Palmtree', label: 'Lifestyle', value: 'Resort Living' },
        ],
        specifications_complex: {
            structure: { type: 'Laterite + RCC', walls: 'Laterite Stone', ceiling_height: '12 ft' },
            flooring: { living: 'Kotah Stone', bedrooms: 'Teak Wood', outdoor: 'Natural Stone' },
        },
    },
    {
        project_id: 'PRJ-008',
        project_name: 'Provident Deansgate',
        title: 'Provident Deansgate - Heritage Villas',
        description: 'Elegant row houses in Mysore blending heritage architecture with modern amenities. Provident Deansgate offers a peaceful lifestyle surrounded by royal heritage.',
        rera_number: 'PRM/KA/RERA/1254/2023/V22222',
        developer_name: 'Provident Housing',
        status: 'Completed',
        category: 'Villa', sub_category: 'Row House',
        total_units: 120,
        min_price: '₹1.8 Cr', max_price: '₹3.2 Cr',
        min_price_numeric: 18000000, max_price_numeric: 32000000,
        price_per_sqft: 6500,
        min_area: 2200, max_area: 4000,
        property_type: 'Sale', bhk_options: ['3 BHK', '4 BHK'],
        transaction_type: 'New',
        launch_date: 'March 2022', possession_date: 'December 2024',
        address: 'Outer Ring Road', location: 'Ring Road', city: 'Mysore', state: 'Karnataka', pincode: '570017', country: 'India',
        latitude: 12.3051, longitude: 76.6551,
        images: [
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Lakshmi Rao', employee_phone: '+91 98765 43217', employee_email: 'lakshmi@21estates.com',
        amenities: ['Clubhouse', 'Swimming Pool', 'Gymnasium', 'Children\'s Play Area', 'Jogging Track', 'Landscaped Garden', 'Power Backup', '24/7 Security', 'Community Hall', 'Indoor Games'],
        towers_data: [
            { cluster_name: 'Heritage Row', total_villas: 60, villa_types: ['3 BHK', '4 BHK'], completion_date: 'September 2024', status: 'Completed' },
            { cluster_name: 'Royal Row', total_villas: 60, villa_types: ['3 BHK', '4 BHK'], completion_date: 'December 2024', status: 'Completed' },
        ],
        project_plan: [
            { villa_type: 'Heritage 3BHK', bhk: 3, plot_area: '1,500 sq.ft', built_up_area: '2,200 sq.ft', floors: 2, price_range: '₹1.8 - 2.2 Cr', status: 'Available' },
            { villa_type: 'Royal 4BHK', bhk: 4, plot_area: '2,200 sq.ft', built_up_area: '3,500 sq.ft', floors: 3, price_range: '₹2.8 - 3.2 Cr', status: 'Available' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Palace', name: 'Mysore Palace', distance: '8 km' },
            { type: 'School', name: 'Maharaja\'s College', distance: '5 km' },
            { type: 'Hospital', name: 'JSS Hospital', distance: '6 km' },
            { type: 'Highway', name: 'Bangalore-Mysore Highway', distance: '2 km' },
        ],
        highlights: [
            { icon: 'Home', label: 'Configuration', value: '3, 4 BHK Row Houses' },
            { icon: 'Maximize', label: 'Area Range', value: '2,200 - 4,000 Sq.Ft' },
            { icon: 'Calendar', label: 'Possession', value: 'Completed' },
            { icon: 'Crown', label: 'Style', value: 'Heritage' },
        ],
        specifications_complex: {
            structure: { type: 'Load Bearing', walls: 'Clay Bricks', ceiling_height: '10.5 ft' },
            flooring: { living: 'Kota Stone', bedrooms: 'Vitrified Tiles', courtyard: 'Natural Stone' },
        },
    },
    {
        project_id: 'PRJ-009',
        project_name: 'Goyal & Co Riveria',
        title: 'Goyal & Co Riveria - Riverside Luxury',
        description: 'Premium twin villas along the Noyyal River in Coimbatore. Goyal & Co Riveria offers expansive living spaces with river views and world-class amenities.',
        rera_number: 'TN/29/Building/0678/2025',
        developer_name: 'Goyal & Co',
        status: 'Pre-Launch',
        category: 'Villa', sub_category: 'Twin Villa',
        total_units: 60,
        min_price: '₹2.5 Cr', max_price: '₹5 Cr',
        min_price_numeric: 25000000, max_price_numeric: 50000000,
        price_per_sqft: 7800,
        min_area: 2800, max_area: 5200,
        property_type: 'Sale', bhk_options: ['3 BHK', '4 BHK'],
        transaction_type: 'New',
        launch_date: 'August 2026', possession_date: 'December 2029',
        address: 'RS Puram Extension', location: 'RS Puram', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641002', country: 'India',
        latitude: 11.0168, longitude: 76.9558,
        images: [
            'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Arjun Menon', employee_phone: '+91 98765 43218', employee_email: 'arjun@21estates.com',
        amenities: ['River Deck', 'Infinity Pool', 'Gymnasium', 'Clubhouse', 'Jogging Track', 'Yoga Hall', 'BBQ Area', 'Tennis Court', 'Children\'s Play Area', '24/7 Security', 'Landscaped Garden', 'Meditation Zone'],
        towers_data: [
            { cluster_name: 'River View', total_villas: 30, villa_types: ['3 BHK', '4 BHK'], completion_date: 'June 2029', status: 'Pre-Launch' },
            { cluster_name: 'Garden View', total_villas: 30, villa_types: ['3 BHK', '4 BHK'], completion_date: 'December 2029', status: 'Pre-Launch' },
        ],
        project_plan: [
            { villa_type: 'Riverside', bhk: 3, plot_area: '2,000 sq.ft', built_up_area: '2,800 sq.ft', floors: 2, price_range: '₹2.5 - 3.5 Cr', status: 'Available' },
            { villa_type: 'Grand Riverside', bhk: 4, plot_area: '3,000 sq.ft', built_up_area: '4,500 sq.ft', floors: 3, price_range: '₹4 - 5 Cr', status: 'Available' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Railway', name: 'Coimbatore Junction', distance: '5 km' },
            { type: 'Airport', name: 'Coimbatore Airport', distance: '12 km' },
            { type: 'Hospital', name: 'KMCH Hospital', distance: '3 km' },
            { type: 'School', name: 'SSVM School', distance: '4 km' },
            { type: 'Mall', name: 'Brookefields Mall', distance: '6 km' },
        ],
        highlights: [
            { icon: 'Home', label: 'Configuration', value: '3, 4 BHK Twin Villas' },
            { icon: 'Waves', label: 'River View', value: 'Noyyal River' },
            { icon: 'Calendar', label: 'Possession', value: 'Dec 2029' },
            { icon: 'Trees', label: 'Green Cover', value: '65%' },
        ],
        specifications_complex: {
            structure: { type: 'RCC Framed', walls: 'AAC Blocks', ceiling_height: '11 ft' },
            flooring: { living: 'Italian Marble', bedrooms: 'Wooden Flooring', deck: 'Composite Wood' },
        },
    },

    // ── PLOT (3) ──
    {
        project_id: 'PRJ-010',
        project_name: 'Rewild Doddaballapur',
        title: 'Rewild Doddaballapur - Nature Plots',
        description: 'Premium NA plots near Doddaballapur with excellent connectivity to Bangalore International Airport. Surrounded by nature with planned infrastructure and gated security.',
        rera_number: 'PRM/KA/RERA/1255/2025/L33333',
        developer_name: 'Rewild Estates',
        status: 'Under Construction',
        category: 'Plot', sub_category: 'Residential Plot',
        total_units: 200,
        min_price: '₹35 L', max_price: '₹85 L',
        min_price_numeric: 3500000, max_price_numeric: 8500000,
        price_per_sqft: 2800,
        min_area: 1200, max_area: 3000,
        property_type: 'Sale', bhk_options: null,
        transaction_type: 'New',
        launch_date: 'April 2025', possession_date: 'March 2027',
        address: 'Doddaballapur-Bangalore Road', location: 'Doddaballapur', city: 'Bangalore', state: 'Karnataka', pincode: '561203', country: 'India',
        latitude: 13.2948, longitude: 77.5393,
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Suresh Babu', employee_phone: '+91 98765 43219', employee_email: 'suresh@21estates.com',
        amenities: ['Gated Community', 'Underground Drainage', 'Wide Roads', 'Avenue Plantation', 'Children\'s Park', 'Jogging Track', 'Community Hall', 'Overhead Tank', 'Street Lighting', '24/7 Security'],
        towers_data: [
            { phase_name: 'Phase 1 - Wildflower', total_plots: 80, launch_date: 'April 2025', status: 'Under Construction', completion_date: 'September 2026' },
            { phase_name: 'Phase 2 - Meadow', total_plots: 70, launch_date: 'October 2025', status: 'Upcoming', completion_date: 'December 2026' },
            { phase_name: 'Phase 3 - Forest Edge', total_plots: 50, launch_date: 'April 2026', status: 'Upcoming', completion_date: 'March 2027' },
        ],
        project_plan: [
            { plot_type: 'Standard', dimensions: '30x40', area_sqft: 1200, facing: 'East', price_per_sqft: 2800, total_price: '₹33.6 L', status: 'Available' },
            { plot_type: 'Premium', dimensions: '40x60', area_sqft: 2400, facing: 'North', price_per_sqft: 3000, total_price: '₹72 L', status: 'Available' },
            { plot_type: 'Corner', dimensions: '50x60', area_sqft: 3000, facing: 'North-East', price_per_sqft: 3200, total_price: '₹96 L', status: 'Booked' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Airport', name: 'KIA Airport', distance: '15 km' },
            { type: 'Highway', name: 'NH-44', distance: '3 km' },
            { type: 'Town', name: 'Doddaballapur Town', distance: '5 km' },
            { type: 'Railway', name: 'Doddaballapur Railway Station', distance: '6 km' },
            { type: 'Industrial', name: 'Aerospace SEZ', distance: '10 km' },
        ],
        highlights: [
            { icon: 'Map', label: 'Plot Sizes', value: '1,200 - 3,000 Sq.Ft' },
            { icon: 'Shield', label: 'Gated', value: 'Yes' },
            { icon: 'Calendar', label: 'Possession', value: 'Mar 2027' },
            { icon: 'Plane', label: 'Airport', value: '15 km' },
        ],
        specifications_complex: {
            road_width: '30 ft & 40 ft',
            drainage: 'Underground SWD',
            water_supply: 'Borewell + OHT',
            electricity: 'BESCOM Connection',
            compound_wall: 'Around Periphery',
            landscaping: 'Avenue Trees & Parks',
        },
    },
    {
        project_id: 'PRJ-011',
        project_name: 'Tangled Up in Green',
        title: 'Tangled Up in Green - Farm Plots',
        description: 'Exclusive farm plots in the serene outskirts of Hyderabad near Shamirpet. Perfect for weekend homes, organic farming, or long-term investment in rapidly developing area.',
        rera_number: 'P02400006789',
        developer_name: 'Green Living Estates',
        status: 'Ready to Move',
        category: 'Plot', sub_category: 'Farm Plot',
        total_units: 150,
        min_price: '₹25 L', max_price: '₹65 L',
        min_price_numeric: 2500000, max_price_numeric: 6500000,
        price_per_sqft: 800,
        min_area: 2400, max_area: 10000,
        property_type: 'Sale', bhk_options: null,
        transaction_type: 'New',
        launch_date: 'January 2024', possession_date: 'Immediate',
        address: 'Shamirpet Road', location: 'Shamirpet', city: 'Hyderabad', state: 'Telangana', pincode: '500078', country: 'India',
        latitude: 17.5768, longitude: 78.5704,
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Kavitha Reddy', employee_phone: '+91 98765 43220', employee_email: 'kavitha@21estates.com',
        amenities: ['Organic Farm Zone', 'Walking Trails', 'Lake View', 'Gated Entry', 'Compound Wall', 'Bore Well', 'Electricity Connection', 'Tar Roads', 'Community Farming', 'Caretaker Service'],
        towers_data: [
            { phase_name: 'Phase 1 - Lakeside', total_plots: 75, launch_date: 'January 2024', status: 'Ready', completion_date: 'June 2024' },
            { phase_name: 'Phase 2 - Hillock', total_plots: 75, launch_date: 'July 2024', status: 'Ready', completion_date: 'December 2024' },
        ],
        project_plan: [
            { plot_type: 'Garden Plot', dimensions: '40x60', area_sqft: 2400, facing: 'East', price_per_sqft: 800, total_price: '₹19.2 L', status: 'Available' },
            { plot_type: 'Farm Plot', dimensions: '60x80', area_sqft: 4800, facing: 'North', price_per_sqft: 750, total_price: '₹36 L', status: 'Available' },
            { plot_type: 'Premium Farm', dimensions: '100x100', area_sqft: 10000, facing: 'Lake View', price_per_sqft: 650, total_price: '₹65 L', status: 'Available' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Lake', name: 'Shamirpet Lake', distance: '2 km' },
            { type: 'Highway', name: 'NH-44', distance: '8 km' },
            { type: 'City', name: 'Secunderabad', distance: '30 km' },
            { type: 'Airport', name: 'Shamshabad Airport', distance: '55 km' },
        ],
        highlights: [
            { icon: 'Map', label: 'Plot Sizes', value: '2,400 - 10,000 Sq.Ft' },
            { icon: 'Leaf', label: 'Type', value: 'Farm Plots' },
            { icon: 'Calendar', label: 'Possession', value: 'Immediate' },
            { icon: 'Waves', label: 'Lake View', value: 'Available' },
        ],
        specifications_complex: {
            road_width: '30 ft Internal',
            drainage: 'Natural Slope',
            water_supply: 'Borewell',
            electricity: 'TSSPDCL',
            fencing: 'Barbed Wire + Stone',
            soil_type: 'Red Laterite - Fertile',
        },
    },
    {
        project_id: 'PRJ-012',
        project_name: 'Prestige Greenbrook',
        title: 'Prestige Greenbrook - ECR Premium Plots',
        description: 'Premium residential plots along East Coast Road in Chennai. Prestige Greenbrook offers DTCP-approved plots with beach proximity and world-class infrastructure.',
        rera_number: 'TN/29/Layout/0123/2026',
        developer_name: 'Prestige Group',
        status: 'Upcoming',
        category: 'Plot', sub_category: 'Residential Plot',
        total_units: 180,
        min_price: '₹45 L', max_price: '₹1.2 Cr',
        min_price_numeric: 4500000, max_price_numeric: 12000000,
        price_per_sqft: 3500,
        min_area: 1200, max_area: 3500,
        property_type: 'Sale', bhk_options: null,
        transaction_type: 'New',
        launch_date: 'March 2027', possession_date: 'December 2028',
        address: 'ECR Junction, Thiruvidandhai', location: 'ECR', city: 'Chennai', state: 'Tamil Nadu', pincode: '603104', country: 'India',
        latitude: 12.8352, longitude: 80.2077,
        images: [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=80',
        ],
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        is_featured: false, is_rera_approved: true,
        show_ad_on_home: false, ad_card_image: null,
        employee_name: 'Ramesh Iyer', employee_phone: '+91 98765 43221', employee_email: 'ramesh@21estates.com',
        amenities: ['Clubhouse', 'Swimming Pool', 'Tennis Court', 'Gated Entry', 'Underground Cabling', 'Wide Roads', 'Storm Water Drain', 'Park', 'Jogging Track', 'Children\'s Play Area', 'EV Charging Points'],
        towers_data: [
            { phase_name: 'Phase 1 - Coastal', total_plots: 90, launch_date: 'March 2027', status: 'Upcoming', completion_date: 'September 2028' },
            { phase_name: 'Phase 2 - Garden', total_plots: 90, launch_date: 'September 2027', status: 'Upcoming', completion_date: 'December 2028' },
        ],
        project_plan: [
            { plot_type: 'Standard', dimensions: '30x40', area_sqft: 1200, facing: 'East', price_per_sqft: 3500, total_price: '₹42 L', status: 'Available' },
            { plot_type: 'Premium', dimensions: '40x60', area_sqft: 2400, facing: 'North', price_per_sqft: 3800, total_price: '₹91.2 L', status: 'Available' },
            { plot_type: 'Corner Premium', dimensions: '50x70', area_sqft: 3500, facing: 'North-East', price_per_sqft: 4000, total_price: '₹1.4 Cr', status: 'Available' },
        ],
        floor_plans: [],
        connectivity: [
            { type: 'Beach', name: 'Thiruvidandhai Beach', distance: '1 km' },
            { type: 'IT Park', name: 'Siruseri IT Park', distance: '10 km' },
            { type: 'School', name: 'SBOA School', distance: '8 km' },
            { type: 'Hospital', name: 'Chettinad Hospital', distance: '12 km' },
            { type: 'City', name: 'Chennai City Centre', distance: '35 km' },
        ],
        highlights: [
            { icon: 'Map', label: 'Plot Sizes', value: '1,200 - 3,500 Sq.Ft' },
            { icon: 'Waves', label: 'Beach', value: '1 km Away' },
            { icon: 'Calendar', label: 'Possession', value: 'Dec 2028' },
            { icon: 'FileCheck', label: 'Approval', value: 'DTCP + RERA' },
        ],
        specifications_complex: {
            road_width: '40 ft Main, 30 ft Internal',
            drainage: 'Underground SWD',
            water_supply: 'CMWSSB + Borewell',
            electricity: 'TANGEDCO Underground',
            compound_wall: 'RCC Compound Wall',
            landscaping: 'Premium Avenue + Parks',
        },
    },
];

// ─── PROPERTIES DATA ──────────────────────────────────────────────

const properties = [
    // 1. Apartment Sale - Bangalore
    {
        property_id: 'PROP-001', title: '3 BHK Premium Apartment in Indiranagar',
        description: 'Spacious 3 BHK apartment in the heart of Indiranagar with modern amenities, covered parking, and proximity to metro. Recently renovated with premium fittings.',
        price: 15000000, price_text: '₹1.5 Cr', price_per_sqft: 10000,
        location: 'Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038', country: 'India',
        latitude: 12.9784, longitude: 77.6408, address: '100 Feet Road, Indiranagar',
        bedrooms: 3, bathrooms: 3, sqft: 1500, carpet_area: 1200, built_up_area: 1500,
        property_type: 'Sale', category: 'Apartment', sub_category: 'Apartment',
        furnishing: 'Semi-Furnished', facing: 'East', ownership: 'Freehold', possession_status: 'Ready to Move', property_age: '2 Years',
        status: 'Active', is_featured: true, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Gymnasium', 'Swimming Pool', 'Power Backup', 'Car Parking', 'Lift', '24/7 Security', 'Clubhouse', 'Children\'s Play Area'],
        floor_number: '8', total_floors: '14', balconies: 2, parking_count: 1,
    },
    // 2. Apartment Sale - Mumbai
    {
        property_id: 'PROP-002', title: '2 BHK Sea-View Apartment in Worli',
        description: 'Luxurious 2 BHK apartment in Worli with stunning sea views, modern kitchen, and access to world-class amenities. Walking distance to Worli Sea Link.',
        price: 35000000, price_text: '₹3.5 Cr', price_per_sqft: 35000,
        location: 'Worli', city: 'Mumbai', state: 'Maharashtra', pincode: '400018', country: 'India',
        latitude: 19.0176, longitude: 72.8152, address: 'Worli Sea Face',
        bedrooms: 2, bathrooms: 2, sqft: 1000, carpet_area: 800, built_up_area: 1000,
        property_type: 'Sale', category: 'Apartment', sub_category: 'Apartment',
        furnishing: 'Furnished', facing: 'West', ownership: 'Freehold', possession_status: 'Ready to Move', property_age: '5 Years',
        status: 'Active', is_featured: true, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Sea View', 'Swimming Pool', 'Gymnasium', 'Concierge', 'Valet Parking', 'Lift', 'Power Backup', 'Fire Safety'],
        floor_number: '22', total_floors: '40', balconies: 1, parking_count: 1,
    },
    // 3. Apartment Rent - Hyderabad
    {
        property_id: 'PROP-003', title: '2 BHK Furnished Apartment for Rent in Gachibowli',
        description: 'Fully furnished 2 BHK apartment near IT corridor. Ideal for working professionals. Includes modular kitchen, wardrobes, and AC in all rooms.',
        price: 35000, price_text: '₹35,000/month', deposit_amount: '₹2 Lakhs',
        location: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032', country: 'India',
        latitude: 17.4401, longitude: 78.3489, address: 'DLF Cyber City Road, Gachibowli',
        bedrooms: 2, bathrooms: 2, sqft: 1100, carpet_area: 900, built_up_area: 1100,
        property_type: 'Rent', category: 'Apartment', sub_category: 'Apartment',
        furnishing: 'Furnished', facing: 'North', ownership: 'Freehold', possession_status: 'Ready to Move', property_age: '3 Years',
        status: 'Active', is_featured: true, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Gymnasium', 'Swimming Pool', 'Clubhouse', 'Power Backup', 'Lift', '24/7 Security', 'Covered Parking'],
        floor_number: '5', total_floors: '12', balconies: 1, parking_count: 1,
    },
    // 4. Apartment Rent - Chennai
    {
        property_id: 'PROP-004', title: '3 BHK Apartment for Rent in Anna Nagar',
        description: 'Well-maintained 3 BHK apartment in Anna Nagar West. Semi-furnished with modular kitchen. Near metro station and shopping complexes.',
        price: 45000, price_text: '₹45,000/month', deposit_amount: '₹3 Lakhs',
        location: 'Anna Nagar West', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040', country: 'India',
        latitude: 13.0878, longitude: 80.2089, address: '2nd Avenue, Anna Nagar West',
        bedrooms: 3, bathrooms: 2, sqft: 1400, carpet_area: 1100, built_up_area: 1400,
        property_type: 'Rent', category: 'Apartment', sub_category: 'Apartment',
        furnishing: 'Semi-Furnished', facing: 'South', ownership: 'Freehold', possession_status: 'Ready to Move', property_age: '4 Years',
        status: 'Active', is_featured: true, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Gymnasium', 'Power Backup', 'Lift', '24/7 Security', 'Car Parking', 'Children\'s Play Area'],
        floor_number: '3', total_floors: '8', balconies: 2, parking_count: 1,
    },
    // 5. Villa Sale - Bangalore
    {
        property_id: 'PROP-005', title: '4 BHK Independent Villa in Sarjapur',
        description: 'Stunning 4 BHK independent villa with private garden, car porch, and modern interiors. Located in a gated community with excellent amenities.',
        price: 28000000, price_text: '₹2.8 Cr', price_per_sqft: 7000,
        location: 'Sarjapur', city: 'Bangalore', state: 'Karnataka', pincode: '562125', country: 'India',
        latitude: 12.8679, longitude: 77.7869, address: 'Sarjapur-Attibele Road',
        bedrooms: 4, bathrooms: 4, sqft: 4000, carpet_area: 3200, built_up_area: 4000, plot_size: 2400,
        property_type: 'Sale', category: 'Villa', sub_category: 'Independent Villa',
        furnishing: 'Unfurnished', facing: 'North', ownership: 'Freehold', possession_status: 'Ready to Move', property_age: '1 Year',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Private Garden', 'Car Porch', 'Clubhouse', 'Swimming Pool', 'Gymnasium', 'Jogging Track', '24/7 Security', 'Power Backup', 'Rainwater Harvesting'],
        floors: 3, parking_count: 2,
    },
    // 6. Villa Sale - Pune
    {
        property_id: 'PROP-006', title: '3 BHK Row House in Baner, Pune',
        description: 'Modern 3 BHK row house in Baner with terrace garden and modular kitchen. Part of a premium gated township with excellent schools and hospitals nearby.',
        price: 18500000, price_text: '₹1.85 Cr', price_per_sqft: 6500,
        location: 'Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045', country: 'India',
        latitude: 18.5596, longitude: 73.7789, address: 'Baner-Pashan Link Road',
        bedrooms: 3, bathrooms: 3, sqft: 2850, carpet_area: 2200, built_up_area: 2850, plot_size: 1800,
        property_type: 'Sale', category: 'Villa', sub_category: 'Row House',
        furnishing: 'Semi-Furnished', facing: 'East', ownership: 'Freehold', possession_status: 'Ready to Move', property_age: '3 Years',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Terrace Garden', 'Clubhouse', 'Swimming Pool', 'Gymnasium', 'Children\'s Play Area', 'Jogging Track', '24/7 Security', 'Power Backup'],
        floors: 2, parking_count: 2,
    },
    // 7. Plot Sale - Bangalore
    {
        property_id: 'PROP-007', title: 'Residential Plot in Devanahalli',
        description: 'BMRDA-approved residential plot near Kempegowda International Airport. Excellent investment opportunity with rapid infrastructure development in the area.',
        price: 6000000, price_text: '₹60 L', price_per_sqft: 3000,
        location: 'Devanahalli', city: 'Bangalore', state: 'Karnataka', pincode: '562110', country: 'India',
        latitude: 13.2473, longitude: 77.7120, address: 'Near KIA',
        bedrooms: 0, bathrooms: 0, sqft: 2000, plot_size: 2000,
        property_type: 'Sale', category: 'Plot', sub_category: 'Residential Plot',
        facing: 'North-East', ownership: 'Freehold',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Gated Community', 'Wide Roads', 'Underground Drainage', 'Electricity', 'Water Supply'],
    },
    // 8. Plot Sale - Chennai
    {
        property_id: 'PROP-008', title: 'DTCP Approved Plot in ECR, Chennai',
        description: 'Prime residential plot on East Coast Road with beach proximity. DTCP approved with clear title. Ideal for building your dream beach house.',
        price: 8500000, price_text: '₹85 L', price_per_sqft: 4000,
        location: 'ECR', city: 'Chennai', state: 'Tamil Nadu', pincode: '603104', country: 'India',
        latitude: 12.8352, longitude: 80.2077, address: 'East Coast Road, Thiruvidandhai',
        bedrooms: 0, bathrooms: 0, sqft: 2125, plot_size: 2125,
        property_type: 'Sale', category: 'Plot', sub_category: 'Residential Plot',
        facing: 'East', ownership: 'Freehold',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['DTCP Approved', 'Clear Title', 'Tar Road', 'Electricity', 'Borewell'],
    },
    // 9. Commercial Sale - Bangalore
    {
        property_id: 'PROP-009', title: 'Commercial Office Space in MG Road',
        description: 'Premium Grade-A office space on MG Road with modern fitouts. Corner unit with natural light. Ideal for startups, consultancies, or co-working spaces.',
        price: 22000000, price_text: '₹2.2 Cr', price_per_sqft: 18000,
        location: 'MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India',
        latitude: 12.9758, longitude: 77.6068, address: 'MG Road, Near Trinity Circle',
        bedrooms: 0, bathrooms: 2, sqft: 1200, carpet_area: 1000, built_up_area: 1200,
        property_type: 'Sale', category: 'Commercial', sub_category: 'Office Space',
        furnishing: 'Furnished', facing: 'North', ownership: 'Freehold',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Lift', 'Power Backup', 'Central AC', 'Fire Safety', 'Car Parking', '24/7 Security', 'Cafeteria', 'Conference Room'],
        floor_number: '6', total_floors: '12', parking_count: 2,
    },
    // 10. Commercial Rent - Bangalore
    {
        property_id: 'PROP-010', title: 'Retail Shop for Rent in Koramangala',
        description: 'High-footfall retail space on 80 Feet Road, Koramangala. Ground floor with road-facing glass frontage. Suitable for restaurants, retail stores, or showrooms.',
        price: 150000, price_text: '₹1.5 L/month', deposit_amount: '₹10 Lakhs',
        location: 'Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', country: 'India',
        latitude: 12.9352, longitude: 77.6245, address: '80 Feet Road, Koramangala 4th Block',
        bedrooms: 0, bathrooms: 1, sqft: 800, carpet_area: 750, built_up_area: 800,
        property_type: 'Rent', category: 'Commercial', sub_category: 'Retail Shop',
        furnishing: 'Unfurnished', facing: 'South', ownership: 'Freehold',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Road Facing', 'Power Backup', 'Water Supply', 'Car Parking'],
        floor_number: 'Ground', total_floors: '4',
    },
    // 11. Warehouse Sale - Mumbai
    {
        property_id: 'PROP-011', title: 'Industrial Warehouse in Bhiwandi, Mumbai',
        description: 'Large industrial warehouse with loading dock, high ceiling, and excellent road connectivity. Suitable for logistics, manufacturing, or storage operations.',
        price: 45000000, price_text: '₹4.5 Cr', price_per_sqft: 4500,
        location: 'Bhiwandi', city: 'Mumbai', state: 'Maharashtra', pincode: '421302', country: 'India',
        latitude: 19.2967, longitude: 73.0631, address: 'MIDC Area, Bhiwandi',
        bedrooms: 0, bathrooms: 2, sqft: 10000, built_up_area: 10000,
        property_type: 'Sale', category: 'Commercial', sub_category: 'Warehouse',
        furnishing: 'Unfurnished', facing: 'West', ownership: 'Freehold',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Loading Dock', 'High Ceiling', 'Power Supply', 'Water Supply', 'Security', 'Fire Safety', 'Truck Parking'],
        floors: 1, parking_count: 5,
    },
    // 12. Warehouse Rent - Hyderabad
    {
        property_id: 'PROP-012', title: 'Warehouse for Rent in Shamshabad, Hyderabad',
        description: 'Modern warehouse facility near Rajiv Gandhi International Airport. Suitable for e-commerce fulfillment, cold storage, or general warehousing.',
        price: 200000, price_text: '₹2 L/month', deposit_amount: '₹12 Lakhs',
        location: 'Shamshabad', city: 'Hyderabad', state: 'Telangana', pincode: '501218', country: 'India',
        latitude: 17.2403, longitude: 78.4294, address: 'Near RGIA Airport, Shamshabad',
        bedrooms: 0, bathrooms: 2, sqft: 8000, built_up_area: 8000,
        property_type: 'Rent', category: 'Commercial', sub_category: 'Warehouse',
        furnishing: 'Unfurnished', facing: 'North', ownership: 'Freehold',
        status: 'Active', is_featured: false, is_verified: true,
        images: [
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
        ],
        amenities: ['Loading Bay', 'Power Backup', 'Water Supply', '24/7 Security', 'CCTV', 'Fire Safety', 'Truck Parking', 'Office Space'],
        floors: 1, parking_count: 8,
    },
];

// ─── MAIN EXECUTION ───────────────────────────────────────────────

async function main() {
    console.log('🚀 Starting seed script...\n');

    // Helper: discover valid columns for a table by inserting a minimal row and checking returned keys
    async function getValidColumns(table, minimalRow) {
        const { data, error } = await supabase.from(table).insert(minimalRow).select();
        if (error) {
            console.error(`   Could not discover columns for ${table}:`, error.message);
            return null;
        }
        const cols = new Set(Object.keys(data[0]));
        // Clean up the test row
        await supabase.from(table).delete().eq('id', data[0].id);
        return cols;
    }

    // Helper: filter object to only valid columns
    function filterToValidCols(obj, validCols) {
        const filtered = {};
        for (const key of Object.keys(obj)) {
            if (validCols.has(key)) filtered[key] = obj[key];
        }
        return filtered;
    }

    // Discover valid columns
    console.log('🔍 Discovering table schemas...');

    // Minimal valid row for projects (based on successful insert earlier + likely constraints)
    const projectValidRow = {
        project_id: 'DISCOVER_TMP',
        project_name: 'DISCOVER_TMP',
        status: 'Active',
        property_type: 'Residential', // Use property_type instead of category
        city: 'Bangalore'
    };

    // Minimal valid row for properties (price is NOT NULL, category is checked)
    // Minimal valid row for properties (price is NOT NULL, category is checked)
    const propertyValidRow = {
        property_id: 'DISCOVER_TMP',
        title: 'DISCOVER_TMP',
        status: 'Active',
        price: 1000000,
        category: 'Apartment',
        property_type: 'Sale',
        location: 'Bangalore', // Required
        sqft: 1000,
        bedrooms: 2,
        bathrooms: 2
    };

    const projectCols = await getValidColumns('projects', projectValidRow);
    const propertyCols = await getValidColumns('properties', propertyValidRow);

    if (projectCols) console.log(`   ✓ projects table: ${projectCols.size} columns`);
    if (propertyCols) console.log(`   ✓ properties table: ${propertyCols.size} columns`);

    // 1. Delete existing data
    console.log('\n🗑️  Deleting existing properties...');
    const { error: delPropErr } = await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delPropErr) console.error('Error deleting properties:', delPropErr.message);
    else console.log('   ✓ Properties deleted');

    console.log('🗑️  Deleting existing projects...');
    const { error: delProjErr } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delProjErr) console.error('Error deleting projects:', delProjErr.message);
    else console.log('   ✓ Projects deleted');

    // 2. Insert projects
    console.log('\n📦 Inserting 12 projects...');

    // Helper: Parse "Month YYYY" to "YYYY-MM-DD"
    function parseDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    }

    let projSuccess = 0;
    for (const project of projects) {
        // Map category -> property_type for projects table (schema mismatch adjustment)
        const projectData = { ...project };
        if (projectData.category) {
            projectData.property_type = projectData.category;
        }

        // Fix date format for launch_date (DATE type)
        if (projectData.launch_date) {
            projectData.launch_date = parseDate(projectData.launch_date);
        }

        const row = projectCols ? filterToValidCols(projectData, projectCols) : projectData;

        const { error } = await supabase.from('projects').insert(row);
        if (error) {
            console.log(`   ERROR: Failed: ${project.project_name}: ${error.message}`);
        } else {
            projSuccess++;
            console.log(`   ✓ ${project.project_name} (${projectData.property_type || ''} - ${project.city})`);
        }
    }

    // 3. Insert properties
    console.log('\n🏠 Inserting 12 properties...');
    let propSuccess = 0;
    for (const property of properties) {
        const row = propertyCols ? filterToValidCols(property, propertyCols) : property;
        const { error } = await supabase.from('properties').insert(row);
        if (error) {
            console.error(`   ✗ Failed: ${property.title}: ${error.message}`);
        } else {
            propSuccess++;
            console.log(`   ✓ ${property.title} (${property.category || ''} - ${property.property_type})`);
        }
    }

    console.log('\n✅ Seed script completed!');
    console.log(`   Projects: ${projSuccess}/${projects.length}`);
    console.log(`   Properties: ${propSuccess}/${properties.length}`);
    console.log('\n📌 Note: Brochure URLs are set to null. Upload PDFs to Supabase storage');
    console.log('   and update brochure_url for each project manually or via a separate script.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
