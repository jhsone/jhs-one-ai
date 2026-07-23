import sharp from 'sharp'
import path from 'path'

const SIZES = [192, 512]
const COLOR = '#2563eb'
const TEXT_COLOR = '#ffffff'

async function generateIcon(size: number) {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2563eb"/>
        <stop offset="100%" style="stop-color:#7c3aed"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
    <text x="${size / 2}" y="${size / 2 + size * 0.3}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="${size * 0.5}" fill="${TEXT_COLOR}">J</text>
  </svg>`

  const outPath = path.resolve(__dirname, `../public/pwa-icon-${size}.png`)
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath)
  console.log(`✓ Generated pwa-icon-${size}.png`)
}

async function main() {
  for (const size of SIZES) {
    await generateIcon(size)
  }
  console.log('Done!')
}

main().catch(console.error)
