// Validation stricte des entrées : on refuse ce qui n'est pas attendu, on n'essaie pas de « réparer ».
import { HttpError } from './http.js'

export function str(v, { min = 0, max = 200, name = 'champ' } = {}) {
  if (typeof v !== 'string') throw new HttpError(400, `${name} invalide`)
  const s = v.normalize('NFC')
  if (s.length < min || s.length > max) throw new HttpError(400, `${name} : entre ${min} et ${max} caractères`)
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s)) throw new HttpError(400, `${name} contient des caractères interdits`)
  return s
}

export function int(v, { min, max, def, name = 'nombre' }) {
  if (v === undefined || v === null || v === '') return def
  const n = Number(v)
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${name} invalide`)
  return n
}

export function oneOf(v, allowed, { def = '', name = 'valeur' } = {}) {
  if (v === undefined || v === null || v === '') return def
  if (!allowed.includes(v)) throw new HttpError(400, `${name} invalide`)
  return v
}

// 14 caractères minimum et au moins 3 types parmi : minuscule, majuscule, chiffre, symbole.
export function checkPassword(p) {
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length
  if (p.length < 14 || p.length > 128 || classes < 3) throw new HttpError(400, 'Mot de passe : 14 caractères minimum, avec au moins 3 types (minuscule, majuscule, chiffre, symbole)')
}

// À utiliser si un texte venant d'un visiteur doit être inséré dans du HTML.
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
