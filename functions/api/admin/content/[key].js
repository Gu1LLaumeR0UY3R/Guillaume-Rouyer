// Admin : lire, enregistrer ou remettre à zéro (contenu d'origine) un bloc de contenu.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { getBlock, isBlock, parseBlock } from '../../../_lib/content.js'
import { applyContent, snapshot } from '../../../_lib/versions.js'
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
  const now = await applyContent(ctx.env, key, data)
  await log(ctx, 'info', 'content_updated', { key, items: data.items?.length })
  return json({ ok: true, updatedAt: now })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const { key } = ctx.params
  check(key)
  const old = await getBlock(ctx.env, key)
  if (old) await snapshot(ctx.env, 'content', key, old, 'Avant retour aux textes d\'origine')
  await ctx.env.DB.prepare('DELETE FROM content WHERE key = ?').bind(key).run()
  await log(ctx, 'warn', 'content_reset', { key })
  return json({ ok: true })
}
