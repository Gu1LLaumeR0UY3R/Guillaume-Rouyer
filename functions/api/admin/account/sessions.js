// Admin : voir les sessions ouvertes et en fermer.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { destroyOtherSessions, listSessions, revokeSession } from '../../../_lib/session.js'
import { oneOf } from '../../../_lib/validate.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  const s = await requireAdmin(ctx)
  return json({ sessions: await listSessions(ctx, s.idHash) })
}

// Actions : revoke (id) ferme une session ; revokeOthers ferme toutes les autres.
async function POST(ctx) {
  const s = await requireAdmin(ctx)
  const body = await readJson(ctx.request)
  const action = oneOf(body.action, ['revoke', 'revokeOthers'], { name: 'action' })
  if (action === 'revokeOthers') {
    const res = await destroyOtherSessions(ctx, s.idHash)
    await log(ctx, 'security', 'sessions_revoked_all', { closed: res.meta.changes })
    return json({ ok: true, closed: res.meta.changes })
  }
  if (action === 'revoke') {
    const closed = await revokeSession(ctx, String(body.id ?? ''), s.idHash)
    if (!closed) throw new HttpError(404, 'Session introuvable (ou session courante : utilise « Se déconnecter »)')
    await log(ctx, 'security', 'session_revoked')
    return json({ ok: true })
  }
  throw new HttpError(400, 'Action manquante')
}
