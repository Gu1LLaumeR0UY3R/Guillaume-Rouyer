// Admin : pastilles de la barre latérale et dernière alerte (interrogé régulièrement par l'interface pour afficher les notifications).
import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET(ctx) {
  await requireAdmin(ctx)
  const [unread, latest, msgs, lastMsg] = await ctx.env.DB.batch([
    ctx.env.DB.prepare('SELECT COUNT(*) AS n FROM alerts WHERE is_read = 0'),
    ctx.env.DB.prepare('SELECT id, at, level, title FROM alerts WHERE is_read = 0 ORDER BY at DESC LIMIT 1'),
    ctx.env.DB.prepare("SELECT COUNT(*) AS n FROM messages WHERE status = 'new'"),
    ctx.env.DB.prepare("SELECT created_at AS at, name FROM messages WHERE status = 'new' ORDER BY created_at DESC LIMIT 1"),
  ])
  return json({ alerts: unread.results[0].n, latest: latest.results[0] ?? null, messages: msgs.results[0].n, latestMessage: lastMsg.results[0] ?? null })
}
