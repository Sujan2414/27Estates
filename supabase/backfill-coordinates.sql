-- Backfill latitude/longitude for properties and projects based on location names
-- Run this in Supabase SQL Editor to populate coordinates for map markers

-- ============================================
-- PROPERTIES - Update coordinates by location
-- ============================================

-- North Bangalore
UPDATE properties SET latitude = 13.2473, longitude = 77.7137 WHERE LOWER(location) = 'devanahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 13.2300, longitude = 77.7100 WHERE LOWER(location) = 'devanhalli road' AND latitude IS NULL;
UPDATE properties SET latitude = 13.1550, longitude = 77.6820 WHERE LOWER(location) = 'bagalur' AND latitude IS NULL;
UPDATE properties SET latitude = 13.1007, longitude = 77.5963 WHERE LOWER(location) = 'yelahanka' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0720, longitude = 77.6085 WHERE LOWER(location) = 'jakkur' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0640, longitude = 77.6370 WHERE LOWER(location) = 'thanisandra' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0640, longitude = 77.6370 WHERE LOWER(location) = 'thanisandra main road' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0358, longitude = 77.5970 WHERE LOWER(location) = 'hebbal' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0600, longitude = 77.5950 WHERE LOWER(location) = 'sahakarnagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0450, longitude = 77.6400 WHERE LOWER(location) = 'hennur' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0450, longitude = 77.6400 WHERE LOWER(location) = 'hennur road' AND latitude IS NULL;
UPDATE properties SET latitude = 13.1700, longitude = 77.5560 WHERE LOWER(location) = 'rajankunte' AND latitude IS NULL;
UPDATE properties SET latitude = 13.1700, longitude = 77.5560 WHERE LOWER(location) = 'rajanukunte' AND latitude IS NULL;
UPDATE properties SET latitude = 13.2940, longitude = 77.5380 WHERE LOWER(location) = 'doddaballapur' AND latitude IS NULL;
UPDATE properties SET latitude = 13.2500, longitude = 77.5400 WHERE LOWER(location) = 'doddaballapur road' AND latitude IS NULL;
UPDATE properties SET latitude = 13.1450, longitude = 77.6700 WHERE LOWER(location) = 'kodigehaali' AND latitude IS NULL;
UPDATE properties SET latitude = 13.1100, longitude = 77.6600 WHERE LOWER(location) = 'chikkagubbi' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0800, longitude = 77.5600 WHERE LOWER(location) = 'vidyaranyapura' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0450, longitude = 77.5130 WHERE LOWER(location) = 'dasarahalli' AND latitude IS NULL;

-- East Bangalore
UPDATE properties SET latitude = 12.9698, longitude = 77.7500 WHERE LOWER(location) = 'whitefield' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9698, longitude = 77.7500 WHERE LOWER(location) = 'whitefield main road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9650, longitude = 77.7570 WHERE LOWER(location) = 'siddapura' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9591, longitude = 77.6974 WHERE LOWER(location) = 'marathahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9900, longitude = 77.6850 WHERE LOWER(location) = 'mahadevapura' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0070, longitude = 77.6960 WHERE LOWER(location) = 'kr puram' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0200, longitude = 77.7300 WHERE LOWER(location) = 'budigere' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0200, longitude = 77.7300 WHERE LOWER(location) = 'budigere cross' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9410, longitude = 77.7440 WHERE LOWER(location) = 'varthur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9500, longitude = 77.7300 WHERE LOWER(location) = 'varthur road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9880, longitude = 77.7620 WHERE LOWER(location) = 'kadugodi' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0690, longitude = 77.7980 WHERE LOWER(location) = 'hoskote' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9920, longitude = 77.7150 WHERE LOWER(location) = 'hoodi' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9700, longitude = 77.7200 WHERE LOWER(location) = 'brookefield' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9854, longitude = 77.7280 WHERE LOWER(location) = 'itpl' AND latitude IS NULL;

