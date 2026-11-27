// Balises de référencement injectées dans le HTML de l'application avant de l'envoyer : les robots et les aperçus de liens
// (réseaux sociaux, messageries) voient le bon titre, la bonne description et la bonne image sans exécuter de JavaScript.
export const SITE = 'https://guillaume-rouyer.pages.dev'
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const cut = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t }
const iso = (ms) => new Date(ms).toISOString()
// JSON placé dans <script> : on neutralise « < » pour qu'aucun texte ne puisse fermer la balise.
const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

// Remplace la balise qui correspond, ou l'ajoute avant </head> si elle n'existe pas.
function put(html, re, tag) {
  return re.test(html) ? html.replace(re, () => tag) : html.replace('</head>', () => `    ${tag}\n  </head>`)
}

export function injectMeta(html, m) {
  let h = html
  const desc = m.description ? cut(m.description, 200) : ''
  if (m.title) h = h.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(m.title)}</title>`)
  if (desc) h = put(h, /<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${esc(desc)}">`)
  if (m.title) h = put(h, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${esc(m.title)}">`)
  if (desc) h = put(h, /<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${esc(desc)}">`)
  if (m.type) h = put(h, /<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${esc(m.type)}">`)
  if (m.path) {
    h = put(h, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${esc(SITE + m.path)}">`)
    h = put(h, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(SITE + m.path)}">`)
  }
  if (m.image && /^https:\/\//i.test(m.image)) {
    h = put(h, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${esc(m.image)}">`)
    h = put(h, /<meta\s+name="twitter:card"[^>]*>/i, '<meta name="twitter:card" content="summary_large_image">')
  }
  if (m.publishedAt) h = put(h, /<meta\s+property="article:published_time"[^>]*>/i, `<meta property="article:published_time" content="${iso(m.publishedAt)}">`)
  if (m.updatedAt) h = put(h, /<meta\s+property="article:modified_time"[^>]*>/i, `<meta property="article:modified_time" content="${iso(m.updatedAt)}">`)
  if (m.noindex) h = put(h, /<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow">')
  if (m.jsonLd) h = h.replace('</head>', () => `    <script type="application/ld+json">${safeJson(m.jsonLd)}</script>\n  </head>`)
  return h
}

export function articleMeta(row) {
  const path = `/veille/${row.slug}`
  const image = /^https:\/\//i.test(row.cover_url ?? '') ? row.cover_url : undefined
  return {
    title: `${row.title} · Er1gon359`, description: row.excerpt, type: 'article', path, image, publishedAt: row.published_at, updatedAt: row.updated_at,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: cut(row.title, 110), description: cut(row.excerpt, 200), inLanguage: 'fr',
      datePublished: iso(row.published_at), dateModified: iso(row.updated_at), mainEntityOfPage: SITE + path, ...(image && { image: [image] }),
      author: { '@type': 'Person', name: 'Guillaume Rouyer', url: SITE },
    },
  }
}

export const listMeta = {
  title: 'Veille technologique · Er1gon359', path: '/veille', type: 'website',
  description: 'Veille technologique de Guillaume Rouyer (Er1gon359) : articles sur le développement web, le self-hosting, l\'IA et tout ce qui le passionne.',
}

// Réponse HTML modifiée : on garde les en-têtes de sécurité de la page d'origine (CSP...), on retire ceux qui ne valent plus.
export function htmlResponse(res, html, { status = 200, cache } = {}) {
  const headers = new Headers(res.headers)
  headers.delete('Content-Length'); headers.delete('ETag'); headers.delete('Content-Encoding')
  if (cache) headers.set('Cache-Control', cache)
  return new Response(html, { status, headers })
}
