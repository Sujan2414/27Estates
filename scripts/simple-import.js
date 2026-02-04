/**
 * Simplified B2B Bricks Data Importer for 27 Estates
 * Skips HTML content that causes SQL issues
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Mock images
const MOCK_PROJECT_IMAGES = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800'
];

const MOCK_PROPERTY_IMAGES = {
    'Apartment': [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    'Villa': [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    'Commercial': [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
    ],
    'Plot': [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800'
    ]
};

function escapeSQL(str) {
    if (!str) return null;
    // Remove all HTML tags
    let clean = str.replace(/<[^>]*>/g, ' ');
    // Escape single quotes
    clean = clean.replace(/'/g, "''");
    // Remove problematic characters
    clean = clean.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    // Truncate very long strings
    if (clean.length > 2000) {
        clean = clean.substring(0, 2000) + '...';
    }
    return clean;
}

function parsePrice(priceText) {
    if (!priceText) return 0;
    const cleanPrice = priceText.replace(/[₹,\s]/g, '');
    if (cleanPrice.includes('Cr')) return parseFloat(cleanPrice.replace('Cr', '')) * 10000000;
    if (cleanPrice.includes('Lac') || cleanPrice.includes('Lakh')) return parseFloat(cleanPrice.replace(/Lac|Lakh/g, '')) * 100000;
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

// Main
const dataDir = path.join(__dirname, '..', 'Data');
const supabaseDir = path.join(__dirname, '..', 'supabase');

// Read Properties
const propertiesWorkbook = XLSX.readFile(path.join(dataDir, 'Properties.xlsx'));
const propertiesData = XLSX.utils.sheet_to_json(propertiesWorkbook.Sheets[propertiesWorkbook.SheetNames[0]]);

// Read Projects
const projectsWorkbook = XLSX.readFile(path.join(dataDir, 'Projects.xlsx'));
const projectsData = XLSX.utils.sheet_to_json(projectsWorkbook.Sheets[projectsWorkbook.SheetNames[0]]);

console.log(`Processing ${propertiesData.length} properties and ${projectsData.length} projects...`);

// Transform Projects
const projectInserts = [];
projectsData.forEach((proj, i) => {
    if (!proj.ProjectName) return;

    const projectId = proj.ProjectNumber || `PROJ-27E-${String(i + 1).padStart(4, '0')}`;
    const projectName = escapeSQL(proj.ProjectName);
    const description = escapeSQL(proj.Description);
    const minPrice = parsePrice(proj.MinPriceText);
    const maxPrice = parsePrice(proj.MaxPriceText);

    projectInserts.push(`INSERT INTO projects (
    project_id, project_name, title, description,
    developer_name, address, location, city, pincode,
    min_price, max_price, min_price_numeric, max_price_numeric,
    min_area, max_area, transaction_type, status, possession_date,
    images, is_featured, is_rera_approved
) VALUES (
    '${projectId}',
    '${projectName}',
    ${description ? `'${projectName}'` : 'NULL'},
    ${description ? `'${description}'` : 'NULL'},
    ${proj.DeveloperName ? `'${escapeSQL(proj.DeveloperName)}'` : 'NULL'},
    ${proj.AddressName ? `'${escapeSQL(proj.AddressName)}'` : 'NULL'},
    '${escapeSQL(proj.LocationName) || 'Bangalore'}',
    '${escapeSQL(proj.CityName) || 'Bangalore'}',
    ${proj.PinCode ? `'${proj.PinCode}'` : 'NULL'},
    ${proj.MinPriceText ? `'${escapeSQL(proj.MinPriceText)}'` : 'NULL'},
    ${proj.MaxPriceText ? `'${escapeSQL(proj.MaxPriceText)}'` : 'NULL'},
    ${minPrice || 'NULL'},
    ${maxPrice || 'NULL'},
    ${parseFloat(proj.MinArea) || 'NULL'},
    ${parseFloat(proj.MaxArea) || 'NULL'},
    ${proj.TransactionName ? `'${escapeSQL(proj.TransactionName)}'` : 'NULL'},
    'Available',
    ${proj.PossessionName ? `'${escapeSQL(proj.PossessionName)}'` : 'NULL'},
    ARRAY['${MOCK_PROJECT_IMAGES.join("', '")}'],
    ${maxPrice > 30000000 ? 'TRUE' : 'FALSE'},
    ${proj.ReraNumber ? 'TRUE' : 'FALSE'}
);`);
});

// Transform Properties
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
    ${prop.AddressName ? `'${escapeSQL(prop.AddressName)}'` : 'NULL'},
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

// Write simplified batch files
const batchSize = 30;

// Projects
for (let i = 0; i < Math.ceil(projectInserts.length / batchSize); i++) {
    const batch = projectInserts.slice(i * batchSize, (i + 1) * batchSize);
    const content = `-- PROJECTS BATCH ${i + 1}\n${batch.join('\n\n')}\n\nSELECT 'Projects batch ${i + 1} complete' as message;`;
    fs.writeFileSync(path.join(supabaseDir, `import-projects-${i + 1}.sql`), content);
}

// Properties
for (let i = 0; i < Math.ceil(propertyInserts.length / batchSize); i++) {
    const batch = propertyInserts.slice(i * batchSize, (i + 1) * batchSize);
    const content = `-- PROPERTIES BATCH ${i + 1}\n${batch.join('\n\n')}\n\nSELECT 'Properties batch ${i + 1} complete' as message;`;
    fs.writeFileSync(path.join(supabaseDir, `import-properties-${i + 1}.sql`), content);
}

console.log(`\n✅ Created SQL files:`);
console.log(`   ${Math.ceil(projectInserts.length / batchSize)} project batch files (import-projects-*.sql)`);
console.log(`   ${Math.ceil(propertyInserts.length / batchSize)} property batch files (import-properties-*.sql)`);
console.log('\nRun them in Supabase SQL Editor: projects first, then properties.');