-- South Bangalore
UPDATE properties SET latitude = 12.9352, longitude = 77.6245 WHERE LOWER(location) = 'koramangala' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9380, longitude = 77.6260 WHERE LOWER(location) = 'koramangala 1st block' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9340, longitude = 77.6230 WHERE LOWER(location) LIKE 'koramangala 3rd block%' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9116, longitude = 77.6389 WHERE LOWER(location) = 'hsr layout' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9166, longitude = 77.6101 WHERE LOWER(location) = 'btm layout' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8890, longitude = 77.5970 WHERE LOWER(location) = 'bannerghatta road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8890, longitude = 77.5970 WHERE LOWER(location) = 'bannerghatta' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9063, longitude = 77.5857 WHERE LOWER(location) = 'jp nagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9250, longitude = 77.5838 WHERE LOWER(location) = 'jayanagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9260, longitude = 77.5830 WHERE LOWER(location) LIKE 'jayanagar 4th block%' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9400, longitude = 77.5740 WHERE LOWER(location) = 'basavanagudi' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8800, longitude = 77.5650 WHERE LOWER(location) = 'kanakapura road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8730, longitude = 77.6260 WHERE LOWER(location) = 'begur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8730, longitude = 77.6260 WHERE LOWER(location) = 'begur road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8440, longitude = 77.6710 WHERE LOWER(location) = 'electronic city' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8900, longitude = 77.6350 WHERE LOWER(location) = 'hosur road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9000, longitude = 77.6800 WHERE LOWER(location) = 'hosa road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9010, longitude = 77.6180 WHERE LOWER(location) = 'bommanahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8770, longitude = 77.6010 WHERE LOWER(location) = 'hulimavu' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8940, longitude = 77.5470 WHERE LOWER(location) = 'uttarahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8900, longitude = 77.6500 WHERE LOWER(location) = 'kudlu gate' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8020, longitude = 77.7070 WHERE LOWER(location) = 'chandapura' AND latitude IS NULL;
UPDATE properties SET latitude = 12.7110, longitude = 77.6960 WHERE LOWER(location) = 'anekal' AND latitude IS NULL;
UPDATE properties SET latitude = 12.7780, longitude = 77.7670 WHERE LOWER(location) = 'attibele' AND latitude IS NULL;

-- West Bangalore
UPDATE properties SET latitude = 12.9900, longitude = 77.5550 WHERE LOWER(location) = 'rajajinagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0030, longitude = 77.5700 WHERE LOWER(location) = 'malleswaram' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0230, longitude = 77.5500 WHERE LOWER(location) = 'yeshwantpur' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0300, longitude = 77.5200 WHERE LOWER(location) = 'peenya' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9600, longitude = 77.5100 WHERE LOWER(location) = 'nagarbhavi' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9700, longitude = 77.5300 WHERE LOWER(location) = 'vijayanagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9080, longitude = 77.4850 WHERE LOWER(location) = 'kengeri' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9400, longitude = 77.5100 WHERE LOWER(location) = 'mysore road' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0500, longitude = 77.5200 WHERE LOWER(location) = 'tumkur road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9600, longitude = 77.5000 WHERE LOWER(location) = 'magadi road' AND latitude IS NULL;

-- Central Bangalore
UPDATE properties SET latitude = 12.9784, longitude = 77.6408 WHERE LOWER(location) = 'indiranagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9784, longitude = 77.6408 WHERE LOWER(location) = 'indiranagar ii stage' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9756, longitude = 77.6066 WHERE LOWER(location) = 'mg road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9730, longitude = 77.6060 WHERE LOWER(location) = 'brunton road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9716, longitude = 77.6070 WHERE LOWER(location) = 'brigade road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9700, longitude = 77.5980 WHERE LOWER(location) = 'st. marks road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9810, longitude = 77.6200 WHERE LOWER(location) = 'ulsoor' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9900, longitude = 77.5900 WHERE LOWER(location) = 'cunningham road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9500, longitude = 77.5900 WHERE LOWER(location) = 'langford town' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9680, longitude = 77.5960 WHERE LOWER(location) = 'lavelle road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9620, longitude = 77.5980 WHERE LOWER(location) = 'richmond road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9857, longitude = 77.6050 WHERE LOWER(location) = 'shivajinagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9950, longitude = 77.6150 WHERE LOWER(location) = 'frazer town' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9930, longitude = 77.6200 WHERE LOWER(location) = 'cox town' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9920, longitude = 77.5910 WHERE LOWER(location) = 'vasanth nagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0050, longitude = 77.5780 WHERE LOWER(location) = 'sadashivanagar' AND latitude IS NULL;

-- Southeast
UPDATE properties SET latitude = 12.9100, longitude = 77.6800 WHERE LOWER(location) = 'sarjapur road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8600, longitude = 77.7870 WHERE LOWER(location) = 'sarjapur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9260, longitude = 77.6730 WHERE LOWER(location) = 'bellandur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9150, longitude = 77.6720 WHERE LOWER(location) = 'haralur road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8780, longitude = 77.7200 WHERE LOWER(location) = 'kodathi' AND latitude IS NULL;
UPDATE properties SET latitude = 12.8930, longitude = 77.7350 WHERE LOWER(location) = 'dommasandra' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9200, longitude = 77.6700 WHERE LOWER(location) = 'somasundarapalya' AND latitude IS NULL;

