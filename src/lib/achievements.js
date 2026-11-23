// Succès : stockés uniquement dans le navigateur (localStorage), sans compte ni envoi au serveur.
import { ref, computed } from 'vue'

export const LIST = [
  { id: 'bienvenue', icon: '👋', title: 'Premier pas', desc: 'Visiter le site.' },
  { id: 'explorateur', icon: '🧭', title: 'Explorateur', desc: 'Visiter 5 pages différentes.' },
  { id: 'lecteur', icon: '📖', title: 'Lecteur', desc: 'Ouvrir un article de veille.' },
  { id: 'curieux', icon: '🔎', title: 'Curieux', desc: 'Ouvrir la palette de commandes (Ctrl K).' },
  { id: 'nocturne', icon: '🌙', title: 'Oiseau de nuit', desc: 'Passer en mode sombre.' },
  { id: 'accessible', icon: '♿', title: 'Pour tous', desc: 'Ouvrir les réglages d\'accessibilité.' },
  { id: 'hacker', icon: '⌨️', title: 'Hacker', desc: 'Ouvrir le terminal (touche « ` »).' },
  { id: 'jardinier', icon: '🌱', title: 'Main verte', desc: 'Planter un arbre dans le décor.' },
  { id: 'cv', icon: '📄', title: 'Recruteur', desc: 'Ouvrir le téléchargement du CV.' },
  { id: 'contact', icon: '✉️', title: 'Prise de contact', desc: 'Visiter la page Contact.' },
  { id: 'veilleur', icon: '🦉', title: 'Veilleur de nuit', desc: 'Visiter le site entre minuit et 5 h.' },
  { id: 'konami', icon: '🎮', title: 'Vieille école', desc: 'Saisir le code Konami.' },
  { id: 'sudo', icon: '🔐', title: 'Tentative d\'intrusion', desc: 'Essayer « sudo » dans le terminal.' },
]
const KEY = 'succes'
const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {} } catch { return {} } }
export const unlocked = ref(read()) // { id: timestamp }
export const toasts = ref([])
export const count = computed(() => LIST.filter((a) => unlocked.value[a.id]).length)

export function unlock(id) {
  const a = LIST.find((x) => x.id === id)
  if (!a || unlocked.value[id]) return
  unlocked.value = { ...unlocked.value, [id]: Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(unlocked.value)) } catch { /* stockage indisponible */ }
  const n = { key: id + Date.now(), ...a }
  toasts.value = [...toasts.value, n].slice(-3)
  setTimeout(() => { toasts.value = toasts.value.filter((x) => x !== n) }, 5000)
}
export function reset() {
  unlocked.value = {}
  try { localStorage.removeItem(KEY) } catch { /* ignoré */ }
}

const seen = new Set()
export function onPage(route) {
  if (route.path.startsWith('/admin')) return
  unlock('bienvenue')
  seen.add(route.path)
  if (seen.size >= 5) unlock('explorateur')
  if (route.name === 'veille-article') unlock('lecteur')
  if (route.name === 'contact') unlock('contact')
  const h = new Date().getHours()
  if (h < 5) unlock('veilleur')
}
