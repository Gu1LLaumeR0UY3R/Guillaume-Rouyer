// Règles de validation et mise en forme de la veille (sujets + articles). Rien venant du navigateur n'est stocké tel quel.
import { HttpError } from './http.js'
import { str } from './validate.js'
import { httpsUrl, validSlug } from './projects.js'

export { validSlug }

const COLOR = /^#[0-9a-f]{6}$/i
export const ARTICLE_STATUSES = ['draft', 'published']
const MAX_TOPICS_PER_ARTICLE = 8

// ---------- Sujets ----------
export function parseTopic(b) {
  const color = str(b.color ?? '#6c8cff', { max: 7, name: 'couleur' })
  if (!COLOR.test(color)) throw new HttpError(400, 'Couleur invalide (format #rrggbb)')
  return { name: str(b.name, { min: 1, max: 40, name: 'nom du sujet' }), color: color.toLowerCase() }
}

export const topicToApi = (r) => ({ slug: r.slug, name: r.name, color: r.color, position: r.position, ...(r.articles !== undefined && { articles: r.articles }) })

// ---------- Articles ----------

// On retire le code (blocs et code en ligne) avant de contrôler le texte : `tab[i](x)` n'est pas un lien.
const stripCode = (md) => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

// Images et liens du Markdown : images en https externe avec texte alternatif (SEO), liens sans schéma dangereux (javascript:, data:...).
// Le rendu nettoie aussi tout ça : ce contrôle donne une erreur claire dès l'enregistrement.
function checkMarkdown(body) {
  const text = stripCode(body)
  for (const m of text.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g)) {
    if (!m[1].trim()) throw new HttpError(400, 'Une image n\'a pas de texte alternatif (alt) : il est obligatoire')
    const url = m[2].trim().split(/\s+/)[0]
    httpsUrl(url, 'lien d\'image')
    if (!url) throw new HttpError(400, 'Une image n\'a pas de lien')
  }
  for (const m of text.matchAll(/\]\(\s*([^)\s]*)/g)) {
    if (m[1] && !/^(https:\/\/|mailto:|#|\/)/i.test(m[1])) throw new HttpError(400, 'Un lien du texte est refusé (https, mailto ou lien interne uniquement)')
  }
}

export const readingMinutes = (body) => Math.max(1, Math.ceil((body.match(/\S+/g) ?? []).length / 200))

export function parseArticle(b) {
  const body = str(b.body ?? '', { max: 60_000, name: 'contenu' })
  checkMarkdown(body)
  const coverUrl = httpsUrl(b.coverUrl, 'lien de la couverture')
  const coverAlt = b.coverAlt ? str(b.coverAlt, { max: 200, name: 'texte alternatif de la couverture' }) : null
  if (coverUrl && !coverAlt) throw new HttpError(400, 'La couverture a besoin d\'un texte alternatif (alt)')
  const topics = b.topics ?? []
  if (!Array.isArray(topics) || topics.length > MAX_TOPICS_PER_ARTICLE) throw new HttpError(400, `Sujets invalides (${MAX_TOPICS_PER_ARTICLE} maximum)`)
  const slugs = [...new Set(topics.map(validSlug))]
  return {
    title: str(b.title, { min: 1, max: 150, name: 'titre' }),
    excerpt: str(b.excerpt ?? '', { max: 300, name: 'résumé' }),
    body,
    cover_url: coverUrl,
    cover_alt: coverUrl ? coverAlt : null,
    cover_caption: coverUrl && b.coverCaption ? str(b.coverCaption, { max: 200, name: 'légende de la couverture' }) : null,
    reading_minutes: readingMinutes(body),
    topics: slugs,
  }
}

// Tous les sujets demandés doivent exister.
export async function assertTopicsExist(db, slugs) {
  if (!slugs.length) return
  const { results } = await db.prepare(`SELECT slug FROM veille_topics WHERE slug IN (${slugs.map(() => '?').join(',')})`).bind(...slugs).all() // seuls des « ? » sont insérés, les valeurs sont liées
  if (results.length !== slugs.length) throw new HttpError(400, 'Un des sujets n\'existe pas')
}

// Un article ne passe en « publié » que s'il est présentable (résumé pour le SEO, contenu, couverture avec alt).
export function assertPublishable(row) {
  if (!row.excerpt.trim() || !row.body.trim()) throw new HttpError(400, 'Pour publier, l\'article a besoin d\'un résumé et d\'un contenu')
}

export const ARTICLE_COLUMNS = 'slug, title, excerpt, cover_url, cover_alt, cover_caption, status, reading_minutes, published_at, created_at, updated_at'

export function articleToApi(r, topics = []) {
  const a = {
    slug: r.slug, title: r.title, excerpt: r.excerpt, status: r.status, readingMinutes: r.reading_minutes,
    cover: r.cover_url ? { url: r.cover_url, alt: r.cover_alt ?? '', caption: r.cover_caption ?? '' } : null,
    publishedAt: r.published_at, createdAt: r.created_at, updatedAt: r.updated_at, topics,
  }
  if (r.body !== undefined) a.body = r.body
  return a
}

// slug d'article -> [slug de sujets], pour une liste d'articles (une seule requête).
export async function topicsByArticle(db, { onlyPublished = false } = {}) {
  const { results } = await db.prepare(`SELECT t.article_slug, t.topic_slug FROM veille_article_topics t
    JOIN veille_topics s ON s.slug = t.topic_slug ${onlyPublished ? `JOIN veille_articles a ON a.slug = t.article_slug AND a.status = 'published'` : ''}
    ORDER BY s.position, s.slug`).all()
  const map = new Map()
  for (const r of results) map.set(r.article_slug, [...(map.get(r.article_slug) ?? []), r.topic_slug])
  return map
}