-- Other areas
UPDATE properties SET latitude = 13.3702, longitude = 77.6835 WHERE LOWER(location) = 'nandi hills' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9790, longitude = 77.5720 WHERE LOWER(location) = 'binny pete' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9880, longitude = 77.5380 WHERE LOWER(location) = 'basaveshwaranagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9250, longitude = 77.5460 WHERE LOWER(location) = 'banashankari' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9330, longitude = 77.5480 WHERE LOWER(location) = 'girinagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0100, longitude = 77.5700 WHERE LOWER(location) = 'dollars colony' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0200, longitude = 77.5950 WHERE LOWER(location) = 'rt nagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0180, longitude = 77.6100 WHERE LOWER(location) = 'lingarajapuram' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0100, longitude = 77.6350 WHERE LOWER(location) = 'banaswadi' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0250, longitude = 77.6380 WHERE LOWER(location) = 'kalyan nagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0100, longitude = 77.6680 WHERE LOWER(location) = 'ramamurthy nagar' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9600, longitude = 77.6500 WHERE LOWER(location) = 'old airport road' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9610, longitude = 77.6380 WHERE LOWER(location) = 'domlur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9580, longitude = 77.6680 WHERE LOWER(location) = 'hal' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9620, longitude = 77.6700 WHERE LOWER(location) = 'yemlur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9850, longitude = 77.6600 WHERE LOWER(location) = 'cv raman nagar' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0000, longitude = 77.6700 WHERE LOWER(location) = 'old madras road' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0050, longitude = 77.6000 WHERE LOWER(location) = 'benson town' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0000, longitude = 77.6100 WHERE LOWER(location) = 'cooke town' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0150, longitude = 77.6450 WHERE LOWER(location) = 'kammanahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0150, longitude = 77.6350 WHERE LOWER(location) = 'hrbr layout' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0440, longitude = 77.6200 WHERE LOWER(location) = 'nagavara' AND latitude IS NULL;
UPDATE properties SET latitude = 13.0900, longitude = 77.5950 WHERE LOWER(location) = 'kogilu' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9150, longitude = 77.6770 WHERE LOWER(location) = 'kaikondrahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9000, longitude = 77.7100 WHERE LOWER(location) = 'carmelaram' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9060, longitude = 77.6870 WHERE LOWER(location) = 'kasavanahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9400, longitude = 77.7200 WHERE LOWER(location) = 'panathur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9290, longitude = 77.7350 WHERE LOWER(location) = 'gunjur' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9380, longitude = 77.7100 WHERE LOWER(location) = 'devarabisanahalli' AND latitude IS NULL;
UPDATE properties SET latitude = 12.9540, longitude = 77.7200 WHERE LOWER(location) = 'thubarahalli' AND latitude IS NULL;


-- ============================================
-- PROJECTS - Same coordinate updates
-- ============================================

