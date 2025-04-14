/**
 * This script uses sharp to convert the SVG icon to various PNG sizes for PWA.
 * You'll need to run: npm install sharp
 * Then execute: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [192, 512];
const inputSvg = path.join(__dirname, '../public/message-icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  try {
    // Generate PNG icons in different sizes
    for (const size of sizes) {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    // Generate Apple touch icon
    await sharp(inputSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-icon.png'));
    console.log('Generated apple-icon.png');
    
    // Generate favicon.ico (multi-size ICO file)
    await sharp(inputSvg)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('Generated favicon.ico');
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 