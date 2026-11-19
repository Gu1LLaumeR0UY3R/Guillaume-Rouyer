// Contenus éditables : liste blanche des blocs et validation de chacun.
import { HttpError } from './http.js'

export const GROUPS = ['concept', 'socle', 'valo', 'tech']
const MAX_ITEMS = 80
const HEX = /^#[0-9a-f]{6}$/i

const text = (v, max, name, req = false) => {
  if (v === undefined || v === null || v === '') { if (req) throw new HttpError(400, `${name} : champ obligatoire`); return '' }
  if (typeof v !== 'string') throw new HttpError(400, `${name} : texte attendu`)
  const t = v.trim()
  if (t.length > max) throw new HttpError(400, `${name} : ${max} caractères au maximum`)
  if (req && !t) throw new HttpError(400, `${name} : champ obligatoire`)
  return t
}
const num = (v, min, max, name, req = true) => {
  if ((v === undefined || v === null) && !req) return undefined
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new HttpError(400, `${name} : nombre entre ${min} et ${max}`)
  return Math.round(v * 10) / 10
}

// SpiderNet : tableau d'enquête. Chaque élément est un titre de colonne (k = 'head') ou une carte.
function spidernet(body) {
  if (!Array.isArray(body?.items) || !body.items.length) throw new HttpError(400, 'Le tableau doit contenir au moins un élément')
  if (body.items.length > MAX_ITEMS) throw new HttpError(400, `${MAX_ITEMS} éléments au maximum`)
  const items = body.items.map((o, i) => {
    const n = `Élément ${i + 1}`
    if (!o || typeof o !== 'object') throw new HttpError(400, `${n} : invalide`)
    const head = o.k === 'head'
    const out = { t: text(o.t, 80, `${n} (titre)`, true), x: num(o.x, 0, 3600, `${n} (position x)`), y: num(o.y, 0, 2250, `${n} (position y)`), r: num(o.r ?? 0, -8, 8, `${n} (rotation)`) }
    if (head) out.k = 'head'
    if (o.g !== undefined && o.g !== null && o.g !== '') {
      if (!GROUPS.includes(o.g)) throw new HttpError(400, `${n} : catégorie inconnue`)
      out.g = o.g
    } else if (head) throw new HttpError(400, `${n} : un titre de colonne a besoin d'une catégorie`)
    if (!head) {
      const tag = text(o.tag, 30, `${n} (étiquette)`)
      if (tag) out.tag = tag
      out.txt = text(o.txt, 600, `${n} (texte)`)
      if (o.key) out.key = 1
      if (o.web) out.web = 1
      if (o.bg) { if (typeof o.bg !== 'string' || !HEX.test(o.bg)) throw new HttpError(400, `${n} : couleur invalide`); out.bg = o.bg }
    }
    const w = num(o.w, 150, 600, `${n} (largeur)`, false)
    if (w !== undefined) out.w = w
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v]))
  })
  if (!items.some((o) => o.k === 'head' && o.g)) throw new HttpError(400, 'Garde au moins un titre de colonne')
  return { items }
}

// --- Textes bilingues du site (accueil, à propos, compétences, parcours) ---
// Chaque texte existe en français (obligatoire) et en anglais (facultatif : s'il manque, le français s'affiche).
const bi = (o, key, max, n, req = false) => ({
  [`${key}_fr`]: text(o?.[`${key}_fr`], max, `${n} (français)`, req),
  [`${key}_en`]: text(o?.[`${key}_en`], max, `${n} (anglais)`),
})
const list = (v, max, n) => {
  if (!Array.isArray(v)) throw new HttpError(400, `${n} : liste attendue`)
  if (v.length > max) throw new HttpError(400, `${n} : ${max} éléments au maximum`)
  return v
}

function home(b) {
  return { ...bi(b, 'badge', 160, 'Badge'), ...bi(b, 'titleA', 80, 'Titre', true), ...bi(b, 'titleB', 40, 'Mot en couleur'), ...bi(b, 'lead', 400, 'Présentation', true), ...bi(b, 'cta', 40, 'Bouton') }
}

