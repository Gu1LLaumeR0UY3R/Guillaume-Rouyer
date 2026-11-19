// Admin : bannissements (pays, continent, adresse IP) et état de la protection.
import { HttpError, getCountry, getIp, json, readJson, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { CONTINENTS, forgetBans } from '../../_lib/bans.js'
import { getSettings } from '../../_lib/settings.js'
import { dayOf } from '../../_lib/stats.js'
import { int, oneOf, str } from '../../_lib/validate.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST, DELETE })

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/
const IPV6 = /^(?=.*:.*:)[0-9a-f:]{2,39}$/i
const DAY = 86400000

async function GET(ctx) {
  await requireAdmin(ctx)
  const { env, request } = ctx, now = Date.now()
  const [bans, blocked, settings] = await Promise.all([
    env.DB.prepare('SELECT id, kind, value, reason, auto, created_at, expires_at FROM bans WHERE expires_at IS NULL OR expires_at > ? ORDER BY created_at DESC').bind(now).all(),
    env.DB.prepare("SELECT key, SUM(n) AS n FROM stat_daily WHERE kind = 'blocked' AND day >= ? GROUP BY key").bind(dayOf(now - 29 * DAY)).all(),
    getSettings(env),
  ])
  return json({
    bans: bans.results.map((b) => ({ ...b, auto: !!b.auto })),
    blocked: Object.fromEntries(blocked.results.map((r) => [r.key, r.n])),
    protectedMode: settings.protectedMode,
    you: { ip: getIp(request), country: getCountry(request), continent: request.cf?.continent ?? null },
  })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const { env, request } = ctx
  const b = await readJson(request)
  const kind = oneOf(b.kind, ['country', 'continent', 'ip'], { name: 'type' })
  if (!kind) throw new HttpError(400, 'Type de bannissement manquant')
  const value = str(String(b.value ?? '').trim(), { min: 1, max: 45, name: 'valeur' })
  const reason = str(String(b.reason ?? '').trim(), { max: 120, name: 'raison' })

  const you = { ip: getIp(request), country: (getCountry(request) || '').toUpperCase(), continent: request.cf?.continent || '' }
  let v = value
  if (kind === 'country') {
    v = value.toUpperCase()
    if (!/^[A-Z]{2}$/.test(v) || v === 'XX') throw new HttpError(400, 'Code pays invalide')
    if (v === you.country) throw new HttpError(400, 'Tu es connecté depuis ce pays : tu te bannirais toi-même.')
  } else if (kind === 'continent') {
    v = value.toUpperCase()
    if (!CONTINENTS[v]) throw new HttpError(400, 'Continent invalide')
    if (v === you.continent) throw new HttpError(400, 'Tu es connecté depuis ce continent : tu te bannirais toi-même.')
  } else {
    v = value.toLowerCase()
    if (!IPV4.test(v) && !IPV6.test(v)) throw new HttpError(400, 'Adresse IP invalide')
    if (v === you.ip) throw new HttpError(400, 'C\'est ton adresse actuelle : tu te bannirais toi-même.')
  }

  // Durée en heures : obligatoire pour une IP (30 jours maximum, par respect de la vie privée), facultative pour un pays ou un continent.
  const hours = int(b.hours, { min: 1, max: 720, def: null, name: 'durée' })
  if (kind === 'ip' && !hours) throw new HttpError(400, 'Une adresse IP est bannie pour 30 jours au plus : choisis une durée.')
  const now = Date.now(), expires = hours ? now + hours * 3600_000 : null
  await env.DB.prepare('INSERT INTO bans (kind, value, reason, auto, created_at, expires_at) VALUES (?, ?, ?, 0, ?, ?) ON CONFLICT (kind, value) DO UPDATE SET reason = excluded.reason, auto = 0, created_at = excluded.created_at, expires_at = excluded.expires_at')
    .bind(kind, v, reason, now, expires).run()
  forgetBans()
  await log(ctx, 'security', 'ban_added', { kind, value: kind === 'ip' ? '[adresse]' : v, hours })
  return json({ ok: true }, 201)
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const id = int(new URL(ctx.request.url).searchParams.get('id'), { min: 1, max: 2 ** 31, name: 'identifiant' })
  const row = await ctx.env.DB.prepare('SELECT kind, value FROM bans WHERE id = ?').bind(id).first()
  if (!row) throw new HttpError(404, 'Bannissement introuvable')
  await ctx.env.DB.prepare('DELETE FROM bans WHERE id = ?').bind(id).run()
  forgetBans()
  await log(ctx, 'security', 'ban_removed', { kind: row.kind, value: row.kind === 'ip' ? '[adresse]' : row.value })
  return json({ ok: true })
}
