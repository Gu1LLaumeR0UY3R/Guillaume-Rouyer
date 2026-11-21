// Admin : publier tout de suite le brouillon d'un élément.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { apply, checkRef } from '../../../_lib/versions.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  await requireAdmin(ctx)
  const b = await readJson(ctx.request)
  checkRef(b.kind, b.ref)
  const d = await ctx.env.DB.prepare('SELECT data FROM drafts WHERE kind = ? AND ref = ?').bind(b.kind, b.ref).first()
  if (!d) throw new HttpError(404, 'Aucun brouillon')
  await apply(ctx.env, b.kind, b.ref, JSON.parse(d.data), 'Avant publication du brouillon')
  await ctx.env.DB.prepare('DELETE FROM drafts WHERE kind = ? AND ref = ?').bind(b.kind, b.ref).run()
  await log(ctx, 'info', 'draft_published', { kind: b.kind, ref: b.ref })
  return json({ ok: true })
}
