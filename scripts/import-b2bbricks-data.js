/**
 * B2B Bricks Data Importer for 27 Estates
 * Converts Excel data to Supabase SQL inserts
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Mock images for properties without real images
const MOCK_PROPERTY_IMAGES = {
    'Apartment': [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    'Villa': [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    'Row Villa': [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800'
    ],
    'Bungalow': [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    'Commercial': [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800'
    ],
    'Plot': [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800',
        'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=800'
    ]
};

const MOCK_PROJECT_IMAGES = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
];

// Helper functions
function escapeSQL(str) {
    if (!str) return null;
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function parsePrice(priceText) {
    if (!priceText) return 0;

    const cleanPrice = priceText.replace(/[₹,\s]/g, '');

    if (cleanPrice.includes('Cr')) {
        const num = parseFloat(cleanPrice.replace('Cr', ''));
        return num * 10000000; // 1 Crore = 10,000,000
    } else if (cleanPrice.includes('Lac') || cleanPrice.includes('Lakh')) {
        const num = parseFloat(cleanPrice.replace(/Lac|Lakh/g, ''));
        return num * 100000; // 1 Lakh = 100,000
    } else if (cleanPrice.includes('Th')) {
        const num = parseFloat(cleanPrice.replace('Th', ''));
        return num * 1000; // 1 Thousand
    }

    return parseFloat(cleanPrice) || 0;
}

function parseSqft(areaText) {
    if (!areaText) return 0;
    const match = areaText.match(/[\d,.]+/);
    if (match) {
        return Math.round(parseFloat(match[0].replace(',', '')));
    }
    return 0;
}

function mapPropertyCategory(typeName) {
    if (!typeName) return 'Apartment';

    const type = typeName.toLowerCase();

    if (type.includes('apartment')) return 'Apartment';
    if (type.includes('villa')) return 'Villa';
    if (type.includes('row villa')) return 'Row Villa';
    if (type.includes('bungalow')) return 'Bungalow';
    if (type.includes('commercial') || type.includes('office')) return 'Commercial';
    if (type.includes('plot') || type.includes('land')) return 'Plot';
    if (type.includes('farmhouse') || type.includes('farm')) return 'Farmhouse';
    if (type.includes('penthouse')) return 'Penthouse';
    if (type.includes('studio')) return 'Studio';

    return 'Apartment';
}

function getPropertyType(leaseSale) {
    if (!leaseSale) return 'Sale';
    const type = leaseSale.toLowerCase();
    return type.includes('rent') || type.includes('lease') ? 'Rent' : 'Sale';
}

function getImagesForCategory(category) {
    const images = MOCK_PROPERTY_IMAGES[category] || MOCK_PROPERTY_IMAGES['Apartment'];
    return images;
}

function generatePropertyId(refNumber, index) {
    if (refNumber && refNumber.trim()) {
        return refNumber.trim();
    }
    return `PROP-27E-${String(index + 1).padStart(4, '0')}`;
}

function generateProjectId(projectNumber, index) {
    if (projectNumber && projectNumber.trim()) {
        return projectNumber.trim();
    }
    return `PROJ-27E-${String(index + 1).padStart(4, '0')}`;
}

function buildAmenities(property) {
    const amenities = {};

    if (property.Balcony === 'Yes' || property.Balcony > 0) amenities.balcony = true;
    if (property.CCTV === 'Yes') amenities.cctv = true;
    if (property.Club === 'Yes') amenities.club = true;
    if (property.Garden === 'Yes') amenities.garden = true;
    if (property.Gym === 'Yes') amenities.gym = true;
    if (property.Intercom === 'Yes') amenities.intercom = true;
    if (property.Lift === 'Yes') amenities.lift = true;
    if (property.PowerBackup === 'Yes') amenities.power_backup = true;
    if (property.Security === 'Yes') amenities.security = true;
    if (property.SwimmingPool === 'Yes') amenities.swimming_pool = true;
    if (property.Terrace === 'Yes') amenities.terrace = true;
    if (property.RainWaterHaresting === 'Yes') amenities.rainwater_harvesting = true;

    return Object.keys(amenities).length > 0 ? amenities : null;
}

// Main transformation functions
function transformProperties(propertiesData) {
    console.log(`\nTransforming ${propertiesData.length} properties...`);

    const sqlStatements = [];
    let validCount = 0;

    propertiesData.forEach((prop, index) => {
        try {
            const propertyId = generatePropertyId(prop.RefNumber, index);
            const title = escapeSQL(prop.Title) || `Property in ${prop.LocationName || 'Bangalore'}`;
            const description = escapeSQL(prop.Description);
            const category = mapPropertyCategory(prop.PropertyTypeName);
            const propertyType = getPropertyType(prop.Lease_Sale);

            const price = parsePrice(prop.ExpectedPrice);
            const sqft = parseSqft(prop.SuperAreaName) || parseSqft(prop.BuiltAreaName) || 1000;
            const carpetArea = parseSqft(prop.CarpetAreaName);
            const builtUpArea = parseSqft(prop.BuiltAreaName);

            const bedrooms = parseInt(prop.TotalRoom) || 0;
            const bathrooms = parseInt(prop.TotalBathRoom) || Math.ceil(bedrooms / 2) || 1;
            const parking = parseInt(prop.ParkingDetails) || 0;

            const images = getImagesForCategory(category);
            const amenities = buildAmenities(prop);

            const sql = `
INSERT INTO properties (
    property_id, title, description,
    price, price_text, price_per_sqft, deposit_amount, maintenance_charges,
    location, address, city, street, landmark, flat_no, building_name, floor_number, total_floors,
    bedrooms, bathrooms, sqft, carpet_area, built_up_area, total_rooms, parking_count,
    property_type, category, sub_category,
    furnishing, facing, ownership, transaction_type,
    project_name, owner_name, owner_phone, owner_email,
    status, is_featured,
    images, amenities, ref_number, source
) VALUES (
    '${propertyId}',
    '${title}',
    ${description ? `'${description}'` : 'NULL'},
    ${price || 0},
    ${prop.ExpectedPrice ? `'${escapeSQL(prop.ExpectedPrice)}'` : 'NULL'},
    ${parseFloat(prop.PricePerUnitArea) || 0},
    ${prop.DepositePrice ? `'${escapeSQL(prop.DepositePrice)}'` : 'NULL'},
    ${prop.MaintainCharges ? `'${escapeSQL(prop.MaintainCharges)}'` : 'NULL'},
    '${escapeSQL(prop.LocationName) || 'Bangalore'}',
    ${prop.AddressName ? `'${escapeSQL(prop.AddressName)}'` : 'NULL'},
    '${escapeSQL(prop.CityName) || 'Bangalore'}',
    ${prop.Street ? `'${escapeSQL(prop.Street)}'` : 'NULL'},
    ${prop.Landmark ? `'${escapeSQL(prop.Landmark)}'` : 'NULL'},
    ${prop.FlatNo ? `'${escapeSQL(prop.FlatNo)}'` : 'NULL'},
    ${prop.BuildingName ? `'${escapeSQL(prop.BuildingName)}'` : 'NULL'},
    ${prop.FloorNumber ? `'${escapeSQL(prop.FloorNumber)}'` : 'NULL'},
    ${prop.TotalFloor ? `'${escapeSQL(prop.TotalFloor)}'` : 'NULL'},
    ${bedrooms},
    ${bathrooms},
    ${sqft},
    ${carpetArea || 'NULL'},
    ${builtUpArea || 'NULL'},
    ${prop.TotalRoom ? parseFloat(prop.TotalRoom) : 'NULL'},
    ${parking || 'NULL'},
    '${propertyType}',
    '${category}',
    ${prop.PropertyTypeName ? `'${escapeSQL(prop.PropertyTypeName)}'` : 'NULL'},
    ${prop.FurnishingName ? `'${escapeSQL(prop.FurnishingName)}'` : 'NULL'},
    ${prop.FacingText ? `'${escapeSQL(prop.FacingText)}'` : 'NULL'},
    ${prop.OwnershipName ? `'${escapeSQL(prop.OwnershipName)}'` : 'NULL'},
    ${prop.TransactionName ? `'${escapeSQL(prop.TransactionName)}'` : 'NULL'},
    ${prop.PropertyName ? `'${escapeSQL(prop.PropertyName)}'` : 'NULL'},
    ${prop.CustomerFullName ? `'${escapeSQL(prop.CustomerFullName)}'` : 'NULL'},
    ${prop.CustomerMobile ? `'${escapeSQL(prop.CustomerMobile)}'` : 'NULL'},
    ${prop.CustomerEmail ? `'${escapeSQL(prop.CustomerEmail)}'` : 'NULL'},
    '${prop.Status || 'Available'}',
    ${price > 20000000 ? 'TRUE' : 'FALSE'},
    ARRAY[${images.map(img => `'${img}'`).join(', ')}],
    ${amenities ? `'${JSON.stringify(amenities)}'::jsonb` : 'NULL'},
    ${prop.RefNumber ? `'${escapeSQL(prop.RefNumber)}'` : 'NULL'},
    'B2B Bricks'
);`;

            sqlStatements.push(sql);
            validCount++;
        } catch (error) {
            console.error(`Error processing property ${index}:`, error.message);
        }
    });

    console.log(`✅ Transformed ${validCount} properties`);
    return sqlStatements;
}

function transformProjects(projectsData) {
    console.log(`\nTransforming ${projectsData.length} projects...`);

    const sqlStatements = [];
    let validCount = 0;

    projectsData.forEach((proj, index) => {
        try {
            if (!proj.ProjectName || proj.ProjectName.trim() === '') {
                return; // Skip projects without names
            }

            const projectId = generateProjectId(proj.ProjectNumber, index);
            const projectName = escapeSQL(proj.ProjectName);
            const title = escapeSQL(proj.Title) || projectName;
            const description = escapeSQL(proj.Description);
            const specifications = escapeSQL(proj.Specifications);

            const minPrice = parsePrice(proj.MinPriceText);
            const maxPrice = parsePrice(proj.MaxPriceText);

            const images = MOCK_PROJECT_IMAGES;

            const sql = `
INSERT INTO projects (
    project_id, project_name, title, description, specifications, rera_number,
    developer_name,
    address, location, city, landmark, pincode,
    min_price, max_price, min_price_numeric, max_price_numeric,
    min_area, max_area,
    transaction_type, status, possession_date,
    employee_name, employee_phone, employee_email,
    images,
    is_featured, is_rera_approved
) VALUES (
    '${projectId}',
    '${projectName}',
    ${title ? `'${title}'` : 'NULL'},
    ${description ? `'${description}'` : 'NULL'},
    ${specifications ? `'${specifications}'` : 'NULL'},
    ${proj.ReraNumber ? `'${escapeSQL(proj.ReraNumber)}'` : 'NULL'},
    ${proj.DeveloperName ? `'${escapeSQL(proj.DeveloperName)}'` : 'NULL'},
    ${proj.AddressName ? `'${escapeSQL(proj.AddressName)}'` : 'NULL'},
    '${escapeSQL(proj.LocationName) || 'Bangalore'}',
    '${escapeSQL(proj.CityName) || 'Bangalore'}',
    ${proj.LandMark ? `'${escapeSQL(proj.LandMark)}'` : 'NULL'},
    ${proj.PinCode ? `'${escapeSQL(proj.PinCode)}'` : 'NULL'},
    ${proj.MinPriceText ? `'${escapeSQL(proj.MinPriceText)}'` : 'NULL'},
    ${proj.MaxPriceText ? `'${escapeSQL(proj.MaxPriceText)}'` : 'NULL'},
    ${minPrice || 'NULL'},
    ${maxPrice || 'NULL'},
    ${parseFloat(proj.MinArea) || 'NULL'},
    ${parseFloat(proj.MaxArea) || 'NULL'},
    ${proj.TransactionName ? `'${escapeSQL(proj.TransactionName)}'` : 'NULL'},
    '${proj.StatusName || 'Available'}',
    ${proj.PossessionName ? `'${escapeSQL(proj.PossessionName)}'` : 'NULL'},
    ${proj.EmployeeName ? `'${escapeSQL(proj.EmployeeName)}'` : 'NULL'},
    ${proj.EmployeeMobile ? `'${escapeSQL(proj.EmployeeMobile)}'` : 'NULL'},
    ${proj.EmployeeEmail ? `'${escapeSQL(proj.EmployeeEmail)}'` : 'NULL'},
    ARRAY[${images.map(img => `'${img}'`).join(', ')}],
    ${maxPrice > 30000000 ? 'TRUE' : 'FALSE'},
    ${proj.ReraNumber ? 'TRUE' : 'FALSE'}
);`;

            sqlStatements.push(sql);
            validCount++;
        } catch (error) {
            console.error(`Error processing project ${index}:`, error.message);
        }
    });

    console.log(`✅ Transformed ${validCount} projects`);
    return sqlStatements;
}

// Main execution
function main() {
    console.log('🚀 27 Estates B2B Bricks Data Importer\n');
    console.log('='.repeat(50));

    const dataDir = path.join(__dirname, '..', 'Data');

    // Read Properties
    const propertiesFile = path.join(dataDir, 'Properties.xlsx');
    const propertiesWorkbook = XLSX.readFile(propertiesFile);
    const propertiesSheet = propertiesWorkbook.Sheets[propertiesWorkbook.SheetNames[0]];
    const propertiesData = XLSX.utils.sheet_to_json(propertiesSheet);

    // Read Projects
    const projectsFile = path.join(dataDir, 'Projects.xlsx');
    const projectsWorkbook = XLSX.readFile(projectsFile);
    const projectsSheet = projectsWorkbook.Sheets[projectsWorkbook.SheetNames[0]];
    const projectsData = XLSX.utils.sheet_to_json(projectsSheet);

    console.log(`📊 Found ${propertiesData.length} properties`);
    console.log(`📊 Found ${projectsData.length} projects`);

    // Transform data
    const propertySQL = transformProperties(propertiesData);
    const projectSQL = transformProjects(projectsData);

    // Generate SQL file
    const sqlContent = `-- =====================================================
-- 27 ESTATES REAL DATA IMPORT
-- Generated from B2B Bricks export
-- Generated at: ${new Date().toISOString()}
-- =====================================================

-- Clear existing mock data (optional - comment out if you want to keep)
-- TRUNCATE properties CASCADE;
-- TRUNCATE projects CASCADE;

-- =====================================================
-- PROJECTS DATA (${projectSQL.length} records)
-- =====================================================
${projectSQL.join('\n')}

-- =====================================================
-- PROPERTIES DATA (${propertySQL.length} records)
-- =====================================================
${propertySQL.join('\n')}

-- =====================================================
-- UPDATE COUNTS
-- =====================================================
SELECT 'Import completed!' as message;
SELECT 
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM properties) as total_properties;
`;

    // Save SQL file
    const outputPath = path.join(__dirname, '..', 'supabase', 'real-data-import.sql');
    fs.writeFileSync(outputPath, sqlContent);
    console.log(`\n✅ SQL file generated: ${outputPath}`);

    // Generate summary
    const summary = {
        properties: {
            total: propertiesData.length,
            forSale: propertiesData.filter(p => p.Lease_Sale === 'Sale').length,
            forRent: propertiesData.filter(p => p.Lease_Sale === 'Rent').length,
            categories: [...new Set(propertiesData.map(p => mapPropertyCategory(p.PropertyTypeName)))]
        },
        projects: {
            total: projectsData.filter(p => p.ProjectName).length,
            developers: [...new Set(projectsData.filter(p => p.DeveloperName).map(p => p.DeveloperName))].slice(0, 10),
            locations: [...new Set(projectsData.map(p => p.CityName).filter(Boolean))]
        }
    };

    console.log('\n📋 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Properties: ${summary.properties.total}`);
    console.log(`  - For Sale: ${summary.properties.forSale}`);
    console.log(`  - For Rent: ${summary.properties.forRent}`);
    console.log(`  - Categories: ${summary.properties.categories.join(', ')}`);
    console.log(`\nProjects: ${summary.projects.total}`);
    console.log(`  - Top Developers: ${summary.projects.developers.slice(0, 5).join(', ')}`);
    console.log(`  - Locations: ${summary.projects.locations.join(', ')}`);

    // Save summary
    fs.writeFileSync(
        path.join(dataDir, 'import-summary.json'),
        JSON.stringify(summary, null, 2)
    );

    console.log('\n🎉 DONE! Next steps:');
    console.log('1. Run schema-v2.sql in Supabase SQL Editor (if not already)');
    console.log('2. Run real-data-import.sql to import all data');
}

main();
