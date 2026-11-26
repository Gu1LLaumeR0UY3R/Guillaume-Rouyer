// Audit SEO d'une page : on la charge dans un cadre invisible du même site, on lit ce que voit un moteur de recherche
// (titre, description, titres, images, liens, données structurées…), puis on note chaque critère.
// Score = somme des points des critères réussis (échec partiel = demi-points), ramenée sur 100.

const clean = (t) => (t ?? '').replace(/\s+/g, ' ').trim()

// Chaque critère : id, poids, test(page, ctx) -> { ok: true | 'partial' | false, tip }
export const CHECKS = [
  { id: 'title', w: 10, run: (p) => !p.title ? [false, 'Ajoute un titre de page (balise title).']
    : p.title.length < 20 ? ['partial', `Titre trop court (${p.title.length} caractères) : vise 30 à 60.`]
    : p.title.length > 65 ? ['partial', `Titre trop long (${p.title.length} caractères) : Google le coupe au-delà de 60 environ.`] : [true] },
  { id: 'title-unique', w: 5, run: (p, c) => c.titles.get(p.title) > 1 ? [false, 'Le même titre existe sur une autre page : rends-le unique.'] : [true] },
  { id: 'desc', w: 10, run: (p) => !p.description ? [false, 'Ajoute une meta description (70 à 160 caractères) : c\'est le texte affiché sous le lien dans Google.']
    : p.description.length < 70 ? ['partial', `Description courte (${p.description.length} caractères) : vise 70 à 160.`]
    : p.description.length > 165 ? ['partial', `Description longue (${p.description.length} caractères) : elle sera coupée après 160 environ.`] : [true] },
  { id: 'desc-unique', w: 4, run: (p, c) => p.description && c.descs.get(p.description) > 1 ? [false, 'La même description existe sur une autre page : rédige-en une propre à chaque page.'] : [true] },
  { id: 'h1', w: 10, run: (p) => p.h1 === 1 ? [true] : p.h1 === 0 ? [false, 'Aucun titre H1 : ajoute-en un qui décrit la page.'] : [false, `${p.h1} titres H1 : n'en garde qu'un.`] },
  { id: 'headings', w: 4, run: (p) => p.headingJump ? ['partial', 'L\'ordre des titres saute un niveau (ex. H1 puis H3) : respecte H1, H2, H3.'] : [true] },
  { id: 'canonical', w: 8, run: (p) => !p.canonical ? [false, 'Ajoute une URL canonique pour éviter les doublons.'] : p.canonicalOk ? [true] : ['partial', 'L\'URL canonique ne correspond pas à l\'adresse de la page.'] },
  { id: 'lang', w: 3, run: (p) => p.lang ? [true] : [false, 'Indique la langue de la page (attribut lang de la balise html).'] },
  { id: 'og', w: 6, run: (p) => p.ogTitle && p.ogDesc ? [true] : p.ogTitle || p.ogDesc ? ['partial', 'Open Graph incomplet : ajoute og:title et og:description (aperçu lors d\'un partage).'] : [false, 'Pas de balises Open Graph : l\'aperçu lors d\'un partage sera pauvre.'] },
  { id: 'og-image', w: 4, run: (p) => p.ogImage ? [true] : [false, 'Ajoute une image de partage (og:image) pour que le lien s\'affiche avec un visuel.'] },
  { id: 'alt', w: 8, run: (p) => !p.imgs ? [true] : p.imgsNoAlt === 0 ? [true] : [p.imgsNoAlt < p.imgs ? 'partial' : false, `${p.imgsNoAlt} image(s) sans attribut alt : décris-les (ou alt="" si purement décoratives).`] },
  { id: 'words', w: 8, run: (p) => p.words >= 250 ? [true] : p.words >= 120 ? ['partial', `Peu de texte (${p.words} mots) : vise 250 mots ou plus pour que la page soit comprise.`] : [false, `Très peu de texte (${p.words} mots) : une page presque vide se positionne mal.`] },
  { id: 'links', w: 5, run: (p) => p.internal >= 3 ? [true] : [p.internal ? 'partial' : false, `Seulement ${p.internal} lien(s) interne(s) : relie cette page à d'autres pages du site.`] },
  { id: 'anchors', w: 3, run: (p) => p.emptyLinks ? ['partial', `${p.emptyLinks} lien(s) sans texte ni nom accessible.`] : [true] },
  { id: 'jsonld', w: 5, run: (p) => p.jsonld ? [true] : [false, 'Ajoute des données structurées (JSON-LD) : Google comprend mieux le type de page.'] },
  { id: 'index', w: 5, run: (p) => p.noindex ? [false, 'La page est en noindex : elle n\'apparaîtra pas dans Google.'] : [true] },
  { id: 'sitemap', w: 4, run: (p, c) => c.sitemap && !c.sitemap.has(p.path) ? [false, 'La page n\'est pas dans le plan du site (sitemap) : ajoute-la.'] : [true] },
  { id: 'speed', w: 6, run: (p) => p.ms <= 2500 ? [true] : p.ms <= 4500 ? ['partial', `Affichage lent (${(p.ms / 1000).toFixed(1)} s) : allège les images ou le script.`] : [false, `Affichage très lent (${(p.ms / 1000).toFixed(1)} s).`] },
]

