// Connexion : mot de passe + code 2FA. Message d'erreur identique quelle que soit la cause.
import { HttpError, getIp, json, readJson, route } from '../../_lib/http.js'
import { decryptText, hashPassword, safeEqual } from '../../_lib/crypto.js'
import { verifyTotp } from '../../_lib/totp.js'
import { createSession } from '../../_lib/session.js'
import { log } from '../../_lib/logger.js'
import { loginLocked, purgeOld, recordAttempt } from '../../_lib/ratelimit.js'

export const onRequest = (ctx) => route(ctx, { POST })
const DUMMY_SALT = 'AAAAAAAAAAAAAAAAAAAAAA=='

async function POST(ctx) {
  const { env, request } = ctx, ip = getIp(request)
  if (!env.APP_SECRET) throw new HttpError(503, 'Serveur non configuré')
  if (await loginLocked(env, ip)) {
    await log(ctx, 'security', 'login_locked')
    throw new HttpError(429, 'Trop de tentatives, réessaie dans 15 minutes')
  }
  const body = await readJson(request)
  const password = typeof body.password === 'string' && body.password.length <= 128 ? body.password : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  const admin = await env.DB.prepare('SELECT * FROM admin WHERE id = 1 AND confirmed = 1').first()
  // On calcule toujours un hash, même si le compte n'existe pas : le temps de réponse ne révèle rien.
  const hash = await hashPassword(password, admin?.password_salt ?? DUMMY_SALT, env.APP_SECRET)
  const passOk = !!admin && safeEqual(hash, admin.password_hash)
  const step = passOk ? await verifyTotp(await decryptText(admin.totp_secret, env.APP_SECRET), code, admin.totp_last_step) : null

  // Anti-rejeu : un code 2FA ne sert qu'une fois (la mise à jour échoue si un autre appel l'a déjà utilisé).
  const used = step && (await env.DB.prepare('UPDATE admin SET totp_last_step = ? WHERE id = 1 AND totp_last_step < ?').bind(step, step).run()).meta.changes
  if (!passOk || !step || !used) {
    await recordAttempt(env, ip, false)
    await log(ctx, 'security', 'login_failed', { reason: !admin ? 'no_admin' : !passOk ? 'password' : 'code' })
    throw new HttpError(401, 'Identifiants invalides')
  }
  await recordAttempt(env, ip, true)
  const session = await createSession(ctx)
  await log(ctx, 'info', 'login_ok')
  if (Math.random() < 0.1) ctx.waitUntil(purgeOld(env).catch(() => {}))
  return json({ ok: true, csrf: session.csrf }, 200, { 'Set-Cookie': session.cookie })
}
