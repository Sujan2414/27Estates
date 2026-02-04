/**
 * Split Import Script - Creates smaller SQL files for Supabase
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'supabase');
const sqlContent = fs.readFileSync(path.join(dataDir, 'real-data-import.sql'), 'utf8');

// Find the separator between projects and properties
const projectsMarker = '-- PROJECTS DATA';
const propertiesMarker = '-- PROPERTIES DATA';

// Extract header
const headerEnd = sqlContent.indexOf(projectsMarker);
const header = sqlContent.substring(0, headerEnd);

// Extract projects section
const projectsStart = sqlContent.indexOf(projectsMarker);
const projectsEnd = sqlContent.indexOf(propertiesMarker);
const projectsSection = sqlContent.substring(projectsStart, projectsEnd);

// Extract properties section
const propertiesStart = sqlContent.indexOf(propertiesMarker);
const updateStart = sqlContent.indexOf('-- UPDATE COUNTS');
const propertiesSection = sqlContent.substring(propertiesStart, updateStart !== -1 ? updateStart : sqlContent.length);

// Split projects into batches of ~50
const projectInserts = projectsSection.match(/INSERT INTO projects[\s\S]*?\);/g) || [];
const propertyInserts = propertiesSection.match(/INSERT INTO properties[\s\S]*?\);/g) || [];

console.log(`Found ${projectInserts.length} project inserts`);
console.log(`Found ${propertyInserts.length} property inserts`);

// Create batch files
const batchSize = 50;

// Batch 1: First 50 projects
const batch1 = `-- BATCH 1: Projects 1-50
${projectInserts.slice(0, 50).join('\n\n')}

SELECT 'Batch 1 complete: 50 projects' as message;
`;
fs.writeFileSync(path.join(dataDir, 'import-batch-1.sql'), batch1);

// Batch 2: Projects 51-100
const batch2 = `-- BATCH 2: Projects 51-100
${projectInserts.slice(50, 100).join('\n\n')}

SELECT 'Batch 2 complete: projects 51-100' as message;
`;
fs.writeFileSync(path.join(dataDir, 'import-batch-2.sql'), batch2);

// Batch 3: Projects 101-150
const batch3 = `-- BATCH 3: Projects 101-150
${projectInserts.slice(100, 150).join('\n\n')}

SELECT 'Batch 3 complete: projects 101-150' as message;
`;
fs.writeFileSync(path.join(dataDir, 'import-batch-3.sql'), batch3);

// Batch 4: Remaining projects (151-185)
const batch4 = `-- BATCH 4: Remaining Projects (151+)
${projectInserts.slice(150).join('\n\n')}

SELECT 'Batch 4 complete: remaining projects' as message;
`;
fs.writeFileSync(path.join(dataDir, 'import-batch-4.sql'), batch4);

// Batch 5: First 60 properties
const batch5 = `-- BATCH 5: Properties 1-60
${propertyInserts.slice(0, 60).join('\n\n')}

SELECT 'Batch 5 complete: 60 properties' as message;
`;
fs.writeFileSync(path.join(dataDir, 'import-batch-5.sql'), batch5);

// Batch 6: Remaining properties (61-111)
const batch6 = `-- BATCH 6: Remaining Properties (61+)
${propertyInserts.slice(60).join('\n\n')}

SELECT 'Batch 6 complete: remaining properties' as message;
SELECT 
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM properties) as total_properties;
`;
fs.writeFileSync(path.join(dataDir, 'import-batch-6.sql'), batch6);

console.log('\n✅ Created 6 batch files:');
console.log('  import-batch-1.sql (Projects 1-50)');
console.log('  import-batch-2.sql (Projects 51-100)');
console.log('  import-batch-3.sql (Projects 101-150)');
console.log('  import-batch-4.sql (Projects 151+)');
console.log('  import-batch-5.sql (Properties 1-60)');
console.log('  import-batch-6.sql (Properties 61+)');
console.log('\nRun them in order in Supabase SQL Editor');
