// Admin : données du tableau de bord (un seul appel).
import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { getSettings } from '../../_lib/settings.js'

export const onRequest = (ctx) => route(ctx, { GET })

const DAY = 86400000

async function GET(ctx) {
  await requireAdmin(ctx)
  const { env } = ctx, now = Date.now()
  const [byStatus, lastEdit, last24h, unread, latest, logins, perDay] = await env.DB.batch([
    env.DB.prepare('SELECT status, COUNT(*) AS n FROM projects GROUP BY status'),
    env.DB.prepare('SELECT name, slug, updated_at FROM projects ORDER BY updated_at DESC LIMIT 1'),
    env.DB.prepare("SELECT event, COUNT(*) AS n FROM logs WHERE at > ? AND event IN ('login_ok', 'login_failed', 'login_locked', 'origin_refused', 'unhandled') GROUP BY event").bind(now - DAY),
    env.DB.prepare('SELECT COUNT(*) AS n FROM alerts WHERE is_read = 0'),
    env.DB.prepare('SELECT id, at, level, title, detail, count, is_read FROM alerts ORDER BY at DESC LIMIT 5'),
    env.DB.prepare("SELECT at, ip, country FROM logs WHERE event = 'login_ok' ORDER BY id DESC LIMIT 6"),
    env.DB.prepare("SELECT strftime('%Y-%m-%d', at / 1000, 'unixepoch') AS day, level, COUNT(*) AS n FROM logs WHERE at > ? GROUP BY day, level").bind(now - 7 * DAY),
  ])

  const statuses = { online: 0, wip: 0, maintenance: 0, hidden: 0 }
  for (const r of byStatus.results) statuses[r.status] = r.n
  const events = {}
  for (const r of last24h.results) events[r.event] = r.n

  // 7 jours glissants, jours vides compris ; « sensibles » = avertissements, erreurs et événements de sécurité
  const days = {}
  for (let i = 6; i >= 0; i--) days[new Date(now - i * DAY).toISOString().slice(0, 10)] = { day: '', total: 0, sensitive: 0 }
  for (const r of perDay.results) {
    const d = days[r.day]
    if (!d) continue
    d.total += r.n
    if (r.level !== 'info') d.sensitive += r.n
  }
  const activity = Object.entries(days).map(([day, v]) => ({ ...v, day }))

  const settings = await getSettings(env)
  const health = [
    { id: 'db', ok: true, label: 'Base de données joignable' },
    { id: 'secret', ok: !!env.APP_SECRET, label: 'Secret de l\'application configuré', hint: 'Ajoute le secret APP_SECRET (voir functions/LISEZMOI.md).' },
    { id: 'setup', ok: !env.SETUP_TOKEN, label: 'Jeton d\'installation supprimé', hint: 'Supprime le secret SETUP_TOKEN : il ne sert plus une fois le compte créé.' },
    { id: 'maintenance', ok: !settings.maintenanceOn, label: settings.maintenanceOn ? 'Maintenance globale ACTIVE : le public ne voit pas le site' : 'Site ouvert au public' },
  ]

  return json({
    projects: { total: Object.values(statuses).reduce((a, b) => a + b, 0), statuses, lastEdit: lastEdit.results[0] ?? null },
    last24h: { loginOk: events.login_ok ?? 0, loginFailed: events.login_failed ?? 0, loginLocked: events.login_locked ?? 0, originRefused: events.origin_refused ?? 0, errors: events.unhandled ?? 0 },
    alerts: { unread: unread.results[0].n, latest: latest.results.map((a) => ({ ...a, is_read: !!a.is_read })) },
    logins: logins.results,
    activity,
    health,
    maintenanceOn: settings.maintenanceOn,
  })
}
