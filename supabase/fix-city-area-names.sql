-- ============================================================
-- Fix area names mistakenly stored in the city column
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. DIAGNOSTIC: See what city values exist and how many records each has
SELECT city, COUNT(*) AS count
FROM projects
WHERE city IS NOT NULL
GROUP BY city
ORDER BY count DESC;

-- 2. DIAGNOSTIC: Same for properties table
SELECT city, COUNT(*) AS count
FROM properties
WHERE city IS NOT NULL
GROUP BY city
ORDER BY count DESC;

-- ============================================================
-- 3. Fix PROJECTS table — map known area/locality names to
--    their correct parent city
-- ============================================================

-- Mumbai area fixes
UPDATE projects SET city = 'Mumbai'
WHERE city IN (
    'Andheri', 'Bandra', 'Juhu', 'Powai', 'Malad', 'Borivali',
    'Kandivali', 'Goregaon', 'Santacruz', 'Kurla', 'Dadar',
    'Worli', 'Lower Parel', 'Prabhadevi', 'Khar', 'Vile Parle',
    'Ghatkopar', 'Mulund', 'Vikhroli', 'Chembur', 'Colaba',
    'Byculla', 'Matunga', 'Sion', 'Dharavi', 'Govandi',
    'Mankhurd', 'Andheri West', 'Andheri East', 'Bandra West',
    'Bandra East', 'Juhu Beach', 'Versova', 'Oshiwara',
    'Malvani', 'Dahisar', 'Mira Road', 'Bhayander'
);

-- Pune area fixes
UPDATE projects SET city = 'Pune'
WHERE city IN (
    'Wakad', 'Hinjewadi', 'Baner', 'Aundh', 'Kothrud',
    'Hadapsar', 'Kharadi', 'Viman Nagar', 'Koregaon Park',
    'Magarpatta', 'Pimple Saudagar', 'Pimple Nilakh',
    'Pimple Gurav', 'Wagholi', 'Undri', 'Kondhwa',
    'Katraj', 'Pimpri', 'Chinchwad', 'Nigdi', 'Akurdi',
    'Talegaon', 'Bavdhan', 'Warje', 'Kalyani Nagar',
    'Wanowrie', 'Shivajinagar', 'Deccan', 'FC Road',
    'Camp', 'Koregaon Park Annexe', 'Mundhwa'
);

-- Bangalore area fixes
UPDATE projects SET city = 'Bangalore'
WHERE city IN (
    'Whitefield', 'Koramangala', 'Indiranagar', 'Jayanagar',
    'JP Nagar', 'BTM Layout', 'Electronic City', 'Marathahalli',
    'Hebbal', 'Sarjapur', 'Bellandur', 'HSR Layout',
    'Bannerghatta', 'Yelahanka', 'Devanahalli', 'Kengeri',
    'Rajajinagar', 'Malleshwaram', 'Sadashivanagar',
    'Benson Town', 'Frazer Town', 'Ulsoor', 'Shivajinagar',
    'Banashankari', 'Vijayanagar', 'Magadi Road',
    'KR Puram', 'Brookefield', 'Varthur', 'Panathur',
    'Outer Ring Road', 'Old Airport Road'
);

-- Hyderabad area fixes
UPDATE projects SET city = 'Hyderabad'
WHERE city IN (
    'Gachibowli', 'HITEC City', 'Madhapur', 'Kondapur',
    'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Miyapur',
    'Secunderabad', 'Ameerpet', 'Dilsukhnagar', 'LB Nagar',
    'Uppal', 'Nacharam', 'Kompally', 'Shamshabad',
    'Manikonda', 'Kokapet', 'Narsingi', 'Puppalaguda',
    'Tellapur', 'Nallagandla', 'Serilingampally', 'Lingampally',
    'Bachupally', 'Nizampet', 'Pragathi Nagar'
);

-- Chennai area fixes
UPDATE projects SET city = 'Chennai'
WHERE city IN (
    'Adyar', 'Velachery', 'OMR', 'Perungudi', 'Thoraipakkam',
    'Sholinganallur', 'Perambur', 'Anna Nagar', 'T Nagar',
    'Nungambakkam', 'Mylapore', 'Alwarpet', 'Egmore',
    'Porur', 'Mogappair', 'Ambattur', 'Avadi',
    'Tambaram', 'Chromepet', 'Pallavaram', 'Guindy',
    'Saidapet', 'Kodambakkam', 'Vadapalani', 'Virugambakkam',
    'Ashok Nagar', 'KK Nagar', 'Koyambedu', 'Poonamallee'
);

-- Delhi / NCR area fixes
UPDATE projects SET city = 'Delhi'
WHERE city IN (
    'Dwarka', 'Rohini', 'Pitampura', 'Janakpuri', 'Patel Nagar',
    'Karol Bagh', 'Connaught Place', 'Lajpat Nagar',
    'Greater Kailash', 'Vasant Kunj', 'Saket', 'Malviya Nagar',
    'Hauz Khas', 'Vasant Vihar', 'Chanakyapuri', 'Preet Vihar',
    'Mayur Vihar', 'Laxmi Nagar', 'Shahdara', 'Dilshad Garden',
    'Vikaspuri', 'Uttam Nagar', 'Najafgarh'
);

