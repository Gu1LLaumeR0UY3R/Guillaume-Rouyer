// Réglages globaux du site (table `settings`, une ligne par réglage, valeur en JSON).
// Les valeurs par défaut sont celles d'avant l'admin : si la table est vide, le site s'affiche comme avant.
import { HttpError } from './http.js'
import { httpsUrl } from './projects.js'
import { oneOf, str } from './validate.js'
import { DURATIONS, HHMM } from './availability.js'

export const DEFAULTS = {
  contactEmail: 'gui.rouyer@gmail.com',
  githubUrl: 'https://github.com/Gu1LLaumeR0UY3R',
  linkedinUrl: 'https://www.linkedin.com/in/guillaume-rouyer',
  footerText: '© 2026 Guillaume Rouyer · Fait avec Vue.js',
  maintenanceOn: false,
  maintenanceMessage: '',
  protectedMode: false, // « mode protégé » : limites plus strictes en cas d'attaque (jamais envoyé au public)
  // Bannière d'annonce (page d'accueil, avant les projets)
  announceOn: false,
  announceText: '',
  announceType: 'info', // info | nouveau | important
  announceLink: '',
  announceLinkLabel: '',
  announceStart: null, // date de début en ms (null = tout de suite)
  announceEnd: null, // date de fin en ms (null = sans fin)
  // Disponibilités pour échanger (calendrier de la page Contact) : plages hebdomadaires, heure de Paris
  availOn: false,
  availDays: [], // [{ dow: 0-6 (0 = dimanche), start: 'HH:MM', end: 'HH:MM' }]
  availDuration: 30, // durée d'un créneau, en minutes
  availNote: '',
}
export const ANNOUNCE_TYPES = ['info', 'nouveau', 'important']
export const ANNOUNCE_KEYS = Object.keys(DEFAULTS).filter((k) => k.startsWith('announce'))
const KEYS = Object.keys(DEFAULTS)
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/

export async function getSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings WHERE key LIKE ?').bind('site.%').all()
  const out = { ...DEFAULTS }
  for (const r of results) {
    const k = r.key.slice(5)
    if (!KEYS.includes(k)) continue
    try { out[k] = JSON.parse(r.value) } catch { /* valeur illisible : on garde la valeur par défaut */ }
  }
  return out
}

// Ce que le public voit : l'annonce seulement si elle est active maintenant (activée et dans ses dates). Jamais de brouillon.
export function publicSettings(s, now = Date.now()) {
  const pub = Object.fromEntries(Object.entries(s).filter(([k]) => !ANNOUNCE_KEYS.includes(k) && k !== 'protectedMode'))
  const live = s.announceOn && s.announceText && (!s.announceStart || now >= s.announceStart) && (!s.announceEnd || now < s.announceEnd)
  pub.announcement = live ? { text: s.announceText, type: s.announceType, link: s.announceLink, linkLabel: s.announceLinkLabel } : null
  return pub
}

// Valide les réglages reçus (seuls ceux qui sont présents sont contrôlés et enregistrés).
export function parseSettings(b) {
  const out = {}
  if (b.contactEmail !== undefined) {
    const v = str(b.contactEmail, { max: 254, name: 'e-mail' }).trim()
    if (v && !EMAIL.test(v)) throw new HttpError(400, 'E-mail invalide')
    out.contactEmail = v
  }
  for (const k of ['githubUrl', 'linkedinUrl']) {
    if (b[k] !== undefined) out[k] = httpsUrl(b[k], k === 'githubUrl' ? 'lien GitHub' : 'lien LinkedIn') ?? ''
  }
  if (b.footerText !== undefined) out.footerText = str(b.footerText, { max: 200, name: 'texte du pied de page' })
  if (b.maintenanceOn !== undefined) {
    if (typeof b.maintenanceOn !== 'boolean') throw new HttpError(400, 'Valeur de maintenance invalide')
    out.maintenanceOn = b.maintenanceOn
  }
  if (b.protectedMode !== undefined) {
    if (typeof b.protectedMode !== 'boolean') throw new HttpError(400, 'Valeur du mode protégé invalide')
    out.protectedMode = b.protectedMode
  }
  if (b.maintenanceMessage !== undefined) out.maintenanceMessage = str(b.maintenanceMessage, { max: 300, name: 'message de maintenance' })
  if (b.announceOn !== undefined) {
    if (typeof b.announceOn !== 'boolean') throw new HttpError(400, 'Valeur d\'annonce invalide')
    out.announceOn = b.announceOn
  }
  if (b.announceText !== undefined) out.announceText = str(b.announceText, { max: 200, name: 'texte de l\'annonce' }).trim()
  if (b.announceType !== undefined) out.announceType = oneOf(b.announceType, ANNOUNCE_TYPES, { def: 'info', name: 'type d\'annonce' })
  if (b.announceLink !== undefined) out.announceLink = announceLink(b.announceLink)
  if (b.announceLinkLabel !== undefined) out.announceLinkLabel = str(b.announceLinkLabel, { max: 40, name: 'texte du lien' }).trim()
  for (const k of ['announceStart', 'announceEnd']) {
    if (b[k] === undefined) continue
    if (b[k] !== null && (!Number.isInteger(b[k]) || b[k] < 0 || b[k] > 4102444800000)) throw new HttpError(400, 'Date invalide')
    out[k] = b[k]
  }
  if (b.availOn !== undefined) {
    if (typeof b.availOn !== 'boolean') throw new HttpError(400, 'Valeur des disponibilités invalide')
    out.availOn = b.availOn
  }
  if (b.availDuration !== undefined) {
    if (!DURATIONS.includes(b.availDuration)) throw new HttpError(400, `Durée de créneau : ${DURATIONS.join(', ')} minutes`)
    out.availDuration = b.availDuration
  }
  if (b.availNote !== undefined) out.availNote = str(b.availNote, { max: 200, name: 'note de disponibilité' }).trim()
  if (b.availDays !== undefined) {
    if (!Array.isArray(b.availDays) || b.availDays.length > 14) throw new HttpError(400, 'Disponibilités invalides (14 plages au maximum)')
    out.availDays = b.availDays.map((w) => {
      if (!w || !Number.isInteger(w.dow) || w.dow < 0 || w.dow > 6 || !HHMM.test(w.start ?? '') || !HHMM.test(w.end ?? '') || w.start >= w.end) throw new HttpError(400, 'Plage de disponibilité invalide : le début doit précéder la fin')
      return { dow: w.dow, start: w.start, end: w.end }
    })
  }
  if (out.announceStart && out.announceEnd && out.announceEnd <= out.announceStart) throw new HttpError(400, 'La fin doit être après le début')
  return out
}

// Lien d'annonce : une adresse https, ou une page du site (commence par un seul « / »).
function announceLink(v) {
  const s = str(v, { max: 300, name: 'lien de l\'annonce' }).trim()
  if (!s) return ''
  if (/^\/(?![/\\])[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#]*$/.test(s)) return s
  return httpsUrl(s, 'lien de l\'annonce') ?? ''
}

export async function saveSettings(env, values) {
  const now = Date.now()
  const stmts = Object.entries(values).map(([k, v]) =>
    env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
      .bind(`site.${k}`, JSON.stringify(v), now))
  if (stmts.length) await env.DB.batch(stmts)
}
