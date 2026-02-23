import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const input = 'public/og-image.jpg';

async function generate() {
    console.log('Generating favicons from og-image.jpg...');

    // Favicons - using fit: contain so the logo isn't cropped, with white background
    await sharp(input).resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFormat('png').toFile('public/favicon-16x16.png');
    await sharp(input).resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFormat('png').toFile('public/favicon-32x32.png');

    // Copy 32x32 as favicon.ico implementation since standard PNGs work for most modern browsers even when renamed
    fs.copyFileSync('public/favicon-32x32.png', 'public/favicon.ico');

    // Apple & Android PWA icons
    await sharp(input).resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFormat('png').toFile('public/apple-touch-icon.png');
    await sharp(input).resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFormat('png').toFile('public/android-chrome-192x192.png');
    await sharp(input).resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFormat('png').toFile('public/android-chrome-512x512.png');

    // Dashboard logos
    // The previous sidebar logo was named `sidebar-logo.png` and `logo-trimmed.png`.
    await sharp(input).resize(400, null, { withoutEnlargement: true }).toFormat('png').toFile('public/sidebar-logo.png');

    if (fs.existsSync('public/logo-trimmed.png')) {
        await sharp(input).resize(400, null, { withoutEnlargement: true }).toFormat('png').toFile('public/logo-trimmed.png');
    }

    if (fs.existsSync('public/logo.png')) {
        await sharp(input).resize(400, null, { withoutEnlargement: true }).toFormat('png').toFile('public/logo.png');
    }

    console.log('Successfully replaced all icons and dashboard logos with og-image.jpg variations!');
}

generate().catch(console.error);
