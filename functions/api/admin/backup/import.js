// Admin : importer une sauvegarde. Tout est vérifié avant d'écrire quoi que ce soit : un seul défaut et rien n'est changé.
// POST { ...fichier, apply: false } -> simple contrôle, renvoie ce qui serait changé ; apply: true -> applique.
// L'import remplace ou crée les éléments présents dans le fichier ; il ne supprime rien. Les anciennes versions vont dans l'historique.
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { isBlock, parseBlock } from '../../../_lib/content.js'
import { COLUMNS, nextPrevStatus, parseProject, toBody, validSlug } from '../../../_lib/projects.js'
import { parseSettings, saveSettings } from '../../../_lib/settings.js'
import { snapshot } from '../../../_lib/versions.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

const MAX_PROJECTS = 100

async function POST(ctx) {
  await requireAdmin(ctx)
  const b = await readJson(ctx.request, 3_000_000)
  if (b.format !== 'portfolio-backup' || b.version !== 1) throw new HttpError(400, "Ce fichier n'est pas une sauvegarde de ce portfolio")

  const problems = []
  const guard = (what, fn) => { try { return fn() } catch (e) { problems.push(`${what} : ${e.message}`); return null } }

  const contentIn = b.content && typeof b.content === 'object' && !Array.isArray(b.content) ? b.content : {}
  const content = []
  for (const [k, v] of Object.entries(contentIn)) {
    if (!isBlock(k)) { problems.push(`Contenu « ${k.slice(0, 40)} » : inconnu`); continue }
    const d = guard(`Contenu « ${k} »`, () => parseBlock(k, v))
    if (d) content.push([k, d])
  }

  const projIn = Array.isArray(b.projects) ? b.projects : []
  if (projIn.length > MAX_PROJECTS) throw new HttpError(400, `${MAX_PROJECTS} projets au maximum`)
  const projects = []
  const seen = new Set()
  for (const [i, p] of projIn.entries()) {
    const slug = guard(`Projet ${i + 1}`, () => validSlug(p?.slug))
    if (!slug) continue
    if (seen.has(slug)) { problems.push(`Projet « ${slug} » : en double dans le fichier`); continue }
    seen.add(slug)
    const d = guard(`Projet « ${slug} »`, () => parseProject(p))
    if (d) projects.push([slug, d])
  }

  const settingsIn = b.settings && typeof b.settings === 'object' && !Array.isArray(b.settings) ? { ...b.settings } : {}
  delete settingsIn.maintenanceOn; delete settingsIn.protectedMode
  const settings = guard('Réglages', () => parseSettings(settingsIn)) ?? {}

  if (problems.length) throw new HttpError(400, `Import refusé, rien n'a été modifié. ${problems.slice(0, 5).join(' · ')}${problems.length > 5 ? ` (+${problems.length - 5} autres)` : ''}`)

  const existing = new Set((await ctx.env.DB.prepare('SELECT slug FROM projects').all()).results.map((r) => r.slug))
  const existingContent = new Set((await ctx.env.DB.prepare('SELECT key FROM content').all()).results.map((r) => r.key))
  const summary = {
    content: { replaced: content.filter(([k]) => existingContent.has(k)).length, created: content.filter(([k]) => !existingContent.has(k)).length },
    projects: { replaced: projects.filter(([s]) => existing.has(s)).length, created: projects.filter(([s]) => !existing.has(s)).length },
    settings: Object.keys(settings).length,
  }
  if (b.apply !== true) return json({ ok: true, applied: false, summary })

  const now = Date.now()
  for (const [k] of content) {
    const old = await ctx.env.DB.prepare('SELECT data FROM content WHERE key = ?').bind(k).first()
    if (old) await snapshot(ctx.env, 'content', k, JSON.parse(old.data), 'Avant import')
  }
  for (const [slug] of projects) {
    const row = await ctx.env.DB.prepare(`SELECT ${COLUMNS} FROM projects WHERE slug = ?`).bind(slug).first()
    if (row) await snapshot(ctx.env, 'project', slug, toBody(row), 'Avant import')
  }
  const stmts = []
  for (const [k, d] of content) {
    stmts.push(ctx.env.DB.prepare('INSERT INTO content (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(k, JSON.stringify(d), now))
  }
  for (const [slug, p] of projects) {
    if (existing.has(slug)) {
      const old = await ctx.env.DB.prepare('SELECT status, prev_status FROM projects WHERE slug = ?').bind(slug).first()
      stmts.push(ctx.env.DB.prepare('UPDATE projects SET name = ?, tag = ?, status = ?, prev_status = ?, accent = ?, description = ?, stack = ?, repo = ?, note = ?, featured = ?, board = ?, maintenance_message = ?, details = ?, banner_image = ?, banner_dim = ?, updated_at = ? WHERE slug = ?')
        .bind(p.name, p.tag, p.status, nextPrevStatus(old, p.status), p.accent, p.description, JSON.stringify(p.stack), p.repo, p.note, p.featured, p.board, p.maintenance_message, JSON.stringify(p.details), p.banner_image, p.banner_dim, now, slug))
    } else {
      stmts.push(ctx.env.DB.prepare(`INSERT INTO projects (slug, name, tag, status, accent, description, stack, repo, note, featured, board, maintenance_message, details, banner_image, banner_dim, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM projects), ?, ?)`)
        .bind(slug, p.name, p.tag, p.status, p.accent, p.description, JSON.stringify(p.stack), p.repo, p.note, p.featured, p.board, p.maintenance_message, JSON.stringify(p.details), p.banner_image, p.banner_dim, now, now))
    }
  }
  if (stmts.length) await ctx.env.DB.batch(stmts)
  await saveSettings(ctx.env, settings)
  await log(ctx, 'warn', 'backup_imported', summary)
  return json({ ok: true, applied: true, summary })
}
