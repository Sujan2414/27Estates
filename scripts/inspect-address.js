
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Use process.cwd() for safer path resolution
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'Data');
const filePath = path.join(dataDir, 'Properties.xlsx');

console.log('Reading file from:', filePath);

if (!fs.existsSync(filePath)) {
    console.error('ERROR: File not found at:', filePath);
    process.exit(1);
}

const propertiesWorkbook = XLSX.readFile(filePath);
const propertiesData = XLSX.utils.sheet_to_json(propertiesWorkbook.Sheets[propertiesWorkbook.SheetNames[0]]);

console.log('Total Properties:', propertiesData.length);
console.log('--- Sample Address Data (First 3 Records) ---');

propertiesData.slice(0, 3).forEach((prop, i) => {
    console.log(`\nProperty ${i + 1}:`);
    console.log('AddressName (Full):', prop.AddressName);
    console.log('LocationName (Area):', prop.LocationName);
    console.log('CityName:', prop.CityName);
    console.log('Street:', prop.Street);
    console.log('BuildingName:', prop.BuildingName);
    console.log('FlatNo:', prop.FlatNo);
});
