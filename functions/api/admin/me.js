import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET(ctx) {
  const s = await requireAdmin(ctx)
  return json({ authenticated: true, csrf: s.csrf })
}
