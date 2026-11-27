// Page /veille/<slug> : même application, avec le titre, la description, l'image et les données structurées de l'article dans le HTML de départ.
// Article absent ou en brouillon : la page répond 404 et demande de ne pas être indexée (l'application affiche « Article introuvable »).
import { SLUG, articleMeta, htmlResponse, injectMeta } from '../_lib/seo.js'

export async function onRequestGet(ctx) {
  const res = await ctx.next()
  if (!(res.headers.get('Content-Type') ?? '').includes('text/html')) return res
  const slug = String(ctx.params.slug ?? '')
  let row = null
  try {
    if (SLUG.test(slug) && slug.length <= 60) {
      row = await ctx.env.DB.prepare(`SELECT slug, title, excerpt, cover_url, published_at, updated_at FROM veille_articles WHERE slug = ? AND status = 'published'`).bind(slug).first()
    }
    const html = await res.text()
    if (!row) return htmlResponse(res, injectMeta(html, { title: 'Article introuvable · Guillaume Rouyer', noindex: true }), { status: 404, cache: 'no-store' })
    return htmlResponse(res, injectMeta(html, articleMeta(row)), { cache: 'public, max-age=0, s-maxage=60' })
  } catch (e) {
    console.error('veille_article_meta_error', e.message)
    return ctx.next() // base indisponible : l'application s'affiche quand même
  }
}
