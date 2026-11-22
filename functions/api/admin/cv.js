// Admin : le CV en PDF (1 Mo maximum). POST remplace le fichier, DELETE le retire.
import { HttpError, json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { MAX_BYTES, toBase64 } from '../../_lib/media.js'
import { str } from '../../_lib/validate.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST, DELETE })

async function GET(ctx) {
  await requireAdmin(ctx)
  const row = await ctx.env.DB.prepare('SELECT name, size, updated_at FROM cv WHERE id = 1').first()
  return json({ cv: row ? { name: row.name, size: row.size, updatedAt: row.updated_at } : null, maxBytes: MAX_BYTES })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const h = ctx.request.headers
  if (Number(h.get('Content-Length') || 0) > MAX_BYTES + 2000) throw new HttpError(413, 'PDF trop lourd (1 Mo maximum)')
  let name = ''
  try { name = decodeURIComponent(h.get('X-Name') || '') } catch { throw new HttpError(400, 'En-tête invalide') }
  name = str(name.replace(/[\\/]/g, '_') || 'cv.pdf', { min: 1, max: 120, name: 'nom du fichier' })
  const bytes = new Uint8Array(await ctx.request.arrayBuffer())
  if (!bytes.length) throw new HttpError(400, 'Fichier vide')
  if (bytes.length > MAX_BYTES) throw new HttpError(413, 'PDF trop lourd (1 Mo maximum)')
  if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new HttpError(415, 'Format refusé : un fichier PDF est attendu')
  await ctx.env.DB.prepare('INSERT INTO cv (id, name, size, data, updated_at) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, size = excluded.size, data = excluded.data, updated_at = excluded.updated_at')
    .bind(name, bytes.length, toBase64(bytes), Date.now()).run()
  await log(ctx, 'info', 'cv_uploaded', { size: bytes.length })
  return json({ ok: true }, 201)
}

async function DELETE(ctx) {
  await requireAdmin(ctx)
  await ctx.env.DB.prepare('DELETE FROM cv WHERE id = 1').run()
  await log(ctx, 'info', 'cv_deleted', {})
  return json({ ok: true })
}
