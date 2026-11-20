// Admin : liste des sujets de veille (avec le nombre d'articles) et création.
import { HttpError, json, readJson, route } from '../../../../_lib/http.js'
import { requireAdmin } from '../../../../_lib/auth.js'
import { parseTopic, topicToApi, validSlug } from '../../../../_lib/veille.js'
import { log } from '../../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  await requireAdmin(ctx)
  const { results } = await ctx.env.DB.prepare(`SELECT s.slug, s.name, s.color, s.position, COUNT(t.article_slug) AS articles
    FROM veille_topics s LEFT JOIN veille_article_topics t ON t.topic_slug = s.slug GROUP BY s.slug ORDER BY s.position, s.slug`).all()
  return json({ topics: results.map(topicToApi) })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const body = await readJson(ctx.request)
  const slug = validSlug(body.slug)
  const t = parseTopic(body)
  if (await ctx.env.DB.prepare('SELECT 1 FROM veille_topics WHERE slug = ?').bind(slug).first()) throw new HttpError(409, 'Ce sujet existe déjà')
  const now = Date.now()
  await ctx.env.DB.prepare(`INSERT INTO veille_topics (slug, name, color, position, created_at, updated_at)
    VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM veille_topics), ?, ?)`).bind(slug, t.name, t.color, now, now).run()
  await log(ctx, 'info', 'veille_topic_created', { slug })
  return json({ ok: true, slug }, 201)
}
