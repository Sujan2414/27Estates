// Bangalore area name → [latitude, longitude] lookup
// Coordinates are approximate center points for each neighborhood/area

const BANGALORE_COORDINATES: Record<string, [number, number]> = {
    // North Bangalore
    "Devanahalli": [13.2473, 77.7137],
    "Devanhalli Road": [13.2300, 77.7100],
    "Bagalur": [13.1550, 77.6820],
    "Yelahanka": [13.1007, 77.5963],
    "Jakkur": [13.0720, 77.6085],
    "Thanisandra": [13.0640, 77.6370],
    "Thanisandra main road": [13.0640, 77.6370],
    "Hebbal": [13.0358, 77.5970],
    "Sahakarnagar": [13.0600, 77.5950],
    "Hennur": [13.0450, 77.6400],
    "Hennur Road": [13.0450, 77.6400],
    "Rajankunte": [13.1700, 77.5560],
    "Doddaballapur": [13.2940, 77.5380],
    "Doddaballapur road": [13.2500, 77.5400],
    "Kodigehaali": [13.1450, 77.6700],
    "Chikkagubbi": [13.1100, 77.6600],
    "Vidyaranyapura": [13.0800, 77.5600],
    "Dasarahalli": [13.0450, 77.5130],
    "Rajanukunte": [13.1700, 77.5560],

    // East Bangalore
    "Whitefield": [12.9698, 77.7500],
    "Whitefield main road": [12.9698, 77.7500],
    "Siddapura": [12.9650, 77.7570],
    "Marathahalli": [12.9591, 77.6974],
    "Mahadevapura": [12.9900, 77.6850],
    "KR Puram": [13.0070, 77.6960],
    "Budigere": [13.0200, 77.7300],
    "Budigere Cross": [13.0200, 77.7300],
    "Varthur": [12.9410, 77.7440],
    "Varthur Road": [12.9500, 77.7300],
    "Kadugodi": [12.9880, 77.7620],
    "Hoskote": [13.0690, 77.7980],
    "Hoodi": [12.9920, 77.7150],
    "Brookefield": [12.9700, 77.7200],
    "ITPL": [12.9854, 77.7280],

    // South Bangalore
    "Koramangala": [12.9352, 77.6245],
    "Koramangala 1st block": [12.9380, 77.6260],
    "Koramangala 3rd block Koramangala": [12.9340, 77.6230],
    "HSR Layout": [12.9116, 77.6389],
    "Hsr layout": [12.9116, 77.6389],
    "BTM Layout": [12.9166, 77.6101],
    "Btm layout": [12.9166, 77.6101],
    "Bannerghatta Road": [12.8890, 77.5970],
    "Bannerghatta": [12.8890, 77.5970],
    "JP Nagar": [12.9063, 77.5857],
    "Jayanagar": [12.9250, 77.5838],
    "Jayanagar 4th block Jayanagar": [12.9260, 77.5830],
    "Basavanagudi": [12.9400, 77.5740],
    "Kanakapura Road": [12.8800, 77.5650],
    "Kanakapura road": [12.8800, 77.5650],
    "Begur": [12.8730, 77.6260],
    "Begur Road": [12.8730, 77.6260],
    "Electronic City": [12.8440, 77.6710],
    "Hosur Road": [12.8900, 77.6350],
    "Hosa road": [12.9000, 77.6800],
    "Hosa Road": [12.9000, 77.6800],
    "Bommanahalli": [12.9010, 77.6180],
    "Hulimavu": [12.8770, 77.6010],
    "Uttarahalli": [12.8940, 77.5470],
    "Kudlu Gate": [12.8900, 77.6500],
    "Chandapura": [12.8020, 77.7070],
    "Anekal": [12.7110, 77.6960],
    "Attibele": [12.7780, 77.7670],

    // West Bangalore
    "Rajajinagar": [12.9900, 77.5550],
    "Malleswaram": [13.0030, 77.5700],
    "Yeshwantpur": [13.0230, 77.5500],
    "Peenya": [13.0300, 77.5200],
    "Nagarbhavi": [12.9600, 77.5100],
    "Vijayanagar": [12.9700, 77.5300],
    "Kengeri": [12.9080, 77.4850],
    "Mysore Road": [12.9400, 77.5100],
    "Tumkur Road": [13.0500, 77.5200],
    "Magadi Road": [12.9600, 77.5000],

    // Central Bangalore
    "Indiranagar": [12.9784, 77.6408],
    "Indiranagar II Stage": [12.9784, 77.6408],
    "MG Road": [12.9756, 77.6066],
    "Brunton Road": [12.9730, 77.6060],
    "Brigade Road": [12.9716, 77.6070],
    "St. Marks Road": [12.9700, 77.5980],
    "Ulsoor": [12.9810, 77.6200],
    "Cunningham Road": [12.9900, 77.5900],
    "Langford Town": [12.9500, 77.5900],
    "Lavelle Road": [12.9680, 77.5960],
    "Richmond Road": [12.9620, 77.5980],
    "Shivajinagar": [12.9857, 77.6050],
    "Frazer Town": [12.9950, 77.6150],
    "Cox Town": [12.9930, 77.6200],
    "Vasanth Nagar": [12.9920, 77.5910],
    "Sadashivanagar": [13.0050, 77.5780],

    // Southeast
    "Sarjapur Road": [12.9100, 77.6800],
    "Sarjapur": [12.8600, 77.7870],
    "Bellandur": [12.9260, 77.6730],
    "Haralur Road": [12.9150, 77.6720],
    "Kodathi": [12.8780, 77.7200],
    "Dommasandra": [12.8930, 77.7350],
    "Somasundarapalya": [12.9200, 77.6700],

    // Nandi Hills / Far North
    "Nandi Hills": [13.3702, 77.6835],

    // Other areas from imports
    "Binny Pete": [12.9790, 77.5720],
    "Basaveshwaranagar": [12.9880, 77.5380],
    "Banashankari": [12.9250, 77.5460],
    "Girinagar": [12.9330, 77.5480],
    "Dollars Colony": [13.0100, 77.5700],
    "RT Nagar": [13.0200, 77.5950],
    "Lingarajapuram": [13.0180, 77.6100],
    "Banaswadi": [13.0100, 77.6350],
    "Kalyan Nagar": [13.0250, 77.6380],
    "Ramamurthy Nagar": [13.0100, 77.6680],
    "Old Airport Road": [12.9600, 77.6500],
    "Domlur": [12.9610, 77.6380],
    "HAL": [12.9580, 77.6680],
    "Yemlur": [12.9620, 77.6700],
    "CV Raman Nagar": [12.9850, 77.6600],
    "Old Madras Road": [13.0000, 77.6700],
    "Benson Town": [13.0050, 77.6000],
    "Cooke Town": [13.0000, 77.6100],
    "Kammanahalli": [13.0150, 77.6450],
    "HRBR Layout": [13.0150, 77.6350],
    "Nagavara": [13.0440, 77.6200],
    "Kogilu": [13.0900, 77.5950],
    "Kaikondrahalli": [12.9150, 77.6770],
    "Carmelaram": [12.9000, 77.7100],
    "Kasavanahalli": [12.9060, 77.6870],
    "Panathur": [12.9400, 77.7200],
    "Gunjur": [12.9290, 77.7350],
    "Devarabisanahalli": [12.9380, 77.7100],
    "Thubarahalli": [12.9540, 77.7200],

    // Fallback zones
    "Bangalore North": [13.0800, 77.5800],
    "Bangalore South": [12.8900, 77.5900],
    "Bangalore East": [12.9700, 77.7200],
    "Bangalore Central": [12.9760, 77.5950],
    "Bangalore(All)": [12.9716, 77.5946],
    "others/Bangalore Central": [12.9760, 77.5950],
    "Others/Bangalore North": [13.0800, 77.5800],
};

/**
 * Look up coordinates for a Bangalore area name.
 * Tries exact match first, then case-insensitive, then partial match.
 * Returns [latitude, longitude] or null if not found.
 */
export function getCoordinatesForLocation(location: string | null | undefined): [number, number] | null {
    if (!location) return null;

    const trimmed = location.trim();

    // Exact match
    if (BANGALORE_COORDINATES[trimmed]) {
        return BANGALORE_COORDINATES[trimmed];
    }

    // Case-insensitive match
    const lowerLocation = trimmed.toLowerCase();
    for (const [key, coords] of Object.entries(BANGALORE_COORDINATES)) {
        if (key.toLowerCase() === lowerLocation) {
            return coords;
        }
    }

    // Partial match — check if location contains or is contained by a known area
    for (const [key, coords] of Object.entries(BANGALORE_COORDINATES)) {
        if (
            lowerLocation.includes(key.toLowerCase()) ||
            key.toLowerCase().includes(lowerLocation)
        ) {
            return coords;
        }
    }

    return null;
}

export default BANGALORE_COORDINATES;
