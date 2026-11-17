// Public : sert une image du gestionnaire de médias. L'identifiant est aléatoire et jamais réutilisé,
// donc le navigateur et Cloudflare peuvent la garder très longtemps (la base n'est presque pas sollicitée).
import { fromBase64, ID_RE } from '../_lib/media.js'

const H = { 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' }

export async function onRequestGet({ request, env, params, waitUntil }) {
  const id = String(params.id || '').replace(/\.[a-z0-9]{2,5}$/i, '') // /media/<id> ou /media/<id>.webp
  if (!ID_RE.test(id)) return new Response('Introuvable', { status: 404, headers: H })
  const cache = caches.default
  const key = new Request(new URL(`/media/${id}`, request.url).toString())
  const hit = await cache.match(key)
  if (hit) return hit
  const row = await env.DB.prepare('SELECT mime, data FROM media WHERE id = ? AND deleted_at IS NULL').bind(id).first()
  if (!row) return new Response('Introuvable', { status: 404, headers: { ...H, 'Cache-Control': 'public, max-age=60' } })
  const res = new Response(fromBase64(row.data), { headers: { ...H, 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=86400' } })
  waitUntil?.(cache.put(key, res.clone()))
  return res
}
