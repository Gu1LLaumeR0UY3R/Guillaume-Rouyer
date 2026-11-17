// Règles de validation et mise en forme des projets. Rien venant du navigateur n'est stocké tel quel.
import { HttpError } from './http.js'
import { str } from './validate.js'

export const STATUSES = ['online', 'wip', 'maintenance', 'hidden']
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
// Dégradé CSS autorisé : angle ou direction + 2 à 4 couleurs hexadécimales. Tout le reste est refusé (pas d'injection CSS).
const GRADIENT = /^linear-gradient\(\s*(\d{1,3}deg|to (top|bottom|left|right)( (left|right|top|bottom))?)\s*,\s*#[0-9a-f]{3,8}(\s+\d{1,3}%)?(\s*,\s*#[0-9a-f]{3,8}(\s+\d{1,3}%)?){1,3}\s*\)$/i
const BOARD = /^\/projets(\/[a-z0-9-]+)+$/

export function validSlug(s) {
  if (typeof s !== 'string' || s.length > 60 || !SLUG.test(s)) throw new HttpError(400, 'Identifiant invalide (minuscules, chiffres et tirets)')
  return s
}

function strList(v, { max, itemMax, name }) {
  if (!Array.isArray(v) || v.length > max) throw new HttpError(400, `${name} invalide`)
  return v.map((x) => str(x, { min: 1, max: itemMax, name }))
}

export function httpsUrl(v, name) {
  if (v == null || v === '') return null
  const s = str(v, { max: 200, name })
  let u
  try { u = new URL(s) } catch { throw new HttpError(400, `${name} invalide`) }
  if (u.protocol !== 'https:') throw new HttpError(400, `${name} : https uniquement`)
  return u.href
}

function parseDetails(d) {
  if (d == null) return { lead: '', notice: '', sections: [] }
  if (typeof d !== 'object' || Array.isArray(d)) throw new HttpError(400, 'Détails invalides')
  const sections = d.sections ?? []
  if (!Array.isArray(sections) || sections.length > 12) throw new HttpError(400, 'Sections invalides (12 maximum)')
  return {
    lead: str(d.lead ?? '', { max: 800, name: 'introduction' }),
    notice: str(d.notice ?? '', { max: 400, name: 'encadré' }),
    sections: sections.map((s) => {
      if (!s || typeof s !== 'object') throw new HttpError(400, 'Section invalide')
      return {
        title: str(s.title, { min: 1, max: 100, name: 'titre de section' }),
        paragraphs: strList(s.paragraphs ?? [], { max: 12, itemMax: 1200, name: 'paragraphe' }),
        points: strList(s.points ?? [], { max: 15, itemMax: 400, name: 'point' }),
      }
    }),
  }
}

// Champs d'un projet (hors slug). `partial` = seuls les champs présents sont contrôlés (PATCH).
export function parseProject(b, { partial = false } = {}) {
  const has = (k) => !partial || b[k] !== undefined
  const out = {}
  if (has('name')) out.name = str(b.name, { min: 1, max: 80, name: 'nom' })
  if (has('tag')) out.tag = str(b.tag, { min: 1, max: 20, name: 'catégorie' })
  if (has('status')) {
    if (!STATUSES.includes(b.status)) throw new HttpError(400, 'Statut invalide')
    out.status = b.status
  }
  if (has('accent')) {
    const a = str(b.accent ?? '', { max: 200, name: 'dégradé' })
    if (a && !GRADIENT.test(a)) throw new HttpError(400, 'Dégradé invalide')
    out.accent = a
  }
  if (has('description')) out.description = str(b.description ?? '', { max: 600, name: 'description' })
  if (has('stack')) out.stack = strList(b.stack ?? [], { max: 12, itemMax: 30, name: 'technologie' })
  if (has('repo')) out.repo = httpsUrl(b.repo, 'lien du code')
  if (has('note')) out.note = b.note ? str(b.note, { max: 200, name: 'note' }) : null
  if (has('featured')) out.featured = b.featured ? 1 : 0
  if (has('board')) {
    const v = b.board ? str(b.board, { max: 100, name: 'lien interne' }) : null
    if (v && !BOARD.test(v)) throw new HttpError(400, 'Lien interne invalide')
    out.board = v
  }
  if (has('maintenanceMessage')) out.maintenance_message = b.maintenanceMessage ? str(b.maintenanceMessage, { max: 300, name: 'message de maintenance' }) : null
  if (has('details')) out.details = parseDetails(b.details)
  return out
}

const parse = (s, fallback) => { try { return JSON.parse(s) } catch { return fallback } }

// Ligne SQL -> objet pour le navigateur.
export function toApi(r, { details = false } = {}) {
  const p = {
    slug: r.slug, name: r.name, tag: r.tag, status: r.status, accent: r.accent, desc: r.description,
    stack: parse(r.stack, []), repo: r.repo, note: r.note, featured: !!r.featured, board: r.board, maintenanceMessage: r.maintenance_message ?? '',
  }
  if (details) { p.details = parse(r.details, { lead: '', notice: '', sections: [] }); p.position = r.position; p.updatedAt = r.updated_at; p.prevStatus = r.prev_status ?? null }
  return p
}
export const COLUMNS = 'slug, name, tag, status, accent, description, stack, repo, note, featured, board, maintenance_message, details, position, updated_at, prev_status'

// Interrupteur de maintenance : en passant en maintenance on mémorise l'ancien statut, qui est rétabli à la désactivation.
export function nextPrevStatus(old, newStatus) {
  if (newStatus !== 'maintenance') return null
  return old.status === 'maintenance' ? old.prev_status ?? null : old.status
}
export const restoredStatus = (old) => (STATUSES.includes(old.prev_status) && old.prev_status !== 'maintenance' ? old.prev_status : 'online')
