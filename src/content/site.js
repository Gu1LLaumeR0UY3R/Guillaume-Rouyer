// Contenu du portfolio (à propos, compétences, parcours, jeux) lu depuis la BDD via /api/content.
// Si l'API est indisponible (ex. `npm run dev` sans wrangler), on retombe sur les données écrites dans src/data.
import { computed, ref } from 'vue'
import { FACTS, SKILLS } from '../data/skills.js'
import { EXPERIENCES, FORMATION } from '../data/timeline.js'

export const BIO = [
  "Je suis développeur junior, passionné par les nouvelles technologies. Autodidacte et curieux, j'aime comprendre comment les choses fonctionnent, des API REST aux applications mobiles, jusqu'à l'auto-hébergement d'une IA locale sur mon propre serveur Proxmox.",
  "Je me forme au Bachelor Concepteur Développeur d'Applications (Full Stack & Cybersécurité), après un BTS SIO option SLAM. J'aime autant construire l'interface que l'infrastructure qui la fait tourner : PHP et Laravel, Python et FastAPI, Vue.js, React Native, Docker.",
]

function fallback() {
  const timeline = (kind, list) => list.map((i) => ({
    kind, when_fr: i.when, when_en: i.when, title_fr: i.title, title_en: i.title, place_fr: i.where, place_en: i.where,
    points_fr: i.points ?? [], points_en: i.points ?? [], tech: i.tech ?? '',
  }))
  return {
    about: [...BIO.map((t) => ({ kind: 'bio', text_fr: t, text_en: t })), ...FACTS.map((t) => ({ kind: 'fact', text_fr: t, text_en: t }))],
    skill_groups: SKILLS.map((g, i) => ({ id: i + 1, title_fr: g.title, title_en: g.title })),
    skills: SKILLS.flatMap((g, i) => g.items.map((name, n) => ({ id: i * 100 + n, group_id: i + 1, name, level: 0 }))),
    timeline: [...timeline('formation', FORMATION), ...timeline('experience', EXPERIENCES)],
    games: [],
  }
}

export const site = ref(fallback())
export const siteLoaded = ref(false)
let pending = null

export function loadSite() {
  pending ??= fetch('/api/content', { headers: { Accept: 'application/json' } })
    .then((r) => { if (!r.ok) throw new Error('indisponible'); return r.json() })
    .then((d) => { if (d && Object.keys(d).length) site.value = { ...fallback(), ...d } })
    .catch(() => { /* on garde les données locales */ })
    .finally(() => { siteLoaded.value = true })
  return pending
}

export const bios = computed(() => site.value.about.filter((a) => a.kind === 'bio'))
export const facts = computed(() => site.value.about.filter((a) => a.kind === 'fact'))
export const skillGroups = computed(() => site.value.skill_groups.map((g) => ({ ...g, items: site.value.skills.filter((s) => s.group_id === g.id) })))
export const formations = computed(() => site.value.timeline.filter((x) => x.kind === 'formation'))
export const experiences = computed(() => site.value.timeline.filter((x) => x.kind === 'experience'))

// Textes de l'en-tête de l'accueil modifiés dans l'admin (vide = textes d'origine du dictionnaire i18n)
export const home = computed(() => site.value.home ?? {})
