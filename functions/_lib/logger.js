// Journaux : chaque événement est écrit dans la console Cloudflare ET dans la table `logs` (consultable dans l'admin).
import { getIp, getCountry } from './http.js'

export const LEVELS = ['info', 'warn', 'error', 'security']
const SECRET_KEY = /pass|code|token|secret|cookie|authorization|csrf/i

// Retire les retours à la ligne et caractères de contrôle : impossible de forger de fausses lignes de log.
export const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max)

function redact(v, depth = 0) {
  if (v == null || depth > 3) return v
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => redact(x, depth + 1))
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, SECRET_KEY.test(k) ? '[masqué]' : redact(x, depth + 1)]))
  return typeof v === 'string' ? clean(v, 300) : v
}

export async function log(ctx, level, event, meta = {}) {
  const { request, env } = ctx
  const row = {
    at: Date.now(), level, event: clean(event, 60), ip: getIp(request), country: getCountry(request),
    path: clean(new URL(request.url).pathname), ua: clean(request.headers.get('User-Agent')), meta: JSON.stringify(redact(meta)).slice(0, 2000),
  }
  console.log(JSON.stringify(row))
  const p = env.DB.prepare('INSERT INTO logs (at, level, event, ip, country, path, ua, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(row.at, row.level, row.event, row.ip, row.country, row.path, row.ua, row.meta).run()
    .catch((e) => console.error('log_db_error', e.message))
  if (ctx.waitUntil) ctx.waitUntil(p); else await p
}
