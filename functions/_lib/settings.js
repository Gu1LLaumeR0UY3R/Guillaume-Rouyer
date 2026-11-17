// Réglages globaux du site (table `settings`, une ligne par réglage, valeur en JSON).
// Les valeurs par défaut sont celles d'avant l'admin : si la table est vide, le site s'affiche comme avant.
import { HttpError } from './http.js'
import { httpsUrl } from './projects.js'
import { str } from './validate.js'

export const DEFAULTS = {
  contactEmail: 'gui.rouyer@gmail.com',
  githubUrl: 'https://github.com/Gu1LLaumeR0UY3R',
  linkedinUrl: 'https://www.linkedin.com/in/guillaume-rouyer',
  footerText: '© 2026 Guillaume Rouyer · Fait avec Vue.js',
  maintenanceOn: false,
  maintenanceMessage: '',
}
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
  if (b.maintenanceMessage !== undefined) out.maintenanceMessage = str(b.maintenanceMessage, { max: 300, name: 'message de maintenance' })
  return out
}

export async function saveSettings(env, values) {
  const now = Date.now()
  const stmts = Object.entries(values).map(([k, v]) =>
    env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
      .bind(`site.${k}`, JSON.stringify(v), now))
  if (stmts.length) await env.DB.batch(stmts)
}
