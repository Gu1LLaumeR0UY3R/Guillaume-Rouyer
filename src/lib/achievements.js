// Succès : stockés uniquement dans le navigateur (localStorage), sans compte ni envoi au serveur.
import { ref, computed } from 'vue'
import { loadBlock } from '../content/blocks.js'

// rarity : 1 commun, 2 inhabituel, 3 rare, 4 épique. emblem : forme de l'emblème (voir AchEmblem.vue). cat : catégorie d'affichage.
export const BASE = [
  { id: 'bienvenue', emblem: 'star', rarity: 1, cat: 'Découverte', title: 'Premier pas', desc: 'Visiter le site.' },
  { id: 'contact', emblem: 'mail', rarity: 1, cat: 'Découverte', title: 'Prise de contact', desc: 'Visiter la page Contact.' },
  { id: 'explorateur', emblem: 'compass', rarity: 2, cat: 'Exploration', title: 'Explorateur', desc: 'Visiter 5 pages différentes.' },
  { id: 'lecteur', emblem: 'feather', rarity: 2, cat: 'Exploration', title: 'Lecteur', desc: 'Ouvrir un article de veille.' },
  { id: 'curieux', emblem: 'search', rarity: 2, cat: 'Découverte', title: 'Curieux', desc: 'Ouvrir la palette de commandes (Ctrl K).' },
  { id: 'nocturne', emblem: 'moon', rarity: 2, cat: 'Collection', title: 'Oiseau de nuit', desc: 'Passer en mode sombre.' },
  { id: 'accessible', emblem: 'person', rarity: 2, cat: 'Découverte', title: 'Pour tous', desc: 'Ouvrir les réglages d\'accessibilité.' },
  { id: 'jardinier', emblem: 'sprout', rarity: 2, cat: 'Collection', title: 'Main verte', desc: 'Planter un arbre dans le décor.' },
  { id: 'cv', emblem: 'doc', rarity: 3, cat: 'Exploration', title: 'Recruteur', desc: 'Ouvrir le téléchargement du CV.' },
  { id: 'hacker', emblem: 'terminal', rarity: 3, cat: 'Maîtrise', title: 'Hacker', desc: 'Ouvrir le terminal (touche « ` »).' },
  { id: 'veilleur', emblem: 'eye', rarity: 3, cat: 'Collection', title: 'Veilleur de nuit', desc: 'Visiter le site entre minuit et 5 h.' },
  { id: 'konami', emblem: 'pad', rarity: 4, cat: 'Maîtrise', title: 'Vieille école', desc: 'Saisir le code Konami.' },
  { id: 'sudo', emblem: 'key', rarity: 4, cat: 'Maîtrise', title: 'Tentative d\'intrusion', desc: 'Essayer « sudo » dans le terminal.' },
]
export const CATS = ['Exploration', 'Collection', 'Découverte', 'Maîtrise']
export const RARITY = { 1: 'Commun', 2: 'Inhabituel', 3: 'Rare', 4: 'Épique' }
// Textes modifiables depuis l'admin (bloc « succes ») : remplacent le nom, la description et l'icône d'origine.
const custom = ref({})
export const items = computed(() => BASE.map((a) => ({ ...a, ...(custom.value[a.id] ?? {}) })))
export const TOTAL = BASE.length
export async function loadCustom() {
  const d = await loadBlock('succes')
  if (!d?.items) return
  custom.value = Object.fromEntries(d.items.map((o) => [o.id, { ...(o.title && { title: o.title }), ...(o.desc !== undefined && { desc: o.desc }), }]))
}
const KEY = 'succes'
const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {} } catch { return {} } }
export const unlocked = ref(read()) // { id: timestamp }
export const toasts = ref([])
export const count = computed(() => BASE.filter((a) => unlocked.value[a.id]).length)

// File d'attente : une notification à la fois, chacune visible 5,2 s.
function next() {
  setTimeout(() => {
    toasts.value = toasts.value.slice(1)
    if (toasts.value.length) next()
  }, 5200)
}
export function unlock(id) {
  const a = items.value.find((x) => x.id === id)
  if (!a || unlocked.value[id]) return
  unlocked.value = { ...unlocked.value, [id]: Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(unlocked.value)) } catch { /* stockage indisponible */ }
  toasts.value = [...toasts.value, { key: id + Date.now(), ...a }]
  if (toasts.value.length === 1) next()
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