function about(b) {
  const bios = list(b?.bios ?? [], 6, 'Paragraphes').map((o, i) => bi(o, 'text', 1200, `Paragraphe ${i + 1}`, true))
  const facts = list(b?.facts ?? [], 12, 'Infos rapides').map((o, i) => bi(o, 'text', 80, `Info ${i + 1}`, true))
  if (!bios.length) throw new HttpError(400, 'Garde au moins un paragraphe')
  return { bios, facts }
}

function skills(b) {
  const groups = list(b?.groups, 12, 'Groupes').map((g, i) => {
    const n = `Groupe ${i + 1}`
    const items = list(g?.items ?? [], 40, `${n} (compétences)`).map((it, k) => ({
      name: text(it?.name, 40, `${n}, compétence ${k + 1}`, true),
      level: num(it?.level ?? 0, 0, 100, `${n}, niveau de « ${it?.name ?? ''} »`),
    }))
    return { ...bi(g, 'title', 60, `${n} (titre)`, true), items }
  })
  if (!groups.length) throw new HttpError(400, 'Garde au moins un groupe')
  return { groups }
}

const entry = (o, i, kind) => {
  const n = `${kind} ${i + 1}`
  const points = (o?.points_fr ?? []), pointsEn = (o?.points_en ?? [])
  return {
    ...bi(o, 'when', 80, `${n} (période)`, true), ...bi(o, 'title', 120, `${n} (titre)`, true), ...bi(o, 'place', 200, `${n} (lieu)`),
    points_fr: list(points, 10, `${n} (points)`).map((p) => text(p, 240, `${n} (point)`, true)),
    points_en: list(pointsEn, 10, `${n} (points anglais)`).map((p) => text(p, 240, `${n} (point anglais)`, true)),
    tech: text(o?.tech, 160, `${n} (technologies)`),
  }
}
function timeline(b) {
  return {
    formation: list(b?.formation ?? [], 15, 'Formations').map((o, i) => entry(o, i, 'Formation')),
    experience: list(b?.experience ?? [], 15, 'Expériences').map((o, i) => entry(o, i, 'Expérience')),
  }
}

export const BLOCKS = { spidernet, home, about, skills, timeline }
export const isBlock = (k) => Object.hasOwn(BLOCKS, k)
export const parseBlock = (key, body) => BLOCKS[key](body)

export async function getBlock(env, key) {
  const row = await env.DB.prepare('SELECT data, updated_at FROM content WHERE key = ?').bind(key).first()
  if (!row) return null
  try { return { ...JSON.parse(row.data), updatedAt: row.updated_at } } catch { return null }
}

// Ce que lit le site public (`/api/content`) : les blocs enregistrés, dans la forme attendue par src/content/site.js.
// Un bloc jamais modifié est absent : le site garde alors son contenu d'origine.
export async function publicContent(env) {
  const { results } = await env.DB.prepare("SELECT key, data FROM content WHERE key IN ('home', 'about', 'skills', 'timeline')").all()
  const b = {}
  for (const r of results) { try { b[r.key] = JSON.parse(r.data) } catch { /* bloc illisible : ignoré */ } }
  const out = {}
  if (b.home) out.home = b.home
  if (b.about) out.about = [...b.about.bios.map((x) => ({ kind: 'bio', ...x })), ...b.about.facts.map((x) => ({ kind: 'fact', ...x }))]
  if (b.skills) {
    out.skill_groups = b.skills.groups.map((g, i) => ({ id: i + 1, title_fr: g.title_fr, title_en: g.title_en }))
    out.skills = b.skills.groups.flatMap((g, i) => g.items.map((it, k) => ({ id: (i + 1) * 100 + k, group_id: i + 1, name: it.name, level: it.level })))
  }
  if (b.timeline) out.timeline = [...b.timeline.formation.map((x) => ({ kind: 'formation', ...x })), ...b.timeline.experience.map((x) => ({ kind: 'experience', ...x }))]
  return out
}