export const LABELS = {
  title: 'Titre de page', 'title-unique': 'Titre unique', desc: 'Meta description', 'desc-unique': 'Description unique', h1: 'Titre H1', headings: 'Hiérarchie des titres',
  canonical: 'URL canonique', lang: 'Langue', og: 'Open Graph', 'og-image': 'Image de partage', alt: 'Textes alternatifs', words: 'Quantité de texte',
  links: 'Liens internes', anchors: 'Liens lisibles', jsonld: 'Données structurées', index: 'Indexable', sitemap: 'Plan du site', speed: 'Vitesse d\'affichage',
}

// Charge une page dans un cadre invisible et en extrait les mesures.
export function inspect(path, { timeout = 9000 } = {}) {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const f = document.createElement('iframe')
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:1280px;height:900px;border:0;visibility:hidden'
    const done = (v) => { f.remove(); resolve(v) }
    const fail = setTimeout(() => done({ path, error: 'Page non chargée (délai dépassé)' }), timeout + 4000)
    f.addEventListener('load', () => {
      const d = f.contentDocument
      // on attend que le contenu soit affiché (un titre H1 ou H2 présent) puis un court délai pour les balises <head>
      const start = performance.now()
      const poll = setInterval(() => {
        const ready = d.querySelector('main h1, main h2, h1, h2') && d.body.innerText.trim().length > 40
        if (!ready && performance.now() - start < timeout) return
        clearInterval(poll); clearTimeout(fail)
        const ms = Math.round(performance.now() - t0)
        setTimeout(() => { try { done(read(path, d, f.contentWindow, ms)) } catch (e) { done({ path, error: e.message }) } }, 500)
      }, 150)
    })
    f.src = path
    document.body.append(f)
  })
}

function read(path, d, w, ms) {
  const q = (s) => d.querySelector(s)
  const meta = (s) => clean(q(s)?.getAttribute('content'))
  const main = q('main') ?? d.body
  const levels = [...d.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('dialog,[popover]')).map((h) => Number(h[1] ?? h.tagName[1]))
  let headingJump = false
  levels.forEach((l, i) => { if (i && l > levels[i - 1] + 1) headingJump = true })
  const canonical = q('link[rel="canonical"]')?.getAttribute('href') ?? ''
  const imgs = [...main.querySelectorAll('img')]
  const links = [...d.querySelectorAll('a[href]')]
  return {
    path, ms, title: clean(d.title), description: meta('meta[name="description"]'),
    h1: levels.filter((l) => l === 1).length, headingJump, canonical, canonicalOk: !!canonical && new URL(canonical, w.location.origin).pathname.replace(/\/$/, '') === path.replace(/\/$/, ''),
    lang: d.documentElement.lang, ogTitle: meta('meta[property="og:title"]'), ogDesc: meta('meta[property="og:description"]'), ogImage: meta('meta[property="og:image"]'),
    imgs: imgs.length, imgsNoAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
    words: clean(main.innerText).split(' ').filter(Boolean).length,
    internal: new Set(links.map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/') && !h.startsWith('//') && h.split(/[?#]/)[0] !== path)).size,
    emptyLinks: links.filter((a) => !clean(a.textContent) && !a.getAttribute('aria-label') && !a.querySelector('img[alt]:not([alt=""])')).length,
    jsonld: !!q('script[type="application/ld+json"]'), noindex: /noindex/i.test(meta('meta[name="robots"]')),
  }
}

export async function loadSitemap() {
  try {
    const set = new Set()
    for (const u of ['/sitemap.xml', '/sitemap-veille.xml']) {
      const r = await fetch(u); if (!r.ok) continue
      for (const m of (await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) set.add(new URL(m[1]).pathname.replace(/\/$/, '') || '/')
    }
    return set.size ? set : null
  } catch { return null }
}

export function score(page, ctx) {
  const results = CHECKS.map((c) => { const [ok, tip] = c.run(page, ctx); return { id: c.id, w: c.w, ok, tip } })
  const max = results.reduce((a, r) => a + r.w, 0)
  const got = results.reduce((a, r) => a + (r.ok === true ? r.w : r.ok === 'partial' ? r.w / 2 : 0), 0)
  // recommandations triées par gain de points
  const tips = results.filter((r) => r.ok !== true).sort((a, b) => (b.ok ? b.w / 2 : b.w) - (a.ok ? a.w / 2 : a.w)).map((r) => ({ id: r.id, gain: Math.round(r.ok === 'partial' ? r.w / 2 : r.w), text: r.tip, partial: r.ok === 'partial' }))
  return { score: Math.round((got / max) * 100), results, tips }
}

export const grade = (s) => (s >= 90 ? 'good' : s >= 70 ? 'mid' : 'bad')
