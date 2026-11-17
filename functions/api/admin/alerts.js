// Admin : liste des alertes, marquer comme lues, supprimer.
import { HttpError, json, readJson, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { int, oneOf } from '../../_lib/validate.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  await requireAdmin(ctx)
  const q = new URL(ctx.request.url).searchParams
  const limit = int(q.get('limit'), { min: 1, max: 100, def: 50, name: 'limit' })
  const before = int(q.get('before'), { min: 1, max: 2 ** 40, def: 0, name: 'before' })
  const filter = oneOf(q.get('filter'), ['all', 'unread'], { def: 'all', name: 'filtre' })
  let sql = 'SELECT id, at, level, kind, title, detail, count, is_read FROM alerts WHERE 1 = 1'
  const args = []
  if (filter === 'unread') sql += ' AND is_read = 0'
  if (before) { sql += ' AND id < ?'; args.push(before) }
  sql += ' ORDER BY id DESC LIMIT ?'; args.push(limit)
  const { results } = await ctx.env.DB.prepare(sql).bind(...args).all()
  return json({ alerts: results.map((a) => ({ ...a, is_read: !!a.is_read })), next: results.length === limit ? results[results.length - 1].id : null })
}

// Actions : read (ids), readAll, delete (ids), deleteRead
async function POST(ctx) {
  await requireAdmin(ctx)
  const body = await readJson(ctx.request)
  const action = oneOf(body.action, ['read', 'readAll', 'delete', 'deleteRead'], { name: 'action' })
  if (!action) throw new HttpError(400, 'Action manquante')
  const { DB } = ctx.env
  if (action === 'readAll') await DB.prepare('UPDATE alerts SET is_read = 1 WHERE is_read = 0').run()
  else if (action === 'deleteRead') await DB.prepare('DELETE FROM alerts WHERE is_read = 1').run()
  else {
    const ids = body.ids
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some((i) => !Number.isInteger(i) || i < 1)) throw new HttpError(400, 'Liste invalide')
    const marks = ids.map(() => '?').join(',') // seul le nombre de « ? » dépend du client ; les valeurs passent par bind()
    await DB.prepare(action === 'read' ? `UPDATE alerts SET is_read = 1 WHERE id IN (${marks})` : `DELETE FROM alerts WHERE id IN (${marks})`).bind(...ids).run()
  }
  return json({ ok: true })
}
