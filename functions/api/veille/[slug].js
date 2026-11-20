// Public : un article publié avec son texte, ses sujets et jusqu'à 3 articles liés (sujets en commun).
import { HttpError, json, route } from '../../_lib/http.js'
import { ARTICLE_COLUMNS, articleToApi, topicToApi, validSlug } from '../../_lib/veille.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env, params }) {
  const slug = validSlug(params.slug)
  const row = await env.DB.prepare(`SELECT ${ARTICLE_COLUMNS}, body FROM veille_articles WHERE slug = ? AND status = 'published'`).bind(slug).first()
  if (!row) throw new HttpError(404, 'Article introuvable')
  const [{ results: topics }, { results: related }] = await Promise.all([
    env.DB.prepare('SELECT s.slug, s.name, s.color, s.position FROM veille_topics s JOIN veille_article_topics t ON t.topic_slug = s.slug WHERE t.article_slug = ? ORDER BY s.position, s.slug').bind(slug).all(),
    env.DB.prepare(`SELECT ${ARTICLE_COLUMNS.split(', ').map((c) => 'a.' + c).join(', ')}, COUNT(*) AS shared
      FROM veille_articles a JOIN veille_article_topics t ON t.article_slug = a.slug
      WHERE a.status = 'published' AND a.slug != ? AND t.topic_slug IN (SELECT topic_slug FROM veille_article_topics WHERE article_slug = ?)
      GROUP BY a.slug ORDER BY shared DESC, a.published_at DESC LIMIT 3`).bind(slug, slug).all(),
  ])
  return json({
    article: articleToApi(row, topics.map((t) => t.slug)),
    topics: topics.map(topicToApi),
    related: related.map((r) => articleToApi(r)),
  }, 200, { 'Cache-Control': 'public, max-age=30' })
}
