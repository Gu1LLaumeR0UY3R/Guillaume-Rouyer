// Admin : aperçu de tous les contenus modifiables (lesquels ont été modifiés, lesquels ont un brouillon).
import { json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET(ctx) {
  await requireAdmin(ctx)
  const [c, d] = await Promise.all([
    ctx.env.DB.prepare('SELECT key, updated_at FROM content').all(),
    ctx.env.DB.prepare("SELECT ref, publish_at, error FROM drafts WHERE kind = 'content'").all().catch(() => ({ results: [] })),
  ])
  return json({
    items: Object.fromEntries(c.results.map((r) => [r.key, r.updated_at])),
    drafts: Object.fromEntries(d.results.map((r) => [r.ref, { publishAt: r.publish_at, error: r.error }])),
  })
}
