// Public : réception des mesures d'audience (hors /api : ne passe pas par les journaux de sécurité).
// Répond toujours 204 : un refus ne doit rien révéler ni gêner le visiteur.
import { getCountry, getIp, readJson } from './_lib/http.js'
import { DAY_CAP, bump, cleanPath, dayOf, deviceOf, isBot, refHost } from './_lib/stats.js'

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
const hits = new Map() // limite par adresse IP, en mémoire seulement (rien n'est enregistré)
function tooFast(ip) {
  const now = Date.now(), h = hits.get(ip)
  if (!h || now - h.t > 60_000) { hits.set(ip, { t: now, n: 1 }); if (hits.size > 5000) hits.clear(); return false }
  return ++h.n > 90
}
const CLICKS = ['email', 'github', 'linkedin']

export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx
    const h = request.headers
    if (h.get('Origin') !== new URL(request.url).origin) return done()
    if (h.get('DNT') === '1' || h.get('Sec-GPC') === '1') return done() // « Ne pas me suivre » respecté
    if ((h.get('Cookie') || '').includes('__Host-session=')) return done() // l'administrateur connecté n'est pas compté
    if (isBot(request) || tooFast(getIp(request))) return done()

    const b = await readJson(request, 600)
    const day = dayOf()
    const cap = await env.DB.prepare("SELECT n FROM stat_daily WHERE day = ? AND kind = 'events' AND key = 'all'").bind(day).first()
    if ((cap?.n ?? 0) >= DAY_CAP) return done()
    const rows = [['events', 'all', 1]]

    if (b.t === 'view') {
      const path = cleanPath(b.path)
      if (!path) return done()
      const cc = (getCountry(request) || 'XX').toUpperCase().slice(0, 2)
      rows.push(['view', path, 1], ['country', /^[A-Z]{2}$/.test(cc) ? cc : 'XX', 1], ['continent', request.cf?.continent || '??', 1], ['device', deviceOf(h.get('User-Agent') || ''), 1])
      if (b.first === true) {
        let r = refHost(b.ref, new URL(request.url).hostname)
        if (r && r !== '(direct)') {
          const known = await env.DB.prepare("SELECT 1 FROM stat_daily WHERE day = ? AND kind = 'ref' AND key = ?").bind(day, r).first()
          const n = known ? 0 : (await env.DB.prepare("SELECT COUNT(*) n FROM stat_daily WHERE day = ? AND kind = 'ref'").bind(day).first()).n
          if (n >= 150) r = '(autres)'
        }
        if (r) rows.push(['ref', r, 1])
      }
    } else if (b.t === 'time') {
      const path = cleanPath(b.path), s = Math.round(Number(b.s))
      if (!path || !(s >= 2)) return done()
      rows.push(['time_sum', path, Math.min(s, 1800)], ['time_cnt', path, 1])
    } else if (b.t === 'click') {
      if (!CLICKS.includes(b.k)) return done()
      rows.push(['click', b.k, 1])
    } else if (b.t === 'theme') {
      if (!['light', 'dark'].includes(b.v)) return done()
      rows.push(['theme', b.v, 1])
    } else if (b.t === 'tree') {
      rows.push(['tree', 'planted', 1])
    } else return done()

    await bump(env, day, rows)
  } catch { /* une mesure perdue n'est pas grave */ }
  return done()
}
export const onRequest = (ctx) => (ctx.request.method === 'POST' ? onRequestPost(ctx) : new Response(null, { status: 405, headers: { Allow: 'POST' } }))
