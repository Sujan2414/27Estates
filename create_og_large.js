const sharp = require('sharp');

async function createOG() {
    try {
        const image = sharp('public/27estates new logo.JPG');
        const metadata = await image.metadata();
        const w = metadata.width; // 900
        const h = metadata.height; // 1600

        // 1. Create extended background strips (same as before)
        const leftStrip = await sharp('public/27estates new logo.JPG')
            .extract({ left: 0, top: 0, width: 1, height: h })
            .resize(400, h, { fit: 'fill' }) // extend more
            .toBuffer();

        const rightStrip = await sharp('public/27estates new logo.JPG')
            .extract({ left: w - 1, top: 0, width: 1, height: h })
            .resize(400, h, { fit: 'fill' }) // extend more
            .toBuffer();

        const extendedTotalWidth = 400 + w + 400; // 1700

        const extended = await sharp({
            create: {
                width: extendedTotalWidth,
                height: h,
                channels: 3,
                background: { r: 0, g: 0, b: 0 }
            }
        })
            .composite([
                { input: leftStrip, left: 0, top: 0 },
                { input: 'public/27estates new logo.JPG', left: 400, top: 0 },
                { input: rightStrip, left: 400 + w, top: 0 }
            ])
            .png()
            .toBuffer();

        // 2. Crop tightly around the logo in the original/extended image first
        // The logo text ends around pixel 1100.
        // The top of the lines starts around pixel 320.
        // Let's crop from Y=300 to Y=1150 (approx 850px height)
        // And keep the full width

        const tightCrop = await sharp(extended)
            .extract({ left: 0, top: 250, width: extendedTotalWidth, height: 950 }) // Capture just the logo and text + small padding
            .toBuffer();

        // 3. Now resize this tight crop to fit into 1200x630
        // We want the logo to be as BIG as possible.
        // 950px height -> scale down to 630px height = 0.66 scale
        // Logo width (900px) * 0.66 = 600px width. This is much better than before.

        await sharp(tightCrop)
            .resize(1200, 630, { fit: 'contain', background: { r: 26, g: 58, b: 50, alpha: 0 } }) // Using transparent to let composite work if needed, but contain will add bands.
            // Actually, we want to COVER the 1200x630 with our extended bg.
            // But since we extended the width, we can just resize to height 630 and crop width.
            .resize(null, 630) // resize height to 630, width will auto-scale
            .extract({ left: Math.floor(((extendedTotalWidth * (630 / 950)) - 1200) / 2), top: 0, width: 1200, height: 630 })
            .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
            .toFile('public/og-image.jpg');

        console.log('Success: Large logo og-image.jpg created');
    } catch (e) {
        console.error('Error:', e);
    }
}

createOG();
