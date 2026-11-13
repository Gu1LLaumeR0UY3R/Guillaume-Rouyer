import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { clearCookie, destroySession } from '../../_lib/session.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST(ctx) {
  const s = await requireAdmin(ctx)
  await destroySession(ctx, s.idHash)
  await log(ctx, 'info', 'logout')
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() })
}