UPDATE projects SET latitude = 13.2473, longitude = 77.7137 WHERE LOWER(location) = 'devanahalli' AND latitude IS NULL;
UPDATE projects SET latitude = 13.2300, longitude = 77.7100 WHERE LOWER(location) = 'devanhalli road' AND latitude IS NULL;
UPDATE projects SET latitude = 13.1550, longitude = 77.6820 WHERE LOWER(location) = 'bagalur' AND latitude IS NULL;
UPDATE projects SET latitude = 13.1007, longitude = 77.5963 WHERE LOWER(location) = 'yelahanka' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0720, longitude = 77.6085 WHERE LOWER(location) = 'jakkur' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0640, longitude = 77.6370 WHERE LOWER(location) = 'thanisandra' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0640, longitude = 77.6370 WHERE LOWER(location) = 'thanisandra main road' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0358, longitude = 77.5970 WHERE LOWER(location) = 'hebbal' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0600, longitude = 77.5950 WHERE LOWER(location) = 'sahakarnagar' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0450, longitude = 77.6400 WHERE LOWER(location) = 'hennur' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0450, longitude = 77.6400 WHERE LOWER(location) = 'hennur road' AND latitude IS NULL;
UPDATE projects SET latitude = 13.1700, longitude = 77.5560 WHERE LOWER(location) = 'rajankunte' AND latitude IS NULL;
UPDATE projects SET latitude = 13.1700, longitude = 77.5560 WHERE LOWER(location) = 'rajanukunte' AND latitude IS NULL;
UPDATE projects SET latitude = 13.2940, longitude = 77.5380 WHERE LOWER(location) = 'doddaballapur' AND latitude IS NULL;
UPDATE projects SET latitude = 13.2500, longitude = 77.5400 WHERE LOWER(location) = 'doddaballapur road' AND latitude IS NULL;
UPDATE projects SET latitude = 13.1450, longitude = 77.6700 WHERE LOWER(location) = 'kodigehaali' AND latitude IS NULL;
UPDATE projects SET latitude = 13.1100, longitude = 77.6600 WHERE LOWER(location) = 'chikkagubbi' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9698, longitude = 77.7500 WHERE LOWER(location) = 'whitefield' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9698, longitude = 77.7500 WHERE LOWER(location) = 'whitefield main road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9650, longitude = 77.7570 WHERE LOWER(location) = 'siddapura' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9591, longitude = 77.6974 WHERE LOWER(location) = 'marathahalli' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9900, longitude = 77.6850 WHERE LOWER(location) = 'mahadevapura' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0070, longitude = 77.6960 WHERE LOWER(location) = 'kr puram' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0200, longitude = 77.7300 WHERE LOWER(location) = 'budigere' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0200, longitude = 77.7300 WHERE LOWER(location) = 'budigere cross' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9410, longitude = 77.7440 WHERE LOWER(location) = 'varthur' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9500, longitude = 77.7300 WHERE LOWER(location) = 'varthur road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9920, longitude = 77.7150 WHERE LOWER(location) = 'hoodi' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9700, longitude = 77.7200 WHERE LOWER(location) = 'brookefield' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9352, longitude = 77.6245 WHERE LOWER(location) = 'koramangala' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9116, longitude = 77.6389 WHERE LOWER(location) = 'hsr layout' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9166, longitude = 77.6101 WHERE LOWER(location) = 'btm layout' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8890, longitude = 77.5970 WHERE LOWER(location) = 'bannerghatta road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8890, longitude = 77.5970 WHERE LOWER(location) = 'bannerghatta' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9063, longitude = 77.5857 WHERE LOWER(location) = 'jp nagar' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9250, longitude = 77.5838 WHERE LOWER(location) = 'jayanagar' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8800, longitude = 77.5650 WHERE LOWER(location) = 'kanakapura road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8440, longitude = 77.6710 WHERE LOWER(location) = 'electronic city' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8900, longitude = 77.6350 WHERE LOWER(location) = 'hosur road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9000, longitude = 77.6800 WHERE LOWER(location) = 'hosa road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9100, longitude = 77.6800 WHERE LOWER(location) = 'sarjapur road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8600, longitude = 77.7870 WHERE LOWER(location) = 'sarjapur' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9260, longitude = 77.6730 WHERE LOWER(location) = 'bellandur' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9784, longitude = 77.6408 WHERE LOWER(location) = 'indiranagar' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9756, longitude = 77.6066 WHERE LOWER(location) = 'mg road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9730, longitude = 77.6060 WHERE LOWER(location) = 'brunton road' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9810, longitude = 77.6200 WHERE LOWER(location) = 'ulsoor' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9900, longitude = 77.5550 WHERE LOWER(location) = 'rajajinagar' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0030, longitude = 77.5700 WHERE LOWER(location) = 'malleswaram' AND latitude IS NULL;
UPDATE projects SET latitude = 13.0230, longitude = 77.5500 WHERE LOWER(location) = 'yeshwantpur' AND latitude IS NULL;
UPDATE projects SET latitude = 13.3702, longitude = 77.6835 WHERE LOWER(location) = 'nandi hills' AND latitude IS NULL;
UPDATE projects SET latitude = 12.8930, longitude = 77.7350 WHERE LOWER(location) = 'dommasandra' AND latitude IS NULL;
UPDATE projects SET latitude = 12.9000, longitude = 77.7100 WHERE LOWER(location) = 'carmelaram' AND latitude IS NULL;

-- Verify results
SELECT 'Properties with coordinates' as label, COUNT(*) as count FROM properties WHERE latitude IS NOT NULL;
SELECT 'Properties without coordinates' as label, COUNT(*) as count FROM properties WHERE latitude IS NULL;
SELECT 'Projects with coordinates' as label, COUNT(*) as count FROM projects WHERE latitude IS NOT NULL;
SELECT 'Projects without coordinates' as label, COUNT(*) as count FROM projects WHERE latitude IS NULL;

-- Show any remaining unmatched locations
SELECT DISTINCT location FROM properties WHERE latitude IS NULL ORDER BY location;
SELECT DISTINCT location FROM projects WHERE latitude IS NULL ORDER BY location;
