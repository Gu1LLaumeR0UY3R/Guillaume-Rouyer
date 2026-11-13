// Réponses JSON et vérifications communes.
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

const BASE = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
}
export const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...BASE, ...extra } })

export const getIp = (req) => req.headers.get('CF-Connecting-IP') || '127.0.0.1'
export const getCountry = (req) => req.cf?.country || req.headers.get('CF-IPCountry') || null

// Anti-CSRF : une requête qui modifie quelque chose doit venir de notre propre site.
export const sameOrigin = (req) => req.headers.get('Origin') === new URL(req.url).origin

export async function readJson(req, max = 4096) {
  if (!(req.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Type de contenu invalide')
  if (Number(req.headers.get('Content-Length') || 0) > max) throw new HttpError(413, 'Corps trop volumineux')
  const text = await req.text()
  if (text.length > max) throw new HttpError(413, 'Corps trop volumineux')
  try {
    const v = JSON.parse(text)
    if (v === null || typeof v !== 'object' || Array.isArray(v)) throw new Error()
    return v
  } catch { throw new HttpError(400, 'JSON invalide') }
}

// Une fonction par méthode HTTP ; les autres reçoivent 405 (au lieu de tomber sur la page du site).
export function route(ctx, handlers) {
  const h = handlers[ctx.request.method]
  return h ? h(ctx) : json({ error: 'Méthode non autorisée' }, 405, { Allow: Object.keys(handlers).join(', ') })
}
