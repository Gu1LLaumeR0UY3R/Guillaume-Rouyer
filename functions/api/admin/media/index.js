// Admin : liste des médias (ou de la corbeille) et envoi d'une image.
// L'image arrive brute dans le corps de la requête ; nom, texte alternatif et dimensions dans des en-têtes.
import { HttpError, json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { MAX_BYTES, MAX_TOTAL, TRASH_DAYS, newId, sniff, toBase64, usageOf } from '../../../_lib/media.js'
import { int, str } from '../../../_lib/validate.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  await requireAdmin(ctx)
  const trash = new URL(ctx.request.url).searchParams.get('trash') === '1'
  const { results } = await ctx.env.DB.prepare(
    `SELECT id, name, alt, mime, width, height, size, created_at, deleted_at FROM media WHERE deleted_at IS ${trash ? 'NOT NULL' : 'NULL'} ORDER BY ${trash ? 'deleted_at' : 'created_at'} DESC LIMIT 300`).all()
  const [usage, count, total] = await Promise.all([
    trash ? {} : usageOf(ctx.env, results.map((r) => r.id)),
    ctx.env.DB.prepare('SELECT COUNT(*) n FROM media WHERE deleted_at IS ' + (trash ? 'NULL' : 'NOT NULL')).first(),
    ctx.env.DB.prepare('SELECT COALESCE(SUM(size), 0) s FROM media').first(),
  ])
  return json({
    media: results.map((r) => ({ ...r, usedIn: usage[r.id] ?? [], daysLeft: r.deleted_at ? Math.max(0, Math.ceil(TRASH_DAYS - (Date.now() - r.deleted_at) / 86400000)) : null })),
    otherCount: count.n, usedBytes: total.s, maxBytes: MAX_TOTAL,
  })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const h = ctx.request.headers
  if (Number(h.get('Content-Length') || 0) > MAX_BYTES) throw new HttpError(413, 'Image trop lourde (1 Mo maximum après réduction)')
  const dec = (v) => { try { return decodeURIComponent(v || '') } catch { throw new HttpError(400, 'En-tête invalide') } }
  const name = str(dec(h.get('X-Name')).replace(/[\\/]/g, '_') || 'image', { min: 1, max: 120, name: 'nom du fichier' })
  const alt = str(dec(h.get('X-Alt')).trim(), { min: 3, max: 200, name: 'texte alternatif' })
  const width = int(h.get('X-Width'), { min: 1, max: 10000, def: 0, name: 'largeur' })
  const height = int(h.get('X-Height'), { min: 1, max: 10000, def: 0, name: 'hauteur' })

  const bytes = new Uint8Array(await ctx.request.arrayBuffer())
  if (!bytes.length) throw new HttpError(400, 'Fichier vide')
  if (bytes.length > MAX_BYTES) throw new HttpError(413, 'Image trop lourde (1 Mo maximum après réduction)')
  const mime = sniff(bytes)
  if (!mime) throw new HttpError(415, 'Format refusé : JPG, PNG, WebP ou AVIF seulement')

  const { s } = await ctx.env.DB.prepare('SELECT COALESCE(SUM(size), 0) s FROM media').first()
  if (s + bytes.length > MAX_TOTAL) throw new HttpError(507, 'Espace médias plein : vide la corbeille ou supprime des images')

  const id = newId()
  await ctx.env.DB.prepare('INSERT INTO media (id, name, alt, mime, width, height, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, name, alt, mime, width, height, bytes.length, toBase64(bytes), Date.now()).run()
  await log(ctx, 'info', 'media_uploaded', { id, size: bytes.length })
  return json({ ok: true, id, url: `/media/${id}` }, 201)
}
