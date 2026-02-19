const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const SOURCE_PNG = path.join(PUBLIC_DIR, 'favicon.png'); // 512x512 source

async function createFavicons() {
    console.log('Reading source favicon.png...');
    const sourceBuffer = fs.readFileSync(SOURCE_PNG);

    // 1. Create favicon-16x16.png
    await sharp(sourceBuffer).resize(16, 16).png().toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
    console.log('Created favicon-16x16.png');

    // 2. Create favicon-32x32.png
    await sharp(sourceBuffer).resize(32, 32).png().toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    console.log('Created favicon-32x32.png');

    // 3. Create favicon-48x48.png (for ICO)
    await sharp(sourceBuffer).resize(48, 48).png().toFile(path.join(PUBLIC_DIR, 'favicon-48x48.png'));
    console.log('Created favicon-48x48.png');

    // 4. Create android-chrome-192x192.png (Google uses this!)
    await sharp(sourceBuffer).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'));
    console.log('Created android-chrome-192x192.png');

    // 5. Create android-chrome-512x512.png
    await sharp(sourceBuffer).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'));
    console.log('Created android-chrome-512x512.png');

    // 6. Create apple-touch-icon.png (180x180)
    await sharp(sourceBuffer).resize(180, 180).png().toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    console.log('Created apple-touch-icon.png');

    // 7. Create a proper multi-size favicon.ico using raw ICO format
    // ICO format: header + directory entries + image data
    const sizes = [16, 32, 48];
    const pngBuffers = [];

    for (const size of sizes) {
        const buf = await sharp(sourceBuffer).resize(size, size).png().toBuffer();
        pngBuffers.push(buf);
    }

    // ICO Header: 6 bytes
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // ICO type
    header.writeUInt16LE(sizes.length, 4); // Number of images

    // Calculate offsets
    const dirEntrySize = 16; // Each directory entry is 16 bytes
    let dataOffset = 6 + (dirEntrySize * sizes.length);

    const dirEntries = [];
    for (let i = 0; i < sizes.length; i++) {
        const entry = Buffer.alloc(16);
        const size = sizes[i];
        entry.writeUInt8(size === 256 ? 0 : size, 0); // Width
        entry.writeUInt8(size === 256 ? 0 : size, 1); // Height
        entry.writeUInt8(0, 2); // Color palette
        entry.writeUInt8(0, 3); // Reserved
        entry.writeUInt16LE(1, 4); // Color planes
        entry.writeUInt16LE(32, 6); // Bits per pixel
        entry.writeUInt32LE(pngBuffers[i].length, 8); // Image data size
        entry.writeUInt32LE(dataOffset, 12); // Offset to image data
        dirEntries.push(entry);
        dataOffset += pngBuffers[i].length;
    }

    const icoBuffer = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
    console.log(`Created favicon.ico (${icoBuffer.length} bytes) with sizes: ${sizes.join(', ')}`);

    console.log('\nAll favicons created successfully!');
}

createFavicons().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
