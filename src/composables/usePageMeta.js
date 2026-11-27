// Titre et balises <head> d'une page (description, Open Graph, canonical, noindex). Tout est remis comme avant quand la page se ferme.
import { onBeforeUnmount, toValue, watchEffect } from 'vue'

export const SITE = 'https://guillaume-rouyer.pages.dev'

export function usePageMeta(source) {
  const saved = new Map() // élément -> { attr, old (null = créé ici), mine (valeur posée) }

  function put(selector, create, attr, value) {
    if (!value) return
    let el = document.head.querySelector(selector)
    if (!el) { el = create(); document.head.append(el); saved.set(el, { attr, old: null, mine: value }) }
    else if (!saved.has(el)) saved.set(el, { attr, old: el.getAttribute(attr), mine: value })
    else saved.get(el).mine = value
    el.setAttribute(attr, value)
  }
  const meta = (attr, key, value) => put(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m }, 'content', value)

  watchEffect(() => {
    const m = toValue(source) ?? {}
    if (m.title) document.title = `${m.title} · Guillaume Rouyer`
    meta('name', 'description', m.description)
    meta('property', 'og:title', m.title)
    meta('property', 'og:description', m.description)
    meta('property', 'og:type', m.type)
    if (m.canonical) {
      meta('property', 'og:url', SITE + m.canonical)
      put('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l }, 'href', SITE + m.canonical)
    }
    if (m.image && /^https:\/\//i.test(m.image)) { meta('property', 'og:image', m.image); meta('name', 'twitter:card', 'summary_large_image') }
    if (m.noindex) meta('name', 'robots', 'noindex, nofollow')
  })

  onBeforeUnmount(() => {
    for (const [el, s] of saved) {
      if (el.getAttribute(s.attr) !== s.mine) continue // quelqu'un d'autre l'a modifié depuis (routeur) : on n'y touche pas
      if (s.old === null) el.remove(); else el.setAttribute(s.attr, s.old)
    }
  })
}
