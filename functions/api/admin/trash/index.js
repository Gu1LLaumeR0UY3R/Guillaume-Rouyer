// Admin : corbeille (GET liste, POST { id } restaure, DELETE ?id= efface définitivement, DELETE sans id vide la corbeille).
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { KEEP_DAYS, purgeOld, restore } from '../../../_lib/trash.js'
import { int } from '../../../_lib/validate.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST, DELETE })

async function GET(ctx) {
  await requireAdmin(ctx)
  await purgeOld(ctx.env)
  const { results } = await ctx.env.DB.prepare('SELECT id, kind, ref, title, deleted_at FROM trash ORDER BY deleted_at DESC').all()
  return json({ keepDays: KEEP_DAYS, items: results.map((r) => ({ id: r.id, kind: r.kind, ref: r.ref, title: r.title, deletedAt: r.deleted_at })) })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const b = await readJson(ctx.request)
  const id = int(b.id, { min: 1, max: 2 ** 31, name: 'identifiant' })
  const r = await restore(ctx.env, id)
  await log(ctx, 'info', 'trash_restored', r)
  return json({ ok: true, ...r })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const raw = new URL(ctx.request.url).searchParams.get('id')
  if (raw === null) {
    await ctx.env.DB.prepare('DELETE FROM trash').run()
    await log(ctx, 'warn', 'trash_emptied', {})
  } else {
    const id = int(raw, { min: 1, max: 2 ** 31, name: 'identifiant' })
    const res = await ctx.env.DB.prepare('DELETE FROM trash WHERE id = ?').bind(id).run()
    if (!res.meta.changes) throw new HttpError(404, 'Élément introuvable dans la corbeille')
    await log(ctx, 'warn', 'trash_purged', { id })
  }
  return json({ ok: true })
}
