// À appeler au début de chaque route réservée à l'admin.
import { HttpError } from './http.js'
import { safeEqual } from './crypto.js'
import { getSession } from './session.js'

export async function requireAdmin(ctx) {
  const s = await getSession(ctx)
  if (!s) throw new HttpError(401, 'Non connecté')
  if (!['GET', 'HEAD'].includes(ctx.request.method) && !safeEqual(ctx.request.headers.get('X-CSRF-Token') || '', s.csrf)) throw new HttpError(403, 'Jeton CSRF invalide')
  return s
}
