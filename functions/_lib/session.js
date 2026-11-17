// Sessions : le navigateur garde un jeton aléatoire dans un cookie HttpOnly ; la base ne garde que son hash.
import { randomToken, sha256Hex } from './crypto.js'
import { getCountry, getIp } from './http.js'

const COOKIE = '__Host-session' // le préfixe __Host- impose Secure + Path=/ et interdit le partage avec un sous-domaine
const TTL = 8 * 3600 * 1000 // 8 h maximum
const IDLE = 60 * 60 * 1000 // déconnexion après 1 h d'inactivité

const cookie = (v, maxAge) => `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
export const clearCookie = () => cookie('', 0)

function readCookie(request) {
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return part.slice(i + 1).trim()
  }
  return null
}

export async function createSession({ env, request }) {
  const token = randomToken(32), csrf = randomToken(16), now = Date.now()
  const ua = (request.headers.get('User-Agent') || '').replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, 200)
  await env.DB.prepare('INSERT INTO sessions (id_hash, csrf, created_at, expires_at, last_seen, ip, ua, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), csrf, now, now + TTL, now, getIp(request), ua, getCountry(request)).run()
  return { csrf, cookie: cookie(token, TTL / 1000) }
}

export async function getSession({ env, request }) {
  const token = readCookie(request)
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null
  const idHash = await sha256Hex(token), now = Date.now()
  const row = await env.DB.prepare('SELECT csrf, expires_at, last_seen FROM sessions WHERE id_hash = ?').bind(idHash).first()
  if (!row) return null
  if (row.expires_at < now || now - row.last_seen > IDLE) { await destroySession({ env }, idHash); return null }
  if (now - row.last_seen > 60000) await env.DB.prepare('UPDATE sessions SET last_seen = ? WHERE id_hash = ?').bind(now, idHash).run()
  return { idHash, csrf: row.csrf }
}

export const destroySession = ({ env }, idHash) => env.DB.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(idHash).run()

// Ferme toutes les sessions sauf la courante (après un changement de mot de passe ou de 2FA).
export const destroyOtherSessions = ({ env }, idHash) => env.DB.prepare('DELETE FROM sessions WHERE id_hash != ?').bind(idHash).run()

// Liste des sessions encore valides. L'identifiant affiché n'est que le début du hash : il ne permet pas de reconstituer le cookie.
export async function listSessions({ env }, currentHash) {
  const now = Date.now()
  const { results } = await env.DB.prepare('SELECT id_hash, created_at, last_seen, ip, ua, country FROM sessions WHERE expires_at > ? AND last_seen > ? ORDER BY last_seen DESC')
    .bind(now, now - IDLE).all()
  return results.map((r) => ({ id: r.id_hash.slice(0, 16), createdAt: r.created_at, lastSeen: r.last_seen, ip: r.ip, ua: r.ua, country: r.country, current: r.id_hash === currentHash }))
}

// Ferme une session désignée par son identifiant court (jamais la session courante : pour celle-là, « Se déconnecter »).
export async function revokeSession({ env }, shortId, currentHash) {
  if (!/^[0-9a-f]{16}$/.test(shortId) || currentHash.startsWith(shortId)) return 0
  return (await env.DB.prepare('DELETE FROM sessions WHERE id_hash LIKE ? AND id_hash != ?').bind(`${shortId}%`, currentHash).run()).meta.changes
}
