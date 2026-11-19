// Admin : lire, enregistrer ou remettre à zéro (contenu d'origine) un bloc de contenu.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { getBlock, isBlock, parseBlock } from '../../../_lib/content.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT, DELETE })

const check = (key) => { if (!isBlock(key)) throw new HttpError(404, 'Contenu introuvable') }

async function GET(ctx) {
  await requireAdmin(ctx)
  check(ctx.params.key)
  return json((await getBlock(ctx.env, ctx.params.key)) ?? {})
}

async function PUT(ctx) {
  await requireAdmin(ctx)
  const { key } = ctx.params
  check(key)
  const data = parseBlock(key, await readJson(ctx.request, 120_000))
  const now = Date.now()
  await ctx.env.DB.prepare('INSERT INTO content (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
    .bind(key, JSON.stringify(data), now).run()
  await log(ctx, 'info', 'content_updated', { key, items: data.items?.length })
  return json({ ok: true, updatedAt: now })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const { key } = ctx.params
  check(key)
  await ctx.env.DB.prepare('DELETE FROM content WHERE key = ?').bind(key).run()
  await log(ctx, 'warn', 'content_reset', { key })
  return json({ ok: true })
}
