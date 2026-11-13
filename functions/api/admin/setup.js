// Installation unique du compte admin, en 2 phases :
//  start   : jeton d'installation + mot de passe -> renvoie le secret 2FA à scanner
//  confirm : premier code 2FA -> active le compte
// Une fois confirmé, cette route refuse tout (409).
import { HttpError, json, readJson, route } from '../../_lib/http.js'
import { decryptText, encryptText, hashPassword, newSalt, safeEqual } from '../../_lib/crypto.js'
import { generateSecret, otpauthUri, verifyTotp } from '../../_lib/totp.js'
import { checkPassword, str } from '../../_lib/validate.js'
import { log } from '../../_lib/logger.js'
import { loginLocked, recordAttempt } from '../../_lib/ratelimit.js'
import { getIp } from '../../_lib/http.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  const { env, request } = ctx
  if (!env.APP_SECRET || !env.SETUP_TOKEN) throw new HttpError(503, 'Serveur non configuré')
  if (await loginLocked(env, getIp(request))) throw new HttpError(429, 'Trop de tentatives, réessaie plus tard')
  const body = await readJson(request)

  if (!safeEqual(str(body.token, { min: 1, max: 200, name: 'jeton' }), env.SETUP_TOKEN)) {
    await recordAttempt(env, getIp(request), false)
    await log(ctx, 'security', 'setup_bad_token')
    throw new HttpError(403, 'Jeton invalide')
  }
  const admin = await env.DB.prepare('SELECT confirmed, totp_secret FROM admin WHERE id = 1').first()
  if (admin?.confirmed) { await log(ctx, 'security', 'setup_already_done'); throw new HttpError(409, 'Déjà configuré') }

  if (body.phase === 'start') {
    const password = str(body.password, { min: 14, max: 128, name: 'mot de passe' })
    checkPassword(password)
    const salt = newSalt(), secret = generateSecret()
    await env.DB.prepare('INSERT OR REPLACE INTO admin (id, password_hash, password_salt, totp_secret, totp_last_step, confirmed, created_at) VALUES (1, ?, ?, ?, 0, 0, ?)')
      .bind(await hashPassword(password, salt, env.APP_SECRET), salt, await encryptText(secret, env.APP_SECRET), Date.now()).run()
    await log(ctx, 'info', 'setup_started')
    return json({ secret, uri: otpauthUri(secret) })
  }
  if (body.phase === 'confirm') {
    if (!admin) throw new HttpError(409, 'Lance d\'abord l\'étape 1')
    const step = await verifyTotp(await decryptText(admin.totp_secret, env.APP_SECRET), str(body.code, { max: 6, name: 'code' }), 0)
    if (!step) { await log(ctx, 'security', 'setup_bad_code'); throw new HttpError(400, 'Code invalide') }
    await env.DB.prepare('UPDATE admin SET confirmed = 1, totp_last_step = ? WHERE id = 1').bind(step).run()
    await log(ctx, 'info', 'setup_done')
    return json({ ok: true })
  }
  throw new HttpError(400, 'Phase invalide')
}
