// Admin : lire (avec le texte), enregistrer (PUT), publier / repasser en brouillon (PATCH) ou supprimer un article.
import { stash } from '../../../../_lib/trash.js'
import { HttpError, json, readJson, route } from '../../../../_lib/http.js'
import { requireAdmin } from '../../../../_lib/auth.js'
import { ARTICLE_COLUMNS, ARTICLE_STATUSES, articleToApi, assertPublishable, assertTopicsExist, parseArticle, validSlug } from '../../../../_lib/veille.js'
import { log } from '../../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT, PATCH, DELETE })

async function GET(ctx) {
  await requireAdmin(ctx)
  const { DB } = ctx.env
  const slug = validSlug(ctx.params.slug)
  const row = await DB.prepare(`SELECT ${ARTICLE_COLUMNS}, body FROM veille_articles WHERE slug = ?`).bind(slug).first()
  if (!row) throw new HttpError(404, 'Article introuvable')
  const { results } = await DB.prepare('SELECT topic_slug FROM veille_article_topics WHERE article_slug = ?').bind(slug).all()
  return json({ article: articleToApi(row, results.map((r) => r.topic_slug)) })
}

// Enregistre le contenu sans toucher au statut ni à la date de publication. Les sujets sont remplacés d'un bloc (une seule transaction).
async function PUT(ctx) {
  await requireAdmin(ctx)
  const { DB } = ctx.env
  const slug = validSlug(ctx.params.slug)
  const a = parseArticle(await readJson(ctx.request, 100_000))
  await assertTopicsExist(DB, a.topics)
  const old = await DB.prepare('SELECT status FROM veille_articles WHERE slug = ?').bind(slug).first()
  if (!old) throw new HttpError(404, 'Article introuvable')
  if (old.status === 'published') assertPublishable(a) // un article en ligne ne peut pas devenir vide
  await DB.batch([
    DB.prepare(`UPDATE veille_articles SET title = ?, excerpt = ?, body = ?, cover_url = ?, cover_alt = ?, cover_caption = ?, reading_minutes = ?, updated_at = ? WHERE slug = ?`)
      .bind(a.title, a.excerpt, a.body, a.cover_url, a.cover_alt, a.cover_caption, a.reading_minutes, Date.now(), slug),
    DB.prepare('DELETE FROM veille_article_topics WHERE article_slug = ?').bind(slug),
    ...a.topics.map((t) => DB.prepare('INSERT INTO veille_article_topics (article_slug, topic_slug) VALUES (?, ?)').bind(slug, t)),
  ])
  await log(ctx, 'info', 'veille_article_updated', { slug })
  return json({ ok: true })
}

// Bouton « publier » / « repasser en brouillon ». La date de première publication est conservée.
async function PATCH(ctx) {
  await requireAdmin(ctx)
  const { DB } = ctx.env
  const slug = validSlug(ctx.params.slug)
  const { status } = await readJson(ctx.request)
  if (!ARTICLE_STATUSES.includes(status)) throw new HttpError(400, 'Statut invalide')
  const row = await DB.prepare('SELECT excerpt, body FROM veille_articles WHERE slug = ?').bind(slug).first()
  if (!row) throw new HttpError(404, 'Article introuvable')
  if (status === 'published') assertPublishable(row)
  const now = Date.now()
  await DB.prepare('UPDATE veille_articles SET status = ?, published_at = CASE WHEN ? = \'published\' THEN COALESCE(published_at, ?) ELSE published_at END, updated_at = ? WHERE slug = ?')
    .bind(status, status, now, now, slug).run()
  await log(ctx, 'info', status === 'published' ? 'veille_article_published' : 'veille_article_unpublished', { slug })
  return json({ ok: true, status })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  await stash(ctx.env, 'article', slug)
  const res = await ctx.env.DB.prepare('DELETE FROM veille_articles WHERE slug = ?').bind(slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Article introuvable')
  await log(ctx, 'warn', 'veille_article_deleted', { slug })
  return json({ ok: true })
}
