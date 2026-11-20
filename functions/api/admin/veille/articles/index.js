// Admin : liste des articles (brouillons compris, sans le texte) et création (toujours en brouillon).
import { HttpError, json, readJson, route } from '../../../../_lib/http.js'
import { requireAdmin } from '../../../../_lib/auth.js'
import { ARTICLE_COLUMNS, articleToApi, assertTopicsExist, parseArticle, topicsByArticle, validSlug } from '../../../../_lib/veille.js'
import { log } from '../../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  await requireAdmin(ctx)
  const { DB } = ctx.env
  const [{ results }, topics] = await Promise.all([
    DB.prepare(`SELECT ${ARTICLE_COLUMNS} FROM veille_articles ORDER BY updated_at DESC`).all(),
    topicsByArticle(DB),
  ])
  return json({ articles: results.map((r) => articleToApi(r, topics.get(r.slug) ?? [])) })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const { DB } = ctx.env
  const body = await readJson(ctx.request, 100_000)
  const slug = validSlug(body.slug)
  const a = parseArticle(body)
  if (await DB.prepare('SELECT 1 FROM veille_articles WHERE slug = ?').bind(slug).first()) throw new HttpError(409, 'Cet identifiant existe déjà')
  await assertTopicsExist(DB, a.topics)
  const now = Date.now()
  await DB.batch([
    DB.prepare(`INSERT INTO veille_articles (slug, title, excerpt, body, cover_url, cover_alt, cover_caption, status, reading_minutes, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, NULL, ?, ?)`).bind(slug, a.title, a.excerpt, a.body, a.cover_url, a.cover_alt, a.cover_caption, a.reading_minutes, now, now),
    ...a.topics.map((t) => DB.prepare('INSERT INTO veille_article_topics (article_slug, topic_slug) VALUES (?, ?)').bind(slug, t)),
  ])
  await log(ctx, 'info', 'veille_article_created', { slug })
  return json({ ok: true, slug }, 201)
}