-- Gurgaon area fixes
UPDATE projects SET city = 'Gurgaon'
WHERE city IN (
    'Sector 1', 'Sector 2', 'Sector 14', 'Sector 15', 'Sector 21',
    'Sector 29', 'Sector 30', 'Sector 31', 'Sector 43', 'Sector 49',
    'Sector 50', 'Sector 56', 'Sector 57', 'Sector 58', 'Sector 62',
    'Sector 65', 'Sector 67', 'Sector 70', 'Sector 72',
    'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4',
    'DLF Phase 5', 'Golf Course Road', 'Sohna Road', 'Manesar',
    'Palam Vihar', 'New Colony', 'Sheetla Colony', 'Udyog Vihar'
);

-- Noida area fixes
UPDATE projects SET city = 'Noida'
WHERE city IN (
    'Sector 18', 'Sector 27', 'Sector 44', 'Sector 45', 'Sector 50',
    'Sector 51', 'Sector 62', 'Sector 63', 'Sector 75', 'Sector 76',
    'Sector 77', 'Sector 78', 'Sector 100', 'Sector 107',
    'Sector 110', 'Sector 119', 'Sector 120', 'Sector 121',
    'Sector 128', 'Sector 129', 'Sector 130', 'Sector 131',
    'Sector 132', 'Sector 133', 'Sector 134', 'Sector 135',
    'Sector 136', 'Sector 137', 'Sector 143', 'Sector 150',
    'Sector 152', 'Greater Noida', 'Greater Noida West',
    'Noida Extension', 'Techzone', 'Techzone 4', 'Techzone 1'
);

-- ============================================================
-- 3b. Fix directional city variants for PROJECTS
--     e.g. "North Mumbai" / "Mumbai North" → "Mumbai"
-- ============================================================

UPDATE projects SET city = 'Mumbai'
WHERE city ILIKE '%mumbai%'
  AND city NOT IN ('Mumbai', 'Navi Mumbai');

UPDATE projects SET city = 'Delhi'
WHERE city ILIKE '%delhi%'
  AND city NOT IN ('Delhi', 'New Delhi');

UPDATE projects SET city = 'Bangalore'
WHERE city ILIKE '%bangalore%' OR city ILIKE '%bengaluru%'
  AND city NOT IN ('Bangalore', 'Bengaluru');

UPDATE projects SET city = 'Hyderabad'
WHERE city ILIKE '%hyderabad%'
  AND city NOT IN ('Hyderabad', 'Secunderabad');

UPDATE projects SET city = 'Chennai'
WHERE city ILIKE '%chennai%'
  AND city NOT IN ('Chennai');

UPDATE projects SET city = 'Pune'
WHERE city ILIKE '%pune%'
  AND city NOT IN ('Pune');

UPDATE projects SET city = 'Kolkata'
WHERE city ILIKE '%kolkata%' OR city ILIKE '%calcutta%'
  AND city NOT IN ('Kolkata');

-- ============================================================
-- 4. Fix PROPERTIES table — same mapping
-- ============================================================

UPDATE properties SET city = 'Mumbai'
WHERE city IN (
    'Andheri', 'Bandra', 'Juhu', 'Powai', 'Malad', 'Borivali',
    'Kandivali', 'Goregaon', 'Santacruz', 'Kurla', 'Dadar',
    'Worli', 'Lower Parel', 'Prabhadevi', 'Khar', 'Vile Parle',
    'Ghatkopar', 'Mulund', 'Vikhroli', 'Chembur', 'Colaba',
    'Byculla', 'Matunga', 'Sion', 'Dharavi', 'Govandi',
    'Mankhurd', 'Andheri West', 'Andheri East', 'Bandra West',
    'Bandra East', 'Juhu Beach', 'Versova', 'Oshiwara',
    'Malvani', 'Dahisar', 'Mira Road', 'Bhayander'
);

UPDATE properties SET city = 'Pune'
WHERE city IN (
    'Wakad', 'Hinjewadi', 'Baner', 'Aundh', 'Kothrud',
    'Hadapsar', 'Kharadi', 'Viman Nagar', 'Koregaon Park',
    'Magarpatta', 'Pimple Saudagar', 'Pimple Nilakh',
    'Pimple Gurav', 'Wagholi', 'Undri', 'Kondhwa',
    'Katraj', 'Pimpri', 'Chinchwad', 'Nigdi', 'Akurdi',
    'Talegaon', 'Bavdhan', 'Warje', 'Kalyani Nagar',
    'Wanowrie', 'Shivajinagar', 'Deccan', 'FC Road',
    'Camp', 'Koregaon Park Annexe', 'Mundhwa'
);

