// Plan du site des articles de veille publiés (le plan principal est le fichier statique public/sitemap.xml).
import { SITE } from './_lib/seo.js'

export async function onRequestGet({ env }) {
  let rows
  try {
    rows = (await env.DB.prepare(`SELECT slug, updated_at FROM veille_articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 2000`).all()).results
  } catch (e) {
    console.error('sitemap_veille_error', e.message)
    return new Response('Service indisponible', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  const urls = rows.map((r) => `  <url><loc>${SITE}/veille/${r.slug}</loc><lastmod>${new Date(r.updated_at).toISOString().slice(0, 10)}</lastmod></url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}
