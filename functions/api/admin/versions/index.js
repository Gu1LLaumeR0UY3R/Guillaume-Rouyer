// Admin : historique des versions d'un contenu ou d'un projet (GET ?kind=&ref=).
import { json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { checkRef } from '../../../_lib/versions.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET(ctx) {
  await requireAdmin(ctx)
  const q = new URL(ctx.request.url).searchParams
  const kind = q.get('kind'), ref = q.get('ref') ?? ''
  checkRef(kind, ref)
  const { results } = await ctx.env.DB.prepare('SELECT id, label, created_at, LENGTH(data) AS size FROM versions WHERE kind = ? AND ref = ? ORDER BY id DESC').bind(kind, ref).all()
  return json({ versions: results.map((r) => ({ id: r.id, label: r.label, at: r.created_at, size: r.size })) })
}
