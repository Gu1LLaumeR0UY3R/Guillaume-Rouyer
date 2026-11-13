// Projets affichés sur le site. Ils viennent de la base (API) ; si l'API est indisponible,
// on se rabat sur les anciens fichiers data/projects.js et data/projectDetails.js.
import { computed, ref } from 'vue'
import { PROJECTS as FALLBACK } from '../data/projects.js'
import { DETAILS as FALLBACK_DETAILS } from '../data/projectDetails.js'

export const STATUS_LABEL = { wip: 'En cours', maintenance: 'Page en maintenance' }
export const statusLabel = (p) => STATUS_LABEL[p.status] ?? ''
export const projectLink = (p) => p.board || `/projets/${p.slug}`
// N'autorise que des liens https (défense en plus de la validation du serveur)
export const safeUrl = (u) => (typeof u === 'string' && u.startsWith('https://') ? u : null)

const FROM_LABEL = { 'En cours': 'wip', 'Page en maintenance': 'maintenance' }
const normalize = (p) => ({ ...p, status: FROM_LABEL[p.status] ?? 'online', maintenanceMessage: '' })

export const projects = ref([])
export const ready = ref(false)
export const tags = computed(() => ['Tout', ...new Set(projects.value.map((p) => p.tag))])
export const getProject = (slug) => projects.value.find((p) => p.slug === slug)

let pending
export function loadProjects() {
  pending ??= fetch('/api/projects')
    .then((r) => { if (!r.ok) throw new Error(); return r.json() })
    .then((d) => { projects.value = d.projects })
    .catch(() => { projects.value = FALLBACK.map(normalize) })
    .finally(() => { ready.value = true })
  return pending
}

// Un projet avec le contenu de sa page détaillée (null si introuvable ou masqué)
export async function loadDetail(slug) {
  try {
    const r = await fetch(`/api/projects/${encodeURIComponent(slug)}`)
    if (r.status === 404 || r.status === 400) return null
    if (!r.ok) throw new Error()
    return (await r.json()).project
  } catch {
    const p = FALLBACK.find((x) => x.slug === slug)
    return p ? { ...normalize(p), details: FALLBACK_DETAILS[slug] ?? null } : null
  }
}
