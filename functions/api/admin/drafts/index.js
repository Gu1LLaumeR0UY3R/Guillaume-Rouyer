// Admin : brouillons et publications programmées.
//  GET ?kind=&ref= -> le brouillon de cet élément (ou null) ; GET sans paramètre -> la liste (sans le contenu)
//  PUT { kind, ref, data, publishAt } -> enregistre (publishAt = date en ms, ou null pour un simple brouillon)
//  DELETE ?kind=&ref= -> supprime
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { checkRef, parseFor } from '../../../_lib/versions.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT, DELETE })

const MIN_AHEAD = 60_000, MAX_AHEAD = 366 * 86400000

async function GET(ctx) {
  await requireAdmin(ctx)
  const q = new URL(ctx.request.url).searchParams
  if (!q.has('kind')) {
    const { results } = await ctx.env.DB.prepare('SELECT kind, ref, publish_at, error, updated_at FROM drafts ORDER BY COALESCE(publish_at, 9e15), updated_at DESC').all()
    return json({ drafts: results.map((r) => ({ kind: r.kind, ref: r.ref, publishAt: r.publish_at, error: r.error, updatedAt: r.updated_at })) })
  }
  const kind = q.get('kind'), ref = q.get('ref') ?? ''
  checkRef(kind, ref)
  const r = await ctx.env.DB.prepare('SELECT data, publish_at, error, updated_at FROM drafts WHERE kind = ? AND ref = ?').bind(kind, ref).first()
  return json({ draft: r ? { data: JSON.parse(r.data), publishAt: r.publish_at, error: r.error, updatedAt: r.updated_at } : null })
}

async function PUT(ctx) {
  await requireAdmin(ctx)
  const b = await readJson(ctx.request, 120_000)
  checkRef(b.kind, b.ref)
  if (b.kind === 'project' && !(await ctx.env.DB.prepare('SELECT 1 FROM projects WHERE slug = ?').bind(b.ref).first())) throw new HttpError(404, 'Projet introuvable')
  const data = parseFor(b.kind, b.ref, b.data)
  let at = null
  if (b.publishAt !== null && b.publishAt !== undefined) {
    const now = Date.now()
    if (!Number.isInteger(b.publishAt) || b.publishAt < now + MIN_AHEAD) throw new HttpError(400, 'La date de publication doit être dans le futur (au moins 1 minute)')
    if (b.publishAt > now + MAX_AHEAD) throw new HttpError(400, 'La date de publication est trop lointaine (1 an maximum)')
    at = b.publishAt
  }
  const now = Date.now()
  // Un projet garde sa forme d'entrée (revalidée à la publication) ; un bloc de contenu est déjà normalisé.
  await ctx.env.DB.prepare('INSERT INTO drafts (kind, ref, data, publish_at, error, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?) ON CONFLICT(kind, ref) DO UPDATE SET data = excluded.data, publish_at = excluded.publish_at, error = NULL, updated_at = excluded.updated_at')
    .bind(b.kind, b.ref, JSON.stringify(b.kind === 'project' ? b.data : data), at, now, now).run()
  await log(ctx, 'info', at ? 'publish_scheduled' : 'draft_saved', { kind: b.kind, ref: b.ref, at })
  return json({ ok: true })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const q = new URL(ctx.request.url).searchParams
  const kind = q.get('kind'), ref = q.get('ref') ?? ''
  checkRef(kind, ref)
  await ctx.env.DB.prepare('DELETE FROM drafts WHERE kind = ? AND ref = ?').bind(kind, ref).run()
  await log(ctx, 'info', 'draft_deleted', { kind, ref })
  return json({ ok: true })
}
