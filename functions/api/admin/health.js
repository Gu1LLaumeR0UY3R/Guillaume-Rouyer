// Admin : santé du site (base de données, espace des médias, erreurs récentes, quotas surveillés).
import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { MAX_TOTAL } from '../../_lib/media.js'
import { DAY_CAP, dayOf } from '../../_lib/stats.js'

export const onRequest = (ctx) => route(ctx, { GET })

const DAY = 86400000

async function GET(ctx) {
  await requireAdmin(ctx)
  const { env } = ctx, now = Date.now()
  const t0 = Date.now()
  await env.DB.prepare('SELECT 1').first()
  const latency = Date.now() - t0

  const [media, logs, errors, alerts, bans, today, lastErr] = await env.DB.batch([
    env.DB.prepare('SELECT COALESCE(SUM(size), 0) AS bytes, COUNT(*) AS n FROM media'),
    env.DB.prepare('SELECT COUNT(*) AS n, MIN(at) AS oldest FROM logs'),
    env.DB.prepare("SELECT COUNT(*) AS n FROM logs WHERE at > ? AND level = 'error'").bind(now - DAY),
    env.DB.prepare('SELECT COUNT(*) AS n FROM alerts WHERE is_read = 0'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM bans WHERE expires_at IS NULL OR expires_at > ?').bind(now),
    env.DB.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM stat_daily WHERE kind = 'events' AND day = ?").bind(dayOf(now)),
    env.DB.prepare("SELECT at, event FROM logs WHERE level = 'error' ORDER BY id DESC LIMIT 5"),
  ])
  return json({
    db: { ok: true, latencyMs: latency },
    media: { bytes: media.results[0].bytes, count: media.results[0].n, max: MAX_TOTAL },
    logs: { count: logs.results[0].n, oldest: logs.results[0].oldest },
    errors24h: errors.results[0].n,
    lastErrors: lastErr.results,
    unreadAlerts: alerts.results[0].n,
    activeBans: bans.results[0].n,
    stats: { eventsToday: today.results[0].n, cap: DAY_CAP },
  })
}
