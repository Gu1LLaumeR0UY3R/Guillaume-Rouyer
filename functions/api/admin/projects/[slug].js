// Admin : lire, remplacer (PUT), modifier quelques champs (PATCH) ou supprimer un projet.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { COLUMNS, nextPrevStatus, parseProject, restoredStatus, toApi, validSlug } from '../../../_lib/projects.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT, PATCH, DELETE })

async function GET(ctx) {
  await requireAdmin(ctx)
  const row = await ctx.env.DB.prepare(`SELECT ${COLUMNS} FROM projects WHERE slug = ?`).bind(validSlug(ctx.params.slug)).first()
  if (!row) throw new HttpError(404, 'Projet introuvable')
  return json({ project: toApi(row, { details: true }) })
}

const getOld = async (ctx, slug) => {
  const old = await ctx.env.DB.prepare('SELECT status, prev_status FROM projects WHERE slug = ?').bind(slug).first()
  if (!old) throw new HttpError(404, 'Projet introuvable')
  return old
}

async function PUT(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const p = parseProject(await readJson(ctx.request, 60_000))
  const old = await getOld(ctx, slug)
  const res = await ctx.env.DB.prepare(`UPDATE projects SET name = ?, tag = ?, status = ?, prev_status = ?, accent = ?, description = ?, stack = ?, repo = ?, note = ?, featured = ?, board = ?, maintenance_message = ?, details = ?, banner_image = ?, banner_dim = ?, updated_at = ? WHERE slug = ?`)
    .bind(p.name, p.tag, p.status, nextPrevStatus(old, p.status), p.accent, p.description, JSON.stringify(p.stack), p.repo, p.note, p.featured, p.board, p.maintenance_message, JSON.stringify(p.details), p.banner_image, p.banner_dim, Date.now(), slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Projet introuvable')
  await log(ctx, 'info', 'project_updated', { slug })
  return json({ ok: true })
}

// Changement rapide : statut, mise en avant, message, et interrupteur de maintenance.
// `maintenance: true` passe en maintenance en mémorisant le statut d'avant ; `maintenance: false` le rétablit.
async function PATCH(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const body = await readJson(ctx.request)
  const old = await getOld(ctx, slug)
  let status = body.status
  if (body.maintenance !== undefined) {
    if (typeof body.maintenance !== 'boolean') throw new HttpError(400, 'Valeur de maintenance invalide')
    if (body.maintenance) status = 'maintenance'
    else if (old.status === 'maintenance') status = restoredStatus(old)
  }
  const p = parseProject({ status, featured: body.featured, maintenanceMessage: body.maintenanceMessage }, { partial: true })
  if (p.status !== undefined) p.prev_status = nextPrevStatus(old, p.status)
  const sets = Object.keys(p)
  if (!sets.length) throw new HttpError(400, 'Rien à modifier')
  const res = await ctx.env.DB.prepare(`UPDATE projects SET ${sets.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE slug = ?`) // les noms de colonnes viennent de parseProject et de ce fichier, jamais du client
    .bind(...sets.map((k) => p[k]), Date.now(), slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Projet introuvable')
  await log(ctx, 'info', 'project_patched', { slug, fields: sets, status: p.status })
  return json({ ok: true, status: p.status ?? old.status })
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  const slug = validSlug(ctx.params.slug)
  const res = await ctx.env.DB.prepare('DELETE FROM projects WHERE slug = ?').bind(slug).run()
  if (!res.meta.changes) throw new HttpError(404, 'Projet introuvable')
  await log(ctx, 'warn', 'project_deleted', { slug })
  return json({ ok: true })
}
