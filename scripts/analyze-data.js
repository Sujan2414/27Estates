const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Read Excel files
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

console.log('=== PROPERTIES ANALYSIS ===');
console.log('Total Properties:', propertiesData.length);
console.log('Sample Property (first):', JSON.stringify(propertiesData[0], null, 2));
console.log('\nProperty Columns:', Object.keys(propertiesData[0] || {}));

console.log('\n=== PROJECTS ANALYSIS ===');
console.log('Total Projects:', projectsData.length);
console.log('Sample Project (first):', JSON.stringify(projectsData[0], null, 2));
console.log('\nProject Columns:', Object.keys(projectsData[0] || {}));

// Save as JSON for easier viewing
fs.writeFileSync(path.join(dataDir, 'properties.json'), JSON.stringify(propertiesData, null, 2));
fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projectsData, null, 2));
console.log('\n✅ Saved JSON files to Data folder');

// Count unique categories
const propertyCategories = [...new Set(propertiesData.map(p => p['Property Type'] || p['Category'] || p['Type']))];
const projectCategories = [...new Set(projectsData.map(p => p['Project Type'] || p['Category'] || p['Type']))];

console.log('\nProperty Categories:', propertyCategories);
console.log('Project Categories:', projectCategories);
