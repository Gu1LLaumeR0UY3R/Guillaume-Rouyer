// Préférences d'accessibilité du visiteur (taille du texte, contraste, espacement, police, liens, focus, animations).
// Elles restent dans le navigateur (localStorage) : rien n'est envoyé au serveur.
import { reactive, watch } from 'vue'

const KEY = 'a11y-prefs'
const DEFAULTS = { size: 100, contrast: false, spacing: false, font: false, links: false, focus: false, motion: false }
const SIZES = [100, 115, 130, 150]

function read() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { ...DEFAULTS, ...Object.fromEntries(Object.entries(DEFAULTS).filter(([k, v]) => typeof o[k] === typeof v).map(([k]) => [k, o[k]])), size: SIZES.includes(o.size) ? o.size : 100 }
  } catch { return { ...DEFAULTS } }
}

export const prefs = reactive(read())

export function applyPrefs() {
  const d = document.documentElement
  // Le zoom ne touche que le site (#app) : le panneau d'accessibilité, hors de #app, garde sa taille normale.
  const app = document.getElementById('app')
  if (app) app.style.zoom = prefs.size === 100 ? '' : String(prefs.size / 100)
  const flags = { contrast: 'high', spacing: 'wide', font: 'readable', links: 'on', focus: 'strong', motion: 'reduced' }
  for (const [k, v] of Object.entries(flags)) {
    if (prefs[k]) d.dataset[`a11y${k[0].toUpperCase()}${k.slice(1)}`] = v
    else delete d.dataset[`a11y${k[0].toUpperCase()}${k.slice(1)}`]
  }
  if (prefs.motion) d.dataset.motion = 'reduced'; else delete d.dataset.motion
}

export function setupA11y() {
  applyPrefs()
  watch(prefs, () => {
    applyPrefs()
    try { localStorage.setItem(KEY, JSON.stringify({ ...prefs })) } catch { /* stockage indisponible */ }
  }, { deep: true })
}
export const resetPrefs = () => Object.assign(prefs, DEFAULTS)
export { SIZES, DEFAULTS }
