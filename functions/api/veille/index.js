// Public : articles publiés (sans le texte) + sujets utilisés (pour les filtres). ?sujet=<slug> filtre par sujet.
import { json, route } from '../../_lib/http.js'
import { ARTICLE_COLUMNS, articleToApi, topicToApi, topicsByArticle, validSlug } from '../../_lib/veille.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env, request }) {
  const sujet = new URL(request.url).searchParams.get('sujet')
  const topicSlug = sujet ? validSlug(sujet) : null
  const [{ results }, topicMap, { results: topics }] = await Promise.all([
    env.DB.prepare(`SELECT ${ARTICLE_COLUMNS} FROM veille_articles a WHERE status = 'published'
      AND (? IS NULL OR EXISTS (SELECT 1 FROM veille_article_topics t WHERE t.article_slug = a.slug AND t.topic_slug = ?))
      ORDER BY published_at DESC`).bind(topicSlug, topicSlug).all(),
    topicsByArticle(env.DB, { onlyPublished: true }),
    env.DB.prepare(`SELECT s.slug, s.name, s.color, s.position, COUNT(*) AS articles FROM veille_topics s
      JOIN veille_article_topics t ON t.topic_slug = s.slug JOIN veille_articles a ON a.slug = t.article_slug AND a.status = 'published'
      GROUP BY s.slug ORDER BY s.position, s.slug`).all(),
  ])
  return json({ articles: results.map((r) => articleToApi(r, topicMap.get(r.slug) ?? [])), topics: topics.map(topicToApi) }, 200, { 'Cache-Control': 'public, max-age=30' })
}
