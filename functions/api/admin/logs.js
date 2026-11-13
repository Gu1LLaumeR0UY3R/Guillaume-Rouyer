// Consultation des journaux (admin). Les paramètres sont validés ; les valeurs passent par bind(), jamais dans le SQL.
import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { int, oneOf } from '../../_lib/validate.js'
import { LEVELS } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET(ctx) {
  await requireAdmin(ctx)
  const q = new URL(ctx.request.url).searchParams
  const limit = int(q.get('limit'), { min: 1, max: 200, def: 50, name: 'limit' })
  const before = int(q.get('before'), { min: 1, max: 2 ** 40, def: 0, name: 'before' })
  const level = oneOf(q.get('level'), LEVELS, { name: 'niveau' })
  let sql = 'SELECT id, at, level, event, ip, country, path, meta FROM logs WHERE 1 = 1'
  const args = []
  if (level) { sql += ' AND level = ?'; args.push(level) }
  if (before) { sql += ' AND id < ?'; args.push(before) }
  sql += ' ORDER BY id DESC LIMIT ?'; args.push(limit)
  const { results } = await ctx.env.DB.prepare(sql).bind(...args).all()
  return json({ logs: results })
}
