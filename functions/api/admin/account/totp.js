// Admin : régénérer le 2FA (nouveau téléphone ou application perdue), sans passer par la ligne de commande.
//  start   : mot de passe + code actuel -> renvoie le nouveau secret à scanner (l'ancien reste actif)
//  confirm : premier code du nouveau secret -> remplace l'ancien et ferme les autres sessions
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { confirmIdentity, requireAdmin } from '../../../_lib/auth.js'
import { decryptText, encryptText } from '../../../_lib/crypto.js'
import { destroyOtherSessions } from '../../../_lib/session.js'
import { generateSecret, otpauthUri, verifyTotp } from '../../../_lib/totp.js'
import { str } from '../../../_lib/validate.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  const session = await requireAdmin(ctx)
  const { env } = ctx
  const body = await readJson(ctx.request)

  if (body.phase === 'start') {
    await confirmIdentity(ctx, body.password, body.code)
    const secret = generateSecret()
    await env.DB.prepare('UPDATE admin SET pending_totp = ? WHERE id = 1').bind(await encryptText(secret, env.APP_SECRET)).run()
    await log(ctx, 'security', 'totp_change_started')
    return json({ secret, uri: otpauthUri(secret) })
  }
  if (body.phase === 'confirm') {
    const row = await env.DB.prepare('SELECT pending_totp FROM admin WHERE id = 1 AND confirmed = 1').first()
    if (!row?.pending_totp) throw new HttpError(409, 'Lance d\'abord l\'étape 1')
    const step = await verifyTotp(await decryptText(row.pending_totp, env.APP_SECRET), str(body.code, { max: 6, name: 'code' }), 0)
    if (!step) { await log(ctx, 'security', 'totp_change_bad_code'); throw new HttpError(400, 'Code invalide') }
    await env.DB.prepare('UPDATE admin SET totp_secret = pending_totp, pending_totp = NULL, totp_last_step = ? WHERE id = 1').bind(step).run()
    await destroyOtherSessions(ctx, session.idHash)
    await log(ctx, 'security', 'totp_changed')
    return json({ ok: true })
  }
  throw new HttpError(400, 'Phase invalide')
}
