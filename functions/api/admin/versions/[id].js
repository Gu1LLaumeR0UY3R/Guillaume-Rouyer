// Admin : restaurer une ancienne version. L'état actuel est d'abord gardé dans l'historique (la restauration s'annule donc aussi).
import { HttpError, json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { apply } from '../../../_lib/versions.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  await requireAdmin(ctx)
  if (!/^\d{1,12}$/.test(ctx.params.id)) throw new HttpError(404, 'Version introuvable')
  const v = await ctx.env.DB.prepare('SELECT kind, ref, data FROM versions WHERE id = ?').bind(Number(ctx.params.id)).first()
  if (!v) throw new HttpError(404, 'Version introuvable')
  let data
  try { data = JSON.parse(v.data) } catch { throw new HttpError(500, 'Version illisible') }
  await apply(ctx.env, v.kind, v.ref, data, 'Avant restauration')
  await log(ctx, 'warn', 'version_restored', { kind: v.kind, ref: v.ref, id: Number(ctx.params.id) })
  return json({ ok: true })
}
