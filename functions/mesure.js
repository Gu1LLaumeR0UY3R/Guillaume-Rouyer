// Public : réception des mesures d'audience (hors /api : ne passe pas par les journaux de sécurité).
// Répond toujours 204 : un refus ne doit rien révéler ni gêner le visiteur.
import { getCountry, getIp, readJson } from './_lib/http.js'
import { raiseAlert } from './_lib/alerts.js'
import { clearCookie, dayHash, newVisitor, readVisitor, visitorCookie } from './_lib/visitor.js'
import { DAY_CAP, bump, cleanPath, dayOf, deviceOf, isBot, refHost } from './_lib/stats.js'

const done = (cookie) => new Response(null, { status: 204, headers: cookie ? { 'Cache-Control': 'no-store', 'Set-Cookie': cookie } : { 'Cache-Control': 'no-store' } })
const hits = new Map() // limite par adresse IP, en mémoire seulement (rien n'est enregistré)
function tooFast(ip) {
  const now = Date.now(), h = hits.get(ip)
  if (!h || now - h.t > 60_000) { hits.set(ip, { t: now, n: 1 }); if (hits.size > 5000) hits.clear(); return false }
  return ++h.n > 90
}
let warned = '' // une seule alerte de quota par jour et par serveur (la base les regroupe aussi)
const CLICKS = ['email', 'github', 'linkedin', 'cv']

export async function onRequestPost(ctx) {
  let setCookie = null
  try {
    const { request, env } = ctx
    const h = request.headers
    if (h.get('Origin') !== new URL(request.url).origin) return done()
    if (h.get('DNT') === '1' || h.get('Sec-GPC') === '1') return done() // « Ne pas me suivre » respecté
    if ((h.get('Cookie') || '').includes('__Host-session=')) return done() // l'administrateur connecté n'est pas compté
    if (isBot(request) || tooFast(getIp(request))) return done()

    const b = await readJson(request, 600)
    const day = dayOf()
    if (b.t === 'optout') return done(clearCookie()) // le visiteur retire son accord : on efface son cookie d'audience
    const cap = await env.DB.prepare("SELECT n FROM stat_daily WHERE day = ? AND kind = 'events' AND key = 'all'").bind(day).first()
    const used = cap?.n ?? 0
    if (used >= DAY_CAP) {
      if (warned !== day + 'full') { warned = day + 'full'; await raiseAlert(env, { level: 'warn', kind: 'quota', title: 'Mesure d\'audience arrêtée jusqu\'à demain', detail: `${DAY_CAP} événements atteints aujourd'hui. Si ce n'est pas un vrai pic de visites, active le mode protégé.`, key: `quota_full:${day}` }) }
      return done()
    }
    if (used >= DAY_CAP * 0.8 && warned !== day + 'soon') { warned = day + 'soon'; await raiseAlert(env, { level: 'warn', kind: 'quota', title: 'Mesure d\'audience à 80 % du plafond du jour', detail: `${used} / ${DAY_CAP} événements. Un pic inhabituel peut venir d'un robot : regarde les statistiques.`, key: `quota_soon:${day}` }) }
    const rows = [['events', 'all', 1]]
    // Visiteur unique du jour : seulement si le visiteur a donné son accord (b.c === 1). Le cookie n'est créé qu'une fois.
    const visitor = async () => {
      if (b.c !== 1) return
      const day8 = day.replaceAll('-', '')
      let v = readVisitor(h.get('Cookie'))
      if (!v) { v = newVisitor(day8); setCookie = visitorCookie(v) }
      const ins = await env.DB.prepare('INSERT OR IGNORE INTO vis_day (day, h) VALUES (?, ?)').bind(day, await dayHash(env, day, v.id)).run()
      if (ins.meta.changes) rows.push(['uniq', 'all', 1], ['uniq', v.first === day8 ? 'new' : 'ret', 1])
    }

    if (b.t === 'view') {
      const path = cleanPath(b.path)
      if (!path) return done()
      const cc = (getCountry(request) || 'XX').toUpperCase().slice(0, 2)
      await visitor()
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
    } else if (b.t === 'visit') { // accord donné en cours de visite : on compte le visiteur sans ajouter de page vue
      await visitor()
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
  return done(setCookie)
}
export const onRequest = (ctx) => (ctx.request.method === 'POST' ? onRequestPost(ctx) : new Response(null, { status: 405, headers: { Allow: 'POST' } }))
