const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createSplash() {
  const width = 2048;
  const height = 2048;
  const iconPath = path.join(__dirname, '../mobile/assets/icon.png');
  const splashPath = path.join(__dirname, '../mobile/assets/splash.png');

  // Extract icon with circular alpha mask so there's no square box artifact
  const mask = Buffer.from(
    `<svg width="520" height="520"><circle cx="260" cy="260" r="258" fill="white" /></svg>`
  );

  const iconResized = await sharp(iconPath)
    .resize(520, 520, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const iconTop = 640;
  const iconLeft = Math.round((width - 520) / 2);

  const svgText = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="44%" r="35%">
          <stop offset="0%" stop-color="#20D66B" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="#10B981" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#050807" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Radial background aura behind emblem -->
      <circle cx="1024" cy="900" r="750" fill="url(#bgGlow)"/>

      <!-- Typography -->
      <text x="1024" y="1290" text-anchor="middle" font-family="-apple-system, system-ui, Arial, sans-serif" font-weight="900" font-size="100" fill="#FFFFFF" letter-spacing="1">
        HI <tspan fill="#20D66B">PHIM</tspan><tspan fill="#00FF87">.</tspan>
      </text>

      <text x="1024" y="1360" text-anchor="middle" font-family="-apple-system, system-ui, Arial, sans-serif" font-weight="700" font-size="28" fill="rgba(255,255,255,0.48)" letter-spacing="7">
        TRẢI NGHIỆM ĐIỆN ẢNH ĐỈNH CAO
      </text>

      <text x="1024" y="1860" text-anchor="middle" font-family="-apple-system, system-ui, Arial, sans-serif" font-weight="700" font-size="24" fill="rgba(32,214,107,0.75)" letter-spacing="5">
        HIPHIM.ONE
      </text>
    </svg>
  `;

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 5, g: 8, b: 7, alpha: 1 }
    }
  })
  .composite([
    { input: Buffer.from(svgText), top: 0, left: 0 },
    { input: iconResized, top: iconTop, left: iconLeft }
  ])
  .png()
  .toFile(splashPath);

  console.log('Successfully generated seamless mobile/assets/splash.png');
}

createSplash().catch(console.error);
