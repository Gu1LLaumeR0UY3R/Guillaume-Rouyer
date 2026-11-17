// À appeler au début de chaque route réservée à l'admin.
import { HttpError, getIp } from './http.js'
import { decryptText, hashPassword, safeEqual } from './crypto.js'
import { getSession } from './session.js'
import { verifyTotp } from './totp.js'
import { log } from './logger.js'
import { loginLocked, recordAttempt } from './ratelimit.js'

export async function requireAdmin(ctx) {
  const s = await getSession(ctx)
  if (!s) throw new HttpError(401, 'Non connecté')
  if (!['GET', 'HEAD'].includes(ctx.request.method) && !safeEqual(ctx.request.headers.get('X-CSRF-Token') || '', s.csrf)) throw new HttpError(403, 'Jeton CSRF invalide')
  return s
}

// Opérations sensibles (mot de passe, 2FA) : même avec une session ouverte, on redemande mot de passe + code 2FA.
// Les échecs comptent dans la limitation des tentatives de connexion.
export async function confirmIdentity(ctx, password, code) {
  const { env, request } = ctx, ip = getIp(request)
  if (!env.APP_SECRET) throw new HttpError(503, 'Serveur non configuré')
  if (await loginLocked(env, ip)) {
    await log(ctx, 'security', 'login_locked')
    throw new HttpError(429, 'Trop de tentatives, réessaie dans 15 minutes')
  }
  const admin = await env.DB.prepare('SELECT * FROM admin WHERE id = 1 AND confirmed = 1').first()
  const pass = typeof password === 'string' && password.length <= 128 ? password : ''
  const hash = await hashPassword(pass, admin?.password_salt ?? 'AAAAAAAAAAAAAAAAAAAAAA==', env.APP_SECRET)
  const passOk = !!admin && safeEqual(hash, admin.password_hash)
  const step = passOk ? await verifyTotp(await decryptText(admin.totp_secret, env.APP_SECRET), typeof code === 'string' ? code.trim() : '', admin.totp_last_step) : null
  // Anti-rejeu : le code ne sert qu'une fois
  const used = step && (await env.DB.prepare('UPDATE admin SET totp_last_step = ? WHERE id = 1 AND totp_last_step < ?').bind(step, step).run()).meta.changes
  if (!passOk || !step || !used) {
    await recordAttempt(env, ip, false)
    await log(ctx, 'security', 'reauth_failed')
    throw new HttpError(401, 'Mot de passe ou code invalide (attends le prochain code si tu viens de te connecter)')
  }
  return admin
}
