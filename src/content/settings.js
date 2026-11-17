// Réglages du site (e-mail, liens, pied de page, maintenance globale), lus depuis l'API.
// Si l'API est indisponible, on garde les valeurs par défaut : le site s'affiche comme avant.
import { computed, ref } from 'vue'

export const DEFAULTS = {
  contactEmail: 'gui.rouyer@gmail.com',
  githubUrl: 'https://github.com/Gu1LLaumeR0UY3R',
  linkedinUrl: 'https://www.linkedin.com/in/guillaume-rouyer',
  footerText: '© 2026 Guillaume Rouyer · Fait avec Vue.js',
  maintenanceOn: false,
  maintenanceMessage: '',
}

export const settings = ref({ ...DEFAULTS })
export const settingsReady = ref(false)

// Défense en plus de la validation du serveur : seuls un e-mail simple et des liens https sont affichés
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,190}\.[A-Za-z]{2,24}$/
const https = (u) => (typeof u === 'string' && u.startsWith('https://') ? u : '')

export const links = computed(() => {
  const s = settings.value
  return [
    EMAIL.test(s.contactEmail) && { label: s.contactEmail, href: `mailto:${s.contactEmail}`, primary: true },
    https(s.githubUrl) && { label: 'GitHub', href: https(s.githubUrl), external: true },
    https(s.linkedinUrl) && { label: 'LinkedIn', href: https(s.linkedinUrl), external: true },
  ].filter(Boolean)
})

let pending
export function loadSettings() {
  pending ??= fetch('/api/settings', { signal: AbortSignal.timeout(4000) }) // jamais de page blanche si l'API tarde
    .then((r) => { if (!r.ok) throw new Error(); return r.json() })
    .then((d) => { settings.value = { ...DEFAULTS, ...d.settings } })
    .catch(() => { /* valeurs par défaut */ })
    .finally(() => { settingsReady.value = true })
  return pending
}
