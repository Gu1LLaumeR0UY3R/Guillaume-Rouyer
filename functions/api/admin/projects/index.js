// Admin : liste complète (y compris masqués) et création.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { COLUMNS, parseProject, toApi, validSlug } from '../../../_lib/projects.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  await requireAdmin(ctx)
  const { results } = await ctx.env.DB.prepare(`SELECT ${COLUMNS} FROM projects ORDER BY position, slug`).all()
  return json({ projects: results.map((r) => toApi(r, { details: true })) })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const body = await readJson(ctx.request, 60_000)
  const slug = validSlug(body.slug)
  const p = parseProject(body)
  if (await ctx.env.DB.prepare('SELECT 1 FROM projects WHERE slug = ?').bind(slug).first()) throw new HttpError(409, 'Cet identifiant existe déjà')
  const now = Date.now()
  await ctx.env.DB.prepare(`INSERT INTO projects (slug, name, tag, status, accent, description, stack, repo, note, featured, board, maintenance_message, details, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM projects), ?, ?)`)
    .bind(slug, p.name, p.tag, p.status, p.accent, p.description, JSON.stringify(p.stack), p.repo, p.note, p.featured, p.board, p.maintenance_message, JSON.stringify(p.details), now, now).run()
  await log(ctx, 'info', 'project_created', { slug })
  return json({ ok: true, slug }, 201)
}
