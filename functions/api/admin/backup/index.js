// Admin : sauvegarde complète du contenu en un fichier JSON (textes, projets, réglages du site).
// Jamais inclus : compte admin, sessions, journaux, messages de contact, secrets. Les images (médias) ne sont pas dans le fichier.
import { json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { getSettings } from '../../../_lib/settings.js'
import { COLUMNS, toBody } from '../../../_lib/projects.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET })

export const FORMAT = 'portfolio-backup'

async function GET(ctx) {
  await requireAdmin(ctx)
  const [c, p, s] = await Promise.all([
    ctx.env.DB.prepare('SELECT key, data FROM content ORDER BY key').all(),
    ctx.env.DB.prepare(`SELECT ${COLUMNS} FROM projects ORDER BY position, slug`).all(),
    getSettings(ctx.env),
  ])
  const { maintenanceOn, protectedMode, ...settings } = s // jamais restaurés par un import : ils pourraient fermer le site
  const out = {
    format: FORMAT, version: 1, exportedAt: new Date().toISOString(),
    content: Object.fromEntries(c.results.map((r) => [r.key, JSON.parse(r.data)])),
    projects: p.results.map((r) => ({ slug: r.slug, ...toBody(r) })),
    settings,
  }
  await log(ctx, 'info', 'backup_exported', { content: c.results.length, projects: p.results.length })
  const day = new Date().toISOString().slice(0, 10)
  return json(out, 200, { 'Content-Disposition': `attachment; filename="sauvegarde-portfolio-${day}.json"` })
}
