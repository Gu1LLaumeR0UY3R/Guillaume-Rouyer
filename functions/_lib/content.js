// Contenus éditables : liste blanche des blocs et validation de chacun.
import { HttpError } from './http.js'

export const GROUPS = ['concept', 'socle', 'valo', 'tech']
const MAX_ITEMS = 80
const HEX = /^#[0-9a-f]{6}$/i

const text = (v, max, name, req = false) => {
  if (v === undefined || v === null || v === '') { if (req) throw new HttpError(400, `${name} : champ obligatoire`); return '' }
  if (typeof v !== 'string') throw new HttpError(400, `${name} : texte attendu`)
  const t = v.trim()
  if (t.length > max) throw new HttpError(400, `${name} : ${max} caractères au maximum`)
  if (req && !t) throw new HttpError(400, `${name} : champ obligatoire`)
  return t
}
const num = (v, min, max, name, req = true) => {
  if ((v === undefined || v === null) && !req) return undefined
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new HttpError(400, `${name} : nombre entre ${min} et ${max}`)
  return Math.round(v * 10) / 10
}

// SpiderNet : tableau d'enquête. Chaque élément est un titre de colonne (k = 'head') ou une carte.
function spidernet(body) {
  if (!Array.isArray(body?.items) || !body.items.length) throw new HttpError(400, 'Le tableau doit contenir au moins un élément')
  if (body.items.length > MAX_ITEMS) throw new HttpError(400, `${MAX_ITEMS} éléments au maximum`)
  const items = body.items.map((o, i) => {
    const n = `Élément ${i + 1}`
    if (!o || typeof o !== 'object') throw new HttpError(400, `${n} : invalide`)
    const head = o.k === 'head'
    const out = { t: text(o.t, 80, `${n} (titre)`, true), x: num(o.x, 0, 3600, `${n} (position x)`), y: num(o.y, 0, 2250, `${n} (position y)`), r: num(o.r ?? 0, -8, 8, `${n} (rotation)`) }
    if (head) out.k = 'head'
    if (o.g !== undefined && o.g !== null && o.g !== '') {
      if (!GROUPS.includes(o.g)) throw new HttpError(400, `${n} : catégorie inconnue`)
      out.g = o.g
    } else if (head) throw new HttpError(400, `${n} : un titre de colonne a besoin d'une catégorie`)
    if (!head) {
      const tag = text(o.tag, 30, `${n} (étiquette)`)
      if (tag) out.tag = tag
      out.txt = text(o.txt, 600, `${n} (texte)`)
      if (o.key) out.key = 1
      if (o.web) out.web = 1
      if (o.bg) { if (typeof o.bg !== 'string' || !HEX.test(o.bg)) throw new HttpError(400, `${n} : couleur invalide`); out.bg = o.bg }
    }
    const w = num(o.w, 150, 600, `${n} (largeur)`, false)
    if (w !== undefined) out.w = w
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v]))
  })
  if (!items.some((o) => o.k === 'head' && o.g)) throw new HttpError(400, 'Garde au moins un titre de colonne')
  return { items }
}

export const BLOCKS = { spidernet }
export const isBlock = (k) => Object.hasOwn(BLOCKS, k)
export const parseBlock = (key, body) => BLOCKS[key](body)

export async function getBlock(env, key) {
  const row = await env.DB.prepare('SELECT data, updated_at FROM content WHERE key = ?').bind(key).first()
  if (!row) return null
  try { return { ...JSON.parse(row.data), updatedAt: row.updated_at } } catch { return null }
}
