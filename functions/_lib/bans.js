// Bannissements et protection du site. Tout est vérifié côté serveur, avant d'envoyer la page.
// Les bannissements sont lus dans la base au plus une fois toutes les 20 secondes par serveur (cache en mémoire).
import { getIp, getCountry } from './http.js'
import { getSession } from './session.js'
import { isBot, dayOf, bump } from './stats.js'
import { raiseAlert } from './alerts.js'

export const CONTINENTS = { AF: 'Afrique', AN: 'Antarctique', AS: 'Asie', EU: 'Europe', NA: 'Amérique du Nord', OC: 'Océanie', SA: 'Amérique du Sud' }
const TTL = 20_000
let cache = { at: 0, ip: new Set(), country: new Set(), continent: new Set(), protectedMode: false }
export const forgetBans = () => { cache.at = 0 }

async function load(env) {
  if (Date.now() - cache.at < TTL) return cache
  const [bans, prot] = await env.DB.batch([
    env.DB.prepare('SELECT kind, value FROM bans WHERE expires_at IS NULL OR expires_at > ?').bind(Date.now()),
    env.DB.prepare("SELECT value FROM settings WHERE key = 'site.protectedMode'"),
  ])
  const next = { at: Date.now(), ip: new Set(), country: new Set(), continent: new Set(), protectedMode: false }
  for (const b of bans.results) next[b.kind].add(b.value)
  try { next.protectedMode = JSON.parse(prot.results[0]?.value ?? 'false') === true } catch { /* réglage illisible : mode normal */ }
  return (cache = next)
}

// Limite de requêtes par adresse IP, en mémoire seulement (rien n'est enregistré). Normal : 300/min ; mode protégé : 60/min.
const seen = new Map()
function rate(ip, limit) {
  const now = Date.now(), h = seen.get(ip)
  if (!h || now - h.t > 60_000) { seen.set(ip, { t: now, n: 1 }); if (seen.size > 8000) seen.clear(); return 0 }
  h.n++
  return h.n > limit ? h.n / limit : 0
}

// Blocages comptés en mémoire puis écrits ensemble (une inondation de requêtes ne provoque pas une inondation d'écritures).
const blocked = new Map()
let lastFlush = 0
function count(ctx, what) {
  blocked.set(what, (blocked.get(what) ?? 0) + 1)
  if (Date.now() - lastFlush < 30_000) return
  lastFlush = Date.now()
  const rows = [...blocked].map(([k, n]) => ['blocked', k, n])
  blocked.clear()
  ctx.waitUntil?.(bump(ctx.env, dayOf(), rows).catch(() => {}))
}

const PAGE = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Accès refusé</title><style>body{font:16px/1.5 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f3fbf5;color:#0b1f14;text-align:center;padding:24px}h1{font-size:28px;margin:0 0 8px}p{margin:0;color:#4b5f53}</style><main><h1>Accès refusé</h1><p>Ce site n'est pas accessible depuis ta connexion.</p></main></html>`
const deny = (req, status, extra = {}) => (req.headers.get('Accept') || '').includes('text/html')
  ? new Response(PAGE, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...extra } })
  : new Response(JSON.stringify({ error: status === 429 ? 'Trop de requêtes' : 'Accès refusé' }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } })

// Pose un bannissement automatique. Jamais sur l'adresse d'où l'administrateur s'est connecté récemment.
export async function autoBan(env, ip, ms, reason) {
  if (!ip || ip === '127.0.0.1') return false
  const mine = await env.DB.prepare("SELECT 1 FROM logs WHERE event = 'login_ok' AND ip = ? LIMIT 1").bind(ip).first()
  if (mine) return false
  const now = Date.now()
  const r = await env.DB.prepare("INSERT INTO bans (kind, value, reason, auto, created_at, expires_at) VALUES ('ip', ?, ?, 1, ?, ?) ON CONFLICT (kind, value) DO NOTHING")
    .bind(ip, reason.slice(0, 120), now, now + Math.min(ms, 30 * 86400000)).run()
  if (r.meta?.changes) {
    forgetBans()
    await raiseAlert(env, { level: 'warn', kind: 'auto_ban', title: 'Adresse IP bloquée automatiquement', detail: `IP ${ip} · ${reason}`, key: `auto_ban:${ip}` })
  }
  return !!r.meta?.changes
}

// Appelé pour chaque requête (voir functions/_middleware.js). Renvoie une réponse pour bloquer, ou null pour laisser passer.
export async function guard(ctx) {
  const { request, env } = ctx
  const url = new URL(request.url), path = url.pathname
  const adminArea = path.startsWith('/admin') || path.startsWith('/api/admin')
  const ip = getIp(request)
  const c = await load(env)

  // 1. Bannissement d'une adresse IP : s'applique partout, sauf à l'administrateur connecté (session vérifiée, pas seulement un cookie présent)
  if (c.ip.has(ip)) {
    if (!(await getSession(ctx).catch(() => null))) { count(ctx, 'ip'); return deny(request, 403) }
  }
  // 2. Bannissement d'un pays ou d'un continent : jamais sur l'administration (sinon l'administrateur en déplacement serait enfermé dehors)
  if (!adminArea) {
    const cc = (getCountry(request) || '').toUpperCase(), ct = request.cf?.continent || ''
    if (c.country.has(cc)) { count(ctx, 'country'); return deny(request, 403) }
    if (c.continent.has(ct)) { count(ctx, 'continent'); return deny(request, 403) }
  }
  // 3. Trop de requêtes depuis la même adresse
  if (!adminArea) {
    const over = rate(ip, c.protectedMode ? 60 : 300)
    if (over) {
      count(ctx, 'rate')
      if (over > 3) ctx.waitUntil?.(autoBan(env, ip, 3600_000, 'Trop de requêtes').catch(() => {}))
      return deny(request, 429, { 'Retry-After': '60' })
    }
    // 4. Mode protégé : plus de mesure, et les robots ne lisent plus l'API
    if (c.protectedMode) {
      if (path === '/mesure') return new Response(null, { status: 204 })
      if (path.startsWith('/api/') && isBot(request)) { count(ctx, 'bot'); return deny(request, 403) }
    }
  }
  return null
}
