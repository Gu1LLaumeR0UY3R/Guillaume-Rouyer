// Admin : nouvel ordre des sujets (l'ordre des filtres sur /veille). La liste doit contenir exactement les sujets existants.
import { HttpError, json, readJson, route } from '../../../../_lib/http.js'
import { requireAdmin } from '../../../../_lib/auth.js'
import { validSlug } from '../../../../_lib/veille.js'
import { log } from '../../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  await requireAdmin(ctx)
  const { slugs } = await readJson(ctx.request)
  if (!Array.isArray(slugs) || slugs.length > 200) throw new HttpError(400, 'Liste invalide')
  const wanted = slugs.map(validSlug)
  const { results } = await ctx.env.DB.prepare('SELECT slug FROM veille_topics').all()
  const existing = new Set(results.map((r) => r.slug))
  if (new Set(wanted).size !== wanted.length || wanted.length !== existing.size || wanted.some((s) => !existing.has(s))) throw new HttpError(400, 'La liste ne correspond pas aux sujets existants')
  await ctx.env.DB.batch(wanted.map((s, i) => ctx.env.DB.prepare('UPDATE veille_topics SET position = ? WHERE slug = ?').bind(i, s)))
  await log(ctx, 'info', 'veille_topics_reordered')
  return json({ ok: true })
}
