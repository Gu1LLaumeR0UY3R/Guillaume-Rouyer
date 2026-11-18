// Médias : validation du contenu, encodage, et recherche des endroits où une image est utilisée.
import { HttpError } from './http.js'

export const MAX_BYTES = 1_000_000          // taille maximale d'une image stockée (le navigateur la réduit avant l'envoi)
export const MAX_TOTAL = 500_000_000        // espace total réservé aux médias (la base gratuite offre 5 Go)
export const TRASH_DAYS = 30
export const ID_RE = /^[a-f0-9]{24}$/

// Type réel du fichier, lu dans ses premiers octets (on ne fait pas confiance à l'en-tête envoyé).
export function sniff(b) {
  const at = (i, s) => [...s].every((c, k) => b[i + k] === c.charCodeAt(0))
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (at(1, 'PNG') && b[0] === 0x89) return 'image/png'
  if (at(0, 'RIFF') && at(8, 'WEBP')) return 'image/webp'
  if (at(4, 'ftyp') && (at(8, 'avif') || at(8, 'avis'))) return 'image/avif'
  return null
}

export function toBase64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
export const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

export function newId() {
  const a = crypto.getRandomValues(new Uint8Array(12))
  return [...a].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function validId(id) {
  if (!ID_RE.test(id || '')) throw new HttpError(404, 'Média introuvable')
  return id
}

// Où chaque image est-elle utilisée ? On cherche /media/<id> dans les projets et les réglages.
// Renvoie { [id]: [{ kind, label, href? }] } pour les ids demandés.
export async function usageOf(env, ids) {
  const out = Object.fromEntries(ids.map((i) => [i, []]))
  if (!ids.length) return out
  const { results: projects } = await env.DB.prepare('SELECT slug, name, description, note, details, banner_image FROM projects').all()
  for (const p of projects) {
    const text = `${p.description}\n${p.note}\n${p.details}\n${p.banner_image ?? ''}`
    for (const id of ids) if (text.includes(`/media/${id}`)) out[id].push({ kind: 'projet', label: p.name, href: `/admin/projets/${p.slug}` })
  }
  const { results: settings } = await env.DB.prepare("SELECT key, value FROM settings WHERE key LIKE 'site.%'").all()
  const names = { 'site.announceLink': 'Annonce', 'site.announceText': 'Annonce' }
  for (const s of settings) {
    for (const id of ids) if (s.value.includes(`/media/${id}`)) out[id].push({ kind: 'réglage', label: names[s.key] || s.key.slice(5), href: '/admin/reglages' })
  }
  return out
}
