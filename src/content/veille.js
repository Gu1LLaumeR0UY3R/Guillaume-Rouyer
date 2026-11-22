// Veille technologique côté public : lecture des articles publiés (API) et petits outils d'affichage.
async function get(url) {
  const r = await fetch(url)
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`http_${r.status}`)
  return r.json()
}
export const fetchList = () => get('/api/veille')
export const fetchArticle = (slug) => get(`/api/veille/${encodeURIComponent(slug)}`)

export const formatDate = (ms, lang) => new Date(ms).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
export const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10)
// Défense en plus de la validation du serveur : seulement du https pour les images, un code couleur strict pour les pastilles.
export const safeHttps = (u) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : null)
export const safeColor = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#6c8cff')
