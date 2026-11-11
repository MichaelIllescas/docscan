// Genera public/og-image.png (1200x630): la tarjeta que muestran WhatsApp, Facebook, X, LinkedIn, etc.
// Uso: npm run generate-og-image
import sharp from 'sharp'

const WIDTH = 1200
const HEIGHT = 630
const ICON_SIZE = 420

const background = Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1841b3"/>
      <stop offset="0.55" stop-color="#1d64f1"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.5" r="0.45">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <circle cx="1120" cy="-40" r="220" fill="#ffffff" fill-opacity="0.07"/>
  <circle cx="80" cy="640" r="180" fill="#22d3ee" fill-opacity="0.15"/>

  <g font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" fill="#ffffff">
    <text x="80" y="230" font-size="92" font-weight="800" letter-spacing="-2">DocScan</text>
    <text x="80" y="305" font-size="40" font-weight="600" fill-opacity="0.95">Escaneá documentos y</text>
    <text x="80" y="355" font-size="40" font-weight="600" fill-opacity="0.95">convertilos a PDF</text>
    <g font-size="26" font-weight="500" fill-opacity="0.88">
      <text x="106" y="450">Detecta bordes y endereza la hoja</text>
      <text x="106" y="492">Funciona sin internet</text>
      <text x="106" y="534">Gratis y privado: todo queda en tu celular</text>
    </g>
    <g fill="#67e8f9">
      <circle cx="88" cy="441" r="6"/>
      <circle cx="88" cy="483" r="6"/>
      <circle cx="88" cy="525" r="6"/>
    </g>
  </g>
</svg>`)

const iconCard = Buffer.from(`
<svg width="${ICON_SIZE + 60}" height="${ICON_SIZE + 60}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${ICON_SIZE + 60}" height="${ICON_SIZE + 60}" rx="72" fill="#ffffff"/>
</svg>`)

const icon = await sharp('design/logo-icon.png').resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()

const cardLeft = WIDTH - ICON_SIZE - 60 - 80
const cardTop = Math.round((HEIGHT - ICON_SIZE - 60) / 2)

await sharp(background)
  .composite([
    { input: iconCard, left: cardLeft, top: cardTop },
    { input: icon, left: cardLeft + 30, top: cardTop + 30 },
  ])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile('public/og-image.png')

console.log('public/og-image.png generado')
