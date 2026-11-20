// Admin : lire un message, changer son état (nouveau, ouvert, fermé), modifier la note privée, le supprimer.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { log } from '../../../_lib/logger.js'
import { oneOf, str } from '../../../_lib/validate.js'

export const onRequest = (ctx) => route(ctx, { GET, PATCH, DELETE })

const check = (id) => { if (!/^[a-f0-9]{24}$/.test(id)) throw new HttpError(404, 'Message introuvable') }
const find = async (env, id) => {
  const m = await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(id).first()
  if (!m) throw new HttpError(404, 'Message introuvable')
  return m
}

async function GET(ctx) {
  await requireAdmin(ctx)
  check(ctx.params.id)
  return json({ message: await find(ctx.env, ctx.params.id) })
}

async function PATCH(ctx) {
  await requireAdmin(ctx)
  const { id } = ctx.params
  check(id)
  const m = await find(ctx.env, id)
  const b = await readJson(ctx.request, 6000)
  const now = Date.now()
  const status = b.status === undefined ? m.status : oneOf(b.status, ['new', 'open', 'closed'], { name: 'état' })
  const note = b.note === undefined ? m.note : str(b.note, { max: 2000, name: 'note' })
  await ctx.env.DB.prepare('UPDATE messages SET status = ?, note = ?, updated_at = ?, closed_at = ? WHERE id = ?')
    .bind(status, note, now, status === 'closed' ? (m.closed_at ?? now) : null, id).run()
  return json({ ok: true })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  check(ctx.params.id)
  await find(ctx.env, ctx.params.id)
  await ctx.env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(ctx.params.id).run()
  await log(ctx, 'info', 'message_deleted', {})
  return json({ ok: true })
}
