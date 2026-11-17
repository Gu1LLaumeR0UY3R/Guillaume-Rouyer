// Admin : voir une image (même dans la corbeille), modifier son texte alternatif, la restaurer, la mettre à la corbeille ou la supprimer.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { fromBase64, usageOf, validId } from '../../../_lib/media.js'
import { str } from '../../../_lib/validate.js'
import { log } from '../../../_lib/logger.js'

// Retire l'image du cache de Cloudflare : sinon elle resterait visible un moment après la corbeille.
const forget = (ctx, id) => caches.default.delete(new Request(new URL(`/media/${id}`, ctx.request.url).toString())).catch(() => {})

export const onRequest = (ctx) => route(ctx, { GET, PATCH, DELETE })

async function GET(ctx) {
  await requireAdmin(ctx)
  const row = await ctx.env.DB.prepare('SELECT mime, data FROM media WHERE id = ?').bind(validId(ctx.params.id)).first()
  if (!row) throw new HttpError(404, 'Média introuvable')
  return new Response(fromBase64(row.data), { headers: { 'Content-Type': row.mime, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' } })
}

async function PATCH(ctx) {
  await requireAdmin(ctx)
  const id = validId(ctx.params.id)
  const b = await readJson(ctx.request)
  const row = await ctx.env.DB.prepare('SELECT deleted_at FROM media WHERE id = ?').bind(id).first()
  if (!row) throw new HttpError(404, 'Média introuvable')
  if (b.restore === true) {
    await ctx.env.DB.prepare('UPDATE media SET deleted_at = NULL WHERE id = ?').bind(id).run()
    await log(ctx, 'info', 'media_restored', { id })
    return json({ ok: true })
  }
  if (b.alt === undefined) throw new HttpError(400, 'Rien à modifier')
  const alt = str(String(b.alt).trim(), { min: 3, max: 200, name: 'texte alternatif' })
  await ctx.env.DB.prepare('UPDATE media SET alt = ? WHERE id = ?').bind(alt, id).run()
  await log(ctx, 'info', 'media_updated', { id })
  return json({ ok: true })
}

// Sans ?permanent=1 : corbeille (30 jours). Avec : suppression définitive, seulement depuis la corbeille.
// Une image utilisée demande ?force=1 pour être retirée (sinon on renvoie où elle sert).
async function DELETE(ctx) {
  await requireAdmin(ctx)
  const id = validId(ctx.params.id)
  const q = new URL(ctx.request.url).searchParams
  const row = await ctx.env.DB.prepare('SELECT deleted_at FROM media WHERE id = ?').bind(id).first()
  if (!row) throw new HttpError(404, 'Média introuvable')
  if (q.get('permanent') === '1') {
    if (!row.deleted_at) throw new HttpError(409, 'Mets d\'abord l\'image à la corbeille')
    await ctx.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run()
    await forget(ctx, id)
    await log(ctx, 'warn', 'media_deleted', { id })
    return json({ ok: true })
  }
  if (row.deleted_at) return json({ ok: true })
  const used = (await usageOf(ctx.env, [id]))[id]
  if (used.length && q.get('force') !== '1') return json({ error: 'Image utilisée', usedIn: used }, 409)
  await ctx.env.DB.prepare('UPDATE media SET deleted_at = ? WHERE id = ?').bind(Date.now(), id).run()
  await forget(ctx, id)
  await log(ctx, 'info', 'media_trashed', { id })
  return json({ ok: true })
}
