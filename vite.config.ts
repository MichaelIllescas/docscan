import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Dominio de producción. */
const PRODUCTION_URL = 'https://docscan.imperial-net.com'

/**
 * URL pública del sitio, necesaria para las tarjetas de WhatsApp/redes (exigen URLs absolutas),
 * el canonical y el sitemap. Se puede reemplazar con la variable de entorno SITE_URL.
 */
function resolveSiteUrl(): string {
  return (process.env.SITE_URL || PRODUCTION_URL).replace(/\/+$/, '')
}

/** Inserta la URL del sitio en index.html y genera robots.txt y sitemap.xml. */
function seoPlugin(): Plugin {
  const siteUrl = resolveSiteUrl()
  return {
    name: 'docscan-seo',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

export default defineConfig({
  worker: { format: 'es' },
  plugins: [
    react(),
    tailwindcss(),
    seoPlugin(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'DocScan · Escáner de documentos a PDF',
        short_name: 'DocScan',
        description: 'Escaneá documentos con la cámara y convertilos a PDF. Gratis, privado y sin internet.',
        lang: 'es',
        categories: ['productivity', 'utilities', 'business'],
        theme_color: '#1d64f1',
        background_color: '#f4f6fb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm,woff2}'],
        // La imagen para redes solo la leen WhatsApp/Facebook/etc.; no hace falta guardarla offline.
        globIgnores: ['og-image.png'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
    }),
  ],
})
