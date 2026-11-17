// Admin : changer le mot de passe. Demande l'ancien mot de passe + un code 2FA, puis ferme les autres sessions.
import { json, readJson, route } from '../../../_lib/http.js'
import { confirmIdentity, requireAdmin } from '../../../_lib/auth.js'
import { hashPassword, newSalt } from '../../../_lib/crypto.js'
import { destroyOtherSessions } from '../../../_lib/session.js'
import { checkPassword, str } from '../../../_lib/validate.js'
import { HttpError } from '../../../_lib/http.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  const session = await requireAdmin(ctx)
  const body = await readJson(ctx.request)
  const next = str(body.next, { min: 14, max: 128, name: 'nouveau mot de passe' })
  checkPassword(next)
  if (next === body.current) throw new HttpError(400, 'Le nouveau mot de passe doit être différent de l\'ancien')
  await confirmIdentity(ctx, body.current, body.code)
  const salt = newSalt()
  await ctx.env.DB.prepare('UPDATE admin SET password_hash = ?, password_salt = ? WHERE id = 1').bind(await hashPassword(next, salt, ctx.env.APP_SECRET), salt).run()
  await destroyOtherSessions(ctx, session.idHash)
  await log(ctx, 'security', 'password_changed')
  return json({ ok: true })
}
