// Admin : dossiers pour ranger les pages de contenu (un seul niveau). Réservé à l'admin, jamais visible du public.
// Format : { folders: [{ id, name }], assign: { <clé de contenu>: <id de dossier> } }
import { HttpError, json, readJson, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { isBlock } from '../../_lib/content.js'
import { str } from '../../_lib/validate.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT })

const KEY = 'admin.folders'
const ID = /^[a-f0-9]{8}$/
const MAX_FOLDERS = 30

async function GET(ctx) {
  await requireAdmin(ctx)
  const r = await ctx.env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(KEY).first()
  let v = { folders: [], assign: {} }
  try { if (r) v = JSON.parse(r.value) } catch { /* valeur abîmée : on repart de zéro */ }
  return json(v)
}

async function PUT(ctx) {
  await requireAdmin(ctx)
  const b = await readJson(ctx.request, 20_000)
  if (!Array.isArray(b.folders) || b.folders.length > MAX_FOLDERS) throw new HttpError(400, `${MAX_FOLDERS} dossiers au maximum`)
  const ids = new Set()
  const folders = b.folders.map((f) => {
    if (!f || typeof f.id !== 'string' || !ID.test(f.id) || ids.has(f.id)) throw new HttpError(400, 'Dossier invalide')
    ids.add(f.id)
    const name = str(f.name, { min: 1, max: 40, name: 'nom du dossier' }).trim()
    if (!name) throw new HttpError(400, 'Nom du dossier : champ obligatoire')
    return { id: f.id, name }
  })
  const assign = {}
  for (const [k, id] of Object.entries(b.assign && typeof b.assign === 'object' ? b.assign : {})) {
    if (!isBlock(k)) throw new HttpError(400, 'Contenu inconnu')
    if (id === null || id === '') continue
    if (!ids.has(id)) throw new HttpError(400, 'Dossier inconnu')
    assign[k] = id
  }
  await ctx.env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
    .bind(KEY, JSON.stringify({ folders, assign }), Date.now()).run()
  await log(ctx, 'info', 'folders_updated', { folders: folders.length })
  return json({ ok: true, folders, assign })
}
