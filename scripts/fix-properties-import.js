
const fs = require('fs');
const path = require('path');

const MOCK_PROPERTY_IMAGES = {
    'Apartment': ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    'Villa': ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
    'Commercial': ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    'Plot': ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    'Bungalow': ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800']
};

function escapeSQL(str) {
    if (!str) return null;
    let clean = str.replace(/<[^>]*>/g, ' ');
    clean = clean.replace(/'/g, "''");
    clean = clean.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length > 1500) clean = clean.substring(0, 1500) + '...';
    return clean;
}

function escapeJSON(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ').trim();
}

function parsePrice(priceText) {
    if (!priceText) return 0;
    const cleanPrice = String(priceText).replace(/[₹,\s]/g, '');
    if (cleanPrice.includes('Cr')) return parseFloat(cleanPrice.replace('Cr', '')) * 10000000;
    if (cleanPrice.includes('Lac') || cleanPrice.includes('Lakh')) return parseFloat(cleanPrice.replace(/Lac|Lakh/g, '')) * 100000;
    if (cleanPrice.includes('Th')) return parseFloat(cleanPrice.replace('Th', '')) * 1000;
    return parseFloat(cleanPrice) || 0;
}

function mapCategory(typeName) {
    if (!typeName) return 'Apartment';
    const type = typeName.toLowerCase();
    if (type.includes('villa')) return 'Villa';
    if (type.includes('bungalow')) return 'Bungalow';
    if (type.includes('commercial') || type.includes('office')) return 'Commercial';
    if (type.includes('plot') || type.includes('land')) return 'Plot';
    return 'Apartment';
}

function getPropertyType(leaseSale) {
    if (!leaseSale) return 'Sale';
    return leaseSale.toLowerCase().includes('rent') ? 'Rent' : 'Sale';
}

const dataDir = path.join(__dirname, '..', 'Data');
const supabaseDir = path.join(__dirname, '..', 'supabase');

// Read from JSON instead of Excel for reliability
const propertiesFile = path.join(dataDir, 'properties.json');
console.log('Reading properties from:', propertiesFile);
const propertiesData = JSON.parse(fs.readFileSync(propertiesFile, 'utf8'));

console.log(`Processing ${propertiesData.length} properties with proper address handling...`);

const propertyInserts = [];
propertiesData.forEach((prop, i) => {
    const propertyId = prop.RefNumber || `PROP-27E-${String(i + 1).padStart(4, '0')}`;
    const title = escapeSQL(prop.Title) || `Property in ${prop.LocationName || 'Bangalore'}`;
    const description = escapeSQL(prop.Description);
    const category = mapCategory(prop.PropertyTypeName);
    const propertyType = getPropertyType(prop.Lease_Sale);
    const price = parsePrice(prop.ExpectedPrice);
    const sqft = parseInt(prop.SuperAreaName) || parseInt(prop.BuiltAreaName) || 1000;
    const bedrooms = parseInt(prop.TotalRoom) || 0;
    const bathrooms = parseInt(prop.TotalBathRoom) || Math.ceil(bedrooms / 2) || 1;
    const images = MOCK_PROPERTY_IMAGES[category] || MOCK_PROPERTY_IMAGES['Apartment'];

    // Build proper JSONB address object
    const addressObj = {
        full: escapeJSON(prop.AddressName) || '',
        area: escapeJSON(prop.LocationName) || '',
        city: escapeJSON(prop.CityName) || 'Bangalore',
        landmark: escapeJSON(prop.Landmark) || '',
        street: escapeJSON(prop.Street) || '',
        building: escapeJSON(prop.BuildingName) || '',
        flat: escapeJSON(prop.FlatNo) || ''
    };
    const addressJSON = JSON.stringify(addressObj).replace(/'/g, "''");

    propertyInserts.push(`INSERT INTO properties (
    property_id, title, description, price, price_text,
    location, address, city,
    bedrooms, bathrooms, sqft,
    property_type, category, sub_category,
    furnishing, project_name,
    status, is_featured, images, ref_number, source
) VALUES (
    '${propertyId}',
    '${title}',
    ${description ? `'${description}'` : 'NULL'},
    ${price || 0},
    ${prop.ExpectedPrice ? `'${escapeSQL(prop.ExpectedPrice)}'` : 'NULL'},
    '${escapeSQL(prop.LocationName) || 'Bangalore'}',
    '${addressJSON}'::jsonb,
    '${escapeSQL(prop.CityName) || 'Bangalore'}',
    ${bedrooms},
    ${bathrooms},
    ${sqft},
    '${propertyType}',
    '${category}',
    ${prop.PropertyTypeName ? `'${escapeSQL(prop.PropertyTypeName)}'` : 'NULL'},
    ${prop.FurnishingName ? `'${escapeSQL(prop.FurnishingName)}'` : 'NULL'},
    ${prop.PropertyName ? `'${escapeSQL(prop.PropertyName)}'` : 'NULL'},
    'Available',
    ${price > 20000000 ? 'TRUE' : 'FALSE'},
    ARRAY['${images.join("', '")}'],
    ${prop.RefNumber ? `'${escapeSQL(prop.RefNumber)}'` : 'NULL'},
    'B2B Bricks'
);`);
});

// Write batch files
const batchSize = 30;
for (let i = 0; i < Math.ceil(propertyInserts.length / batchSize); i++) {
    const batch = propertyInserts.slice(i * batchSize, (i + 1) * batchSize);
    const content = `-- PROPERTIES BATCH ${i + 1} (with address)\n${batch.join('\n\n')}\n\nSELECT 'Properties batch ${i + 1} complete' as message;`;
    fs.writeFileSync(path.join(supabaseDir, `import-properties-${i + 1}.sql`), content);
}

console.log(`\n✅ Created ${Math.ceil(propertyInserts.length / batchSize)} property batch files with proper address data`);
