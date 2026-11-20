// Admin : modifier ou supprimer un sujet (les liens avec les articles disparaissent, les articles restent).
import { HttpError, json, readJson, route } from '../../../../_lib/http.js'
import { requireAdmin } from '../../../../_lib/auth.js'
import { parseTopic, validSlug } from '../../../../_lib/veille.js'
import { log } from '../../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { PUT, DELETE })

async function PUT(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const t = parseTopic(await readJson(ctx.request))
  const res = await ctx.env.DB.prepare('UPDATE veille_topics SET name = ?, color = ?, updated_at = ? WHERE slug = ?').bind(t.name, t.color, Date.now(), slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Sujet introuvable')
  await log(ctx, 'info', 'veille_topic_updated', { slug })
  return json({ ok: true })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const res = await ctx.env.DB.prepare('DELETE FROM veille_topics WHERE slug = ?').bind(slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Sujet introuvable')
  await log(ctx, 'warn', 'veille_topic_deleted', { slug })
  return json({ ok: true })
}
