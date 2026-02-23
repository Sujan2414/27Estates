import sharp from 'sharp';
import fs from 'fs';

const input = 'public/og-image.jpg';

async function generate() {
    console.log('Generating square favicons and logos from og-image.jpg...');

    // First, crop the image to a square from the center
    const metadata = await sharp(input).metadata();
    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);

    const squareBuffer = await sharp(input)
        .extract({ left, top, width: size, height: size })
        .toBuffer();

    // Now generate the icons from the square buffer
    // For favicons, a simple resize is sufficient since it's already a square
    await sharp(squareBuffer).resize(16, 16).toFormat('png').toFile('public/favicon-16x16.png');
    await sharp(squareBuffer).resize(32, 32).toFormat('png').toFile('public/favicon-32x32.png');

    fs.copyFileSync('public/favicon-32x32.png', 'public/favicon.ico');

    await sharp(squareBuffer).resize(180, 180).toFormat('png').toFile('public/apple-touch-icon.png');
    await sharp(squareBuffer).resize(192, 192).toFormat('png').toFile('public/android-chrome-192x192.png');
    await sharp(squareBuffer).resize(512, 512).toFormat('png').toFile('public/android-chrome-512x512.png');

    // Dashboard logos
    await sharp(squareBuffer).resize(400, 400).toFormat('png').toFile('public/sidebar-logo.png');

    if (fs.existsSync('public/logo-trimmed.png')) {
        await sharp(squareBuffer).resize(400, 400).toFormat('png').toFile('public/logo-trimmed.png');
    }

    if (fs.existsSync('public/logo.png')) {
        await sharp(squareBuffer).resize(400, 400).toFormat('png').toFile('public/logo.png');
    }

    console.log('Successfully replaced all icons and dashboard logos with a square crop of og-image.jpg!');
}

generate().catch(console.error);
