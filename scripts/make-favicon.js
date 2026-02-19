const sharp = require('sharp');
const path = require('path');

async function makeFavicon() {
    const input = path.join(__dirname, '..', 'public', 'sidebar-logo.png');
    const output = path.join(__dirname, '..', 'public', 'favicon.png');

    // Read the image and get raw pixel data
    const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });

    // Sample the green background color from center
    const centerIdx = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
    const greenR = data[centerIdx];
    const greenG = data[centerIdx + 1];
    const greenB = data[centerIdx + 2];

    // Create RGBA buffer (add alpha channel)
    const rgba = Buffer.alloc(info.width * info.height * 4);

    for (let i = 0; i < info.width * info.height; i++) {
        const srcIdx = i * info.channels;
        const dstIdx = i * 4;
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        rgba[dstIdx] = r;
        rgba[dstIdx + 1] = g;
        rgba[dstIdx + 2] = b;

        // Make white-ish pixels transparent (the corners)
        if (r > 240 && g > 240 && b > 240) {
            rgba[dstIdx + 3] = 0; // transparent
        } else {
            rgba[dstIdx + 3] = 255; // opaque
        }
    }

    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
        .resize(512, 512)
        .png()
        .toFile(output);

    console.log('Favicon created (rounded rect with transparent corners)');
}

makeFavicon().catch(console.error);
