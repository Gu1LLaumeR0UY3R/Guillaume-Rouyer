// Admin : liste des messages reçus par le formulaire de contact, avec compteurs par état.
import { json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'

export const onRequest = (ctx) => route(ctx, { GET })

const STATUSES = ['new', 'open', 'closed']

async function GET(ctx) {
  await requireAdmin(ctx)
  const url = new URL(ctx.request.url)
  const status = url.searchParams.get('status')
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
  const where = [], args = []
  if (STATUSES.includes(status)) { where.push('status = ?'); args.push(status) }
  if (q) { where.push("(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')"); const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`; args.push(like, like, like, like) }
  const [rows, counts] = await ctx.env.DB.batch([
    ctx.env.DB.prepare(`SELECT id, name, email, subject, substr(body, 1, 160) AS preview, status, note != '' AS has_note, created_at FROM messages ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 200`).bind(...args),
    ctx.env.DB.prepare('SELECT status, COUNT(*) AS n FROM messages GROUP BY status'),
  ])
  const c = { new: 0, open: 0, closed: 0 }
  for (const r of counts.results) c[r.status] = r.n
  return json({ messages: rows.results.map((r) => ({ ...r, has_note: !!r.has_note })), counts: c })
}
