// Sessions : le navigateur garde un jeton aléatoire dans un cookie HttpOnly ; la base ne garde que son hash.
import { randomToken, sha256Hex } from './crypto.js'

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

export async function createSession({ env }) {
  const token = randomToken(32), csrf = randomToken(16), now = Date.now()
  await env.DB.prepare('INSERT INTO sessions (id_hash, csrf, created_at, expires_at, last_seen) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), csrf, now, now + TTL, now).run()
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
