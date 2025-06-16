const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

const sourceIcon = 'icon-source.png'; // 1024x1024 source image
const outputDir = 'icons';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate all icon sizes
    await Promise.all(sizes.map(async (size) => {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);
    }));

    console.log('All icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