UPDATE properties SET city = 'Bangalore'
WHERE city IN (
    'Whitefield', 'Koramangala', 'Indiranagar', 'Jayanagar',
    'JP Nagar', 'BTM Layout', 'Electronic City', 'Marathahalli',
    'Hebbal', 'Sarjapur', 'Bellandur', 'HSR Layout',
    'Bannerghatta', 'Yelahanka', 'Devanahalli', 'Kengeri',
    'Rajajinagar', 'Malleshwaram', 'Sadashivanagar',
    'Benson Town', 'Frazer Town', 'Ulsoor', 'Shivajinagar',
    'Banashankari', 'Vijayanagar', 'Magadi Road',
    'KR Puram', 'Brookefield', 'Varthur', 'Panathur',
    'Outer Ring Road', 'Old Airport Road'
);

UPDATE properties SET city = 'Hyderabad'
WHERE city IN (
    'Gachibowli', 'HITEC City', 'Madhapur', 'Kondapur',
    'Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Miyapur',
    'Secunderabad', 'Ameerpet', 'Dilsukhnagar', 'LB Nagar',
    'Uppal', 'Nacharam', 'Kompally', 'Shamshabad',
    'Manikonda', 'Kokapet', 'Narsingi', 'Puppalaguda',
    'Tellapur', 'Nallagandla', 'Serilingampally', 'Lingampally',
    'Bachupally', 'Nizampet', 'Pragathi Nagar'
);

UPDATE properties SET city = 'Chennai'
WHERE city IN (
    'Adyar', 'Velachery', 'OMR', 'Perungudi', 'Thoraipakkam',
    'Sholinganallur', 'Perambur', 'Anna Nagar', 'T Nagar',
    'Nungambakkam', 'Mylapore', 'Alwarpet', 'Egmore',
    'Porur', 'Mogappair', 'Ambattur', 'Avadi',
    'Tambaram', 'Chromepet', 'Pallavaram', 'Guindy',
    'Saidapet', 'Kodambakkam', 'Vadapalani', 'Virugambakkam',
    'Ashok Nagar', 'KK Nagar', 'Koyambedu', 'Poonamallee'
);

UPDATE properties SET city = 'Delhi'
WHERE city IN (
    'Dwarka', 'Rohini', 'Pitampura', 'Janakpuri', 'Patel Nagar',
    'Karol Bagh', 'Connaught Place', 'Lajpat Nagar',
    'Greater Kailash', 'Vasant Kunj', 'Saket', 'Malviya Nagar',
    'Hauz Khas', 'Vasant Vihar', 'Chanakyapuri', 'Preet Vihar',
    'Mayur Vihar', 'Laxmi Nagar', 'Shahdara', 'Dilshad Garden',
    'Vikaspuri', 'Uttam Nagar', 'Najafgarh'
);

UPDATE properties SET city = 'Gurgaon'
WHERE city IN (
    'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4',
    'DLF Phase 5', 'Golf Course Road', 'Sohna Road', 'Manesar',
    'Palam Vihar', 'Udyog Vihar'
);

UPDATE properties SET city = 'Noida'
WHERE city IN (
    'Greater Noida', 'Greater Noida West', 'Noida Extension',
    'Techzone', 'Techzone 4', 'Techzone 1'
);

-- ============================================================
-- 4b. Fix directional city variants for PROPERTIES
-- ============================================================

UPDATE properties SET city = 'Mumbai'
WHERE city ILIKE '%mumbai%'
  AND city NOT IN ('Mumbai', 'Navi Mumbai');

UPDATE properties SET city = 'Delhi'
WHERE city ILIKE '%delhi%'
  AND city NOT IN ('Delhi', 'New Delhi');

UPDATE properties SET city = 'Bangalore'
WHERE city ILIKE '%bangalore%' OR city ILIKE '%bengaluru%'
  AND city NOT IN ('Bangalore', 'Bengaluru');

UPDATE properties SET city = 'Hyderabad'
WHERE city ILIKE '%hyderabad%'
  AND city NOT IN ('Hyderabad', 'Secunderabad');

UPDATE properties SET city = 'Chennai'
WHERE city ILIKE '%chennai%'
  AND city NOT IN ('Chennai');

UPDATE properties SET city = 'Pune'
WHERE city ILIKE '%pune%'
  AND city NOT IN ('Pune');

UPDATE properties SET city = 'Kolkata'
WHERE city ILIKE '%kolkata%' OR city ILIKE '%calcutta%'
  AND city NOT IN ('Kolkata');

-- ============================================================
-- 5. VERIFY — after running above, check what city values remain
-- ============================================================
SELECT 'projects' AS tbl, city, COUNT(*) AS count
FROM projects WHERE city IS NOT NULL
GROUP BY city
ORDER BY count DESC

UNION ALL

SELECT 'properties' AS tbl, city, COUNT(*) AS count
FROM properties WHERE city IS NOT NULL
GROUP BY city
ORDER BY count DESC;
