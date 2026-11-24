// Consultation des journaux (admin) : onglets, recherche, dates, pagination, export CSV, purge.
// Les paramètres sont validés ; les valeurs passent par bind(), jamais dans le SQL.
import { HttpError, json, readJson, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { int, oneOf, str } from '../../_lib/validate.js'
import { LEVELS, log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

// Onglet « Activité admin » : ce que fait l'administrateur (et la vie du compte)
const ADMIN_EVENTS = [
  'login_ok', 'logout', 'setup_started', 'setup_done',
  'project_created', 'project_updated', 'project_patched', 'project_deleted', 'projects_reordered', 'veille_article_deleted', 'trash_restored', 'trash_purged', 'trash_emptied',
  'settings_updated', 'site_maintenance_on', 'site_maintenance_off',
  'password_changed', 'totp_change_started', 'totp_changed', 'session_revoked', 'sessions_revoked_all', 'logs_purged',
]
const CATEGORIES = ['all', 'security', 'errors', 'admin']
const COLUMNS = 'id, at, level, event, ip, country, path, ua, meta'

// Échappe % _ \ pour que la recherche soit littérale
const likeValue = (s) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

function buildQuery(q, { max }) {
  const limit = int(q.get('limit'), { min: 1, max, def: Math.min(50, max), name: 'limit' })
  const before = int(q.get('before'), { min: 1, max: 2 ** 40, def: 0, name: 'before' })
  const level = oneOf(q.get('level'), LEVELS, { name: 'niveau' })
  const category = oneOf(q.get('category'), CATEGORIES, { def: 'all', name: 'catégorie' })
  const from = int(q.get('from'), { min: 1, max: 2 ** 45, def: 0, name: 'date de début' })
  const to = int(q.get('to'), { min: 1, max: 2 ** 45, def: 0, name: 'date de fin' })
  const text = q.get('q') ? str(q.get('q').trim(), { max: 60, name: 'recherche' }) : ''

  let sql = `SELECT ${COLUMNS} FROM logs WHERE 1 = 1`
  const args = []
  if (level) { sql += ' AND level = ?'; args.push(level) }
  if (category === 'security') sql += " AND level = 'security'"
  if (category === 'errors') sql += " AND level IN ('error', 'warn')"
  if (category === 'admin') { sql += ` AND event IN (${ADMIN_EVENTS.map(() => '?').join(',')})`; args.push(...ADMIN_EVENTS) }
  if (from) { sql += ' AND at >= ?'; args.push(from) }
  if (to) { sql += ' AND at <= ?'; args.push(to) }
  if (before) { sql += ' AND id < ?'; args.push(before) }
  if (text) {
    sql += " AND (event LIKE ? ESCAPE '\\' OR ip LIKE ? ESCAPE '\\' OR path LIKE ? ESCAPE '\\' OR meta LIKE ? ESCAPE '\\')"
    const v = likeValue(text)
    args.push(v, v, v, v)
  }
  sql += ' ORDER BY id DESC LIMIT ?'; args.push(limit)
  return { sql, args, limit }
}

// Un tableur interprète une cellule qui commence par = + - @ comme une formule : on la neutralise.
const csvCell = (v) => {
  let s = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

async function GET(ctx) {
  await requireAdmin(ctx)
  const q = new URL(ctx.request.url).searchParams
  const csv = q.get('format') === 'csv'
  const { sql, args, limit } = buildQuery(q, { max: csv ? 5000 : 200 })
  const { results } = await ctx.env.DB.prepare(sql).bind(...args).all()

  if (csv) {
    const head = ['id', 'date', 'niveau', 'événement', 'ip', 'pays', 'chemin', 'navigateur', 'détail']
    const lines = [head.map(csvCell).join(',')]
    for (const r of results) lines.push([r.id, new Date(r.at).toISOString(), r.level, r.event, r.ip, r.country, r.path, r.ua, r.meta].map(csvCell).join(','))
    return new Response(`﻿${lines.join('\r\n')}\r\n`, { headers: {
      'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="journaux.csv"',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    } })
  }
  return json({ logs: results, next: results.length === limit ? results[results.length - 1].id : null })
}

// Purge : supprime les journaux plus vieux que 0 (tous), 1 ou 7 jours. La purge elle-même est journalisée.
async function POST(ctx) {
  await requireAdmin(ctx)
  const body = await readJson(ctx.request)
  if (body.action !== 'purge' || ![0, 1, 7].includes(body.days)) throw new HttpError(400, 'Demande invalide')
  const res = await ctx.env.DB.prepare('DELETE FROM logs WHERE at < ?').bind(Date.now() - body.days * 86400000).run()
  await log(ctx, 'warn', 'logs_purged', { days: body.days, deleted: res.meta.changes })
  return json({ ok: true, deleted: res.meta.changes })
}
