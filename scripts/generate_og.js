const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  const iconPath = path.join(__dirname, '../public/favicon.png');
  const ogJpgPath = path.join(__dirname, '../public/og-image.jpg');
  const ogPngPath = path.join(__dirname, '../public/og-image.png');

  // Emblem Icon: 190x190 px for maximum visual presence
  const iconSize = 190;
  const iconBuffer = await sharp(iconPath)
    .resize(iconSize, iconSize, { fit: 'contain' })
    .png()
    .toBuffer();

  const iconTop = 95;
  const iconLeft = Math.round((width - iconSize) / 2); // 505

  // SVG overlay for background glows, lens flare, borders, typography, and badges
  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep cinematic core radial aura -->
      <radialGradient id="centerCoreGlow" cx="50%" cy="33%" r="35%">
        <stop offset="0%" stop-color="#00F5A0" stop-opacity="0.32"/>
        <stop offset="30%" stop-color="#20D66B" stop-opacity="0.18"/>
        <stop offset="70%" stop-color="#059669" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#050806" stop-opacity="0"/>
      </radialGradient>

      <!-- Soft wide background ambient glow -->
      <radialGradient id="wideAmbientGlow" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#10B981" stop-opacity="0.15"/>
        <stop offset="50%" stop-color="#047857" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#030604" stop-opacity="0"/>
      </radialGradient>

      <!-- Anamorphic cinematic horizontal lens flare -->
      <linearGradient id="horizontalFlare" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#20D66B" stop-opacity="0"/>
        <stop offset="25%" stop-color="#20D66B" stop-opacity="0.05"/>
        <stop offset="45%" stop-color="#00F5A0" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.45"/>
        <stop offset="55%" stop-color="#00F5A0" stop-opacity="0.25"/>
        <stop offset="75%" stop-color="#20D66B" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#20D66B" stop-opacity="0"/>
      </linearGradient>

      <!-- Text gradient for PHIM -->
      <linearGradient id="phimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#20D66B"/>
        <stop offset="45%" stop-color="#2cf580"/>
        <stop offset="100%" stop-color="#00F5A0"/>
      </linearGradient>

      <!-- Subtle badge border gradient -->
      <linearGradient id="badgeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
        <stop offset="100%" stop-color="rgba(32,214,107,0.35)"/>
      </linearGradient>

      <!-- Outer frame border gradient -->
      <linearGradient id="frameBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(32,214,107,0.35)"/>
        <stop offset="30%" stop-color="rgba(255,255,255,0.06)"/>
        <stop offset="70%" stop-color="rgba(255,255,255,0.06)"/>
        <stop offset="100%" stop-color="rgba(32,214,107,0.3)"/>
      </linearGradient>
    </defs>

    <!-- 1. Background atmospheric glows -->
    <rect width="${width}" height="${height}" fill="url(#wideAmbientGlow)"/>
    <rect width="${width}" height="${height}" fill="url(#centerCoreGlow)"/>

    <!-- 2. Subtle horizontal cinema flare beam across the emblem center -->
    <rect x="150" y="188" width="900" height="3" fill="url(#horizontalFlare)"/>

    <!-- 3. Outer precision framing -->
    <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="24" fill="none" stroke="url(#frameBorder)" stroke-width="1.2"/>

    <!-- 4. Cinema HUD Corner Accents -->
    <path d="M 40 28 L 28 28 L 28 40" fill="none" stroke="#20D66B" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M ${width - 40} 28 L ${width - 28} 28 L ${width - 28} 40" fill="none" stroke="#20D66B" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 40 ${height - 28} L 28 ${height - 28} L 28 ${height - 40}" fill="none" stroke="#20D66B" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M ${width - 40} ${height - 28} L ${width - 28} ${height - 28} L ${width - 28} ${height - 40}" fill="none" stroke="#20D66B" stroke-width="2.5" stroke-linecap="round"/>

    <!-- 5. Optical rings orbiting the emblem -->
    <circle cx="600" cy="190" r="108" fill="none" stroke="rgba(32,214,107,0.25)" stroke-width="1.2" stroke-dasharray="5 7"/>
    <circle cx="600" cy="190" r="120" fill="none" stroke="rgba(0,245,160,0.12)" stroke-width="0.8" stroke-dasharray="2 12"/>

    <!-- 6. Wordmark Typography: HI PHIM. (Tight, Bold, Cinema Impact) -->
    <text x="600" y="372" text-anchor="middle" font-family="'Oswald', 'Montserrat', 'Segoe UI', 'Arial Black', Arial, sans-serif" font-weight="900" font-size="82" letter-spacing="1">
      <tspan fill="#FFFFFF">HI</tspan><tspan dx="10" fill="url(#phimGrad)">PHIM</tspan><tspan dx="1" fill="#00FF87">.</tspan>
    </text>

    <!-- 7. Slogan / Brand Subtitle -->
    <text x="600" y="420" text-anchor="middle" font-family="'Segoe UI', -apple-system, Arial, sans-serif" font-weight="700" font-size="20" fill="rgba(255,255,255,0.85)" letter-spacing="4.5">
      XEM PHIM ONLINE HD VIETSUB MIỄN PHÍ
    </text>

    <!-- 8. Feature Badges (Balanced and snug inside the 1:1 630px safe zone) -->
    <!-- Badge 1: 4K ULTRA HD -->
    <g transform="translate(420, 458)">
      <rect x="0" y="0" width="105" height="30" rx="15" fill="rgba(255,255,255,0.06)" stroke="url(#badgeBorder)" stroke-width="1"/>
      <text x="52.5" y="19" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="11.5" fill="#FFFFFF" letter-spacing="1">4K ULTRA HD</text>
    </g>

    <!-- Badge 2: TỐC ĐỘ CAO (Emerald highlight) -->
    <g transform="translate(537, 458)">
      <rect x="0" y="0" width="108" height="30" rx="15" fill="rgba(32,214,107,0.12)" stroke="rgba(32,214,107,0.5)" stroke-width="1.2"/>
      <text x="54" y="19" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="11.5" fill="#20D66B" letter-spacing="1">TỐC ĐỘ CAO</text>
    </g>

    <!-- Badge 3: PHI LỢI NHUẬN -->
    <g transform="translate(657, 458)">
      <rect x="0" y="0" width="112" height="30" rx="15" fill="rgba(255,255,255,0.06)" stroke="url(#badgeBorder)" stroke-width="1"/>
      <text x="56" y="19" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="700" font-size="11.5" fill="#FFFFFF" letter-spacing="1">PHI LỢI NHUẬN</text>
    </g>

    <!-- 9. Official URL Footer -->
    <text x="600" y="562" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="15" fill="#20D66B" letter-spacing="6">
      HIPHIM.ONE
    </text>
  </svg>
  `;

  // Create base canvas with deep cinema gradient background
  const baseImage = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 5, g: 8, b: 6, alpha: 1 } // #050806
    }
  });

  const finalBuffer = await baseImage
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
      { input: iconBuffer, top: iconTop, left: iconLeft }
    ])
    .png()
    .toBuffer();

  // Save to og-image.png (Lossless crisp PNG)
  await sharp(finalBuffer).png({ quality: 100, compressionLevel: 9 }).toFile(ogPngPath);

  // Save to og-image.jpg (High-fidelity 95% mozjpeg)
  await sharp(finalBuffer).jpeg({ quality: 95, mozjpeg: true }).toFile(ogJpgPath);

  console.log('Successfully generated refined public/og-image.png and public/og-image.jpg');
}

generateOgImage().catch(console.error);
