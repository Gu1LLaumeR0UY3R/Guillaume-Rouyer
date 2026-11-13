// Admin : lire, remplacer (PUT), modifier quelques champs (PATCH) ou supprimer un projet.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { COLUMNS, parseProject, toApi, validSlug } from '../../../_lib/projects.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT, PATCH, DELETE })

async function GET(ctx) {
  await requireAdmin(ctx)
  const row = await ctx.env.DB.prepare(`SELECT ${COLUMNS} FROM projects WHERE slug = ?`).bind(validSlug(ctx.params.slug)).first()
  if (!row) throw new HttpError(404, 'Projet introuvable')
  return json({ project: toApi(row, { details: true }) })
}

async function PUT(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const p = parseProject(await readJson(ctx.request, 60_000))
  const res = await ctx.env.DB.prepare(`UPDATE projects SET name = ?, tag = ?, status = ?, accent = ?, description = ?, stack = ?, repo = ?, note = ?, featured = ?, board = ?, maintenance_message = ?, details = ?, updated_at = ? WHERE slug = ?`)
    .bind(p.name, p.tag, p.status, p.accent, p.description, JSON.stringify(p.stack), p.repo, p.note, p.featured, p.board, p.maintenance_message, JSON.stringify(p.details), Date.now(), slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Projet introuvable')
  await log(ctx, 'info', 'project_updated', { slug })
  return json({ ok: true })
}

// Changement rapide (ex. passer en maintenance) : seuls statut, mise en avant et message sont acceptés.
async function PATCH(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const body = await readJson(ctx.request)
  const p = parseProject({ status: body.status, featured: body.featured, maintenanceMessage: body.maintenanceMessage }, { partial: true })
  const sets = Object.keys(p)
  if (!sets.length) throw new HttpError(400, 'Rien à modifier')
  const res = await ctx.env.DB.prepare(`UPDATE projects SET ${sets.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE slug = ?`) // les noms de colonnes viennent de parseProject, jamais du client
    .bind(...sets.map((k) => p[k]), Date.now(), slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Projet introuvable')
  await log(ctx, 'info', 'project_patched', { slug, fields: sets })
  return json({ ok: true })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const res = await ctx.env.DB.prepare('DELETE FROM projects WHERE slug = ?').bind(slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Projet introuvable')
  await log(ctx, 'warn', 'project_deleted', { slug })
  return json({ ok: true })
}
