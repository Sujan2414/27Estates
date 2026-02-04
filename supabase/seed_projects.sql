-- 1. Enable RLS on projects table (good practice)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Allow public read access (so users can see projects without logging in)
CREATE POLICY "Public profiles are viewable by everyone" ON projects
FOR SELECT USING (true);

-- 3. Allow authenticated users (admins) to insert/update ( Adjust based on your auth needs)
CREATE POLICY "Admins can insert projects" ON projects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update projects" ON projects
FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Insert a Dummy Project (Prestige Evergreen)
INSERT INTO projects (
    project_id,
    project_name,
    status,
    min_price,
    max_price,
    min_area,
    max_area,
    bhk_options,
    location,
    city,
    possession_date,
    is_rera_approved,
    rera_number,
    description,
    towers_data,
    project_plan,
    images
) VALUES (
    'PROJ-001',
    'Prestige Evergreen',
    'Upcoming',
    '92.26 Lac',
    '3.51 Cr',
    659,
    2513,
    ARRAY['1 BHK', '2 BHK', '3 BHK', '4 BHK'],
    'Whitefield Main Road',
    'Bangalore',
    'Dec 2030',
    true,
    'PRM/KA/RERA/1251/446/PR/010126/008374',
    'Prestige Evergreen offers luxury apartments with world-class amenities in the heart of Whitefield.',
    '[
        {"name": "Tower 1", "completion_date": "31-Dec-2030"},
        {"name": "Tower 2", "completion_date": "31-Dec-2030"},
        {"name": "Tower 3", "completion_date": "31-Dec-2030"}
    ]'::jsonb,
    '[
        {"tower": "Tower 1", "type": "Residential Apartment", "bhk": 1, "area": "659.00 Sq.Ft.", "price_rate": "14000.00", "basic_price": "92.26 Lac"},
        {"tower": "Tower 2", "type": "Residential Apartment", "bhk": 2, "area": "1504.00 Sq.Ft.", "price_rate": "14000.00", "basic_price": "2.10 Cr"},
        {"tower": "Tower 5", "type": "Residential Apartment", "bhk": 4, "area": "2513.00 Sq.Ft.", "price_rate": "14000.00", "basic_price": "3.51 Cr"}
    ]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80']
);
