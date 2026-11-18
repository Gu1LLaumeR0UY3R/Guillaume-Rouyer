<script setup>
// Création et modification d'un projet, en sections : identité, statut, contenu, liens, bannière, page détaillée.
// À droite, un aperçu en direct (carte et bannière).
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { bannerBackground } from '../../content/projects.js'
import ProjectCard from '../../components/ProjectCard.vue'
import MediaPicker from './MediaPicker.vue'
import './adminForm.css'

const route = useRoute()
const router = useRouter()
const isNew = !route.params.slug
const error = ref('')
const busy = ref(false)
const loaded = ref(isNew)
const tags = ref(['Web', 'Mobile', 'IA', 'API', '3D'])
const picking = ref(false)
const dirty = ref(false)

const STATUSES = [
  { v: 'online', label: 'En ligne', hint: 'Visible par tout le monde.', icon: 'on' },
  { v: 'wip', label: 'En cours', hint: 'Visible, avec une pastille « En cours ».', icon: 'wip' },
  { v: 'maintenance', label: 'En maintenance', hint: 'Visible, mais la page affiche « bientôt de retour ».', icon: 'maint' },
  { v: 'hidden', label: 'Masqué', hint: 'Invisible pour le public. Toi seul le vois.', icon: 'off' },
]
const SECTIONS = [['identite', '1 · Identité'], ['statut', '2 · Statut'], ['contenu', '3 · Contenu'], ['liens', '4 · Liens'], ['banniere', '5 · Bannière'], ['page', '6 · Page détaillée']]

const f = reactive({
  slug: '', name: '', tag: 'Web', status: 'online', description: '', stack: [], repo: '', note: '', featured: false, board: '', maintenanceMessage: '',
  bannerMode: 'gradient', bannerImage: '', bannerDim: 35,
  c1: '#0f172a', c2: '#1e3a8a', c3: '#f59e0b', angle: 135, lead: '', notice: '', sections: [],
})
const stackInput = ref('')
// Champ « Autre… » : montre la catégorie si elle n'est pas dans la liste, et la remplace quand on tape.
const customTag = computed({ get: () => (tags.value.includes(f.tag) ? '' : f.tag), set: (v) => { f.tag = v.trim() ? v : (tags.value[0] ?? 'Web') } })
const originalAccent = ref('')
const accentTouched = ref(false) // réactif : sinon l'aperçu ne se met pas à jour quand on touche aux couleurs ou à l'angle

const accent = computed(() => `linear-gradient(${f.angle}deg,${f.c1},${f.c2} 55%,${f.c3})`)
// Tant que les couleurs ne sont pas touchées, on garde le dégradé d'origine tel quel (il peut avoir des réglages que le formulaire ne sait pas éditer).
const effectiveAccent = computed(() => (!isNew && !accentTouched.value && originalAccent.value ? originalAccent.value : accent.value))
const split = (s, re) => s.split(re).map((x) => x.trim()).filter(Boolean)

function fill(p) {
  Object.assign(f, {
    slug: p.slug, name: p.name, tag: p.tag, status: p.status, description: p.desc, stack: [...p.stack], repo: p.repo ?? '', note: p.note ?? '',
    featured: p.featured, board: p.board ?? '', maintenanceMessage: p.maintenanceMessage ?? '', lead: p.details?.lead ?? '', notice: p.details?.notice ?? '',
    bannerMode: p.bannerImage ? 'image' : 'gradient', bannerImage: p.bannerImage ?? '', bannerDim: p.bannerDim ?? 35,
    sections: (p.details?.sections ?? []).map((s) => ({ title: s.title, paragraphsText: s.paragraphs.join('\n\n'), pointsText: s.points.join('\n'), open: false })),
  })
  originalAccent.value = p.accent
  const m = /linear-gradient\((\d+)deg\s*,\s*(#[0-9a-f]{6})[^,]*,\s*(#[0-9a-f]{6})[^,]*,\s*(#[0-9a-f]{6})/i.exec(p.accent)
  if (m) Object.assign(f, { angle: +m[1], c1: m[2], c2: m[3], c3: m[4] })
}

onMounted(async () => {
  try {
    const all = (await api('/api/admin/projects')).projects
    tags.value = [...new Set([...tags.value, ...all.map((p) => p.tag)])]
    if (!isNew) {
      const p = all.find((x) => x.slug === route.params.slug)
      if (!p) { error.value = 'Projet introuvable'; return }
      fill(p)
    }
  } catch (e) { error.value = e.message } finally { loaded.value = true; setTimeout(() => { dirty.value = false }, 0) }
})
// Une modification non enregistrée déclenche un avertissement avant de quitter la page.
watch(f, () => { if (loaded.value) dirty.value = true }, { deep: true })
onBeforeRouteLeave(() => (dirty.value && !busy.value ? window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?') : true))

const preview = computed(() => ({
  slug: f.slug || 'apercu', name: f.name || 'Nom du projet', tag: f.tag, status: f.status, desc: f.description || 'La description du projet apparaît ici.', stack: f.stack,
  repo: f.repo || null, note: f.note, featured: f.featured, board: null,
  accent: effectiveAccent.value, bannerImage: f.bannerMode === 'image' ? f.bannerImage : null, bannerDim: f.bannerDim,
}))
const bannerBg = computed(() => bannerBackground(preview.value))
const statusInfo = computed(() => STATUSES.find((s) => s.v === f.status))

// Technologies : une pastille par technologie (Entrée ou virgule pour ajouter, Retour arrière pour retirer la dernière).
function addStack() {
  for (const t of split(stackInput.value, ',')) if (!f.stack.includes(t) && f.stack.length < 12) f.stack.push(t.slice(0, 30))
  stackInput.value = ''
}
function stackKey(e) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addStack() } else if (e.key === 'Backspace' && !stackInput.value) f.stack.pop()
}

const addSection = () => f.sections.push({ title: '', paragraphsText: '', pointsText: '', open: true })
const moveSection = (i, d) => { const j = i + d; if (j >= 0 && j < f.sections.length) [f.sections[i], f.sections[j]] = [f.sections[j], f.sections[i]] }
const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })

function payload() {
  return {
    slug: f.slug, name: f.name, tag: f.tag, status: f.status, accent: effectiveAccent.value,
    bannerImage: f.bannerMode === 'image' && f.bannerImage ? f.bannerImage : null, bannerDim: f.bannerDim,
    description: f.description, stack: f.stack, repo: f.repo || null, note: f.note || null, featured: f.featured,
    board: f.board || null, maintenanceMessage: f.maintenanceMessage || null,
    details: { lead: f.lead, notice: f.notice, sections: f.sections.map((s) => ({ title: s.title, paragraphs: split(s.paragraphsText, /\n\s*\n/), points: split(s.pointsText, '\n') })) },
  }
}

async function save() {
  addStack()
  error.value = ''; busy.value = true
  try {
    await api(isNew ? '/api/admin/projects' : `/api/admin/projects/${f.slug}`, { method: isNew ? 'POST' : 'PUT', body: payload() })
    dirty.value = false
    router.push('/admin/projets')
  } catch (e) { error.value = e.message; busy.value = false }
}
async function remove() {
  if (!window.confirm(`Supprimer définitivement « ${f.name} » ? Pour seulement le cacher, passe-le en statut « Masqué ».`)) return
  try { await api(`/api/admin/projects/${f.slug}`, { method: 'DELETE' }); dirty.value = false; router.push('/admin/projets') } catch (e) { error.value = e.message }
}
</script>

<template>
  <div class="admin wide pe">
    <RouterLink class="back" to="/admin/projets">← Tous les projets</RouterLink>
    <h1>{{ isNew ? 'Nouveau projet' : f.name || 'Modifier le projet' }}</h1>

    <nav class="jump" aria-label="Aller à une section">
      <button v-for="[id, label] in SECTIONS" :key="id" type="button" @click="go(id)">{{ label }}</button>
    </nav>

    <p v-if="error && !loaded" class="err" role="alert">{{ error }}</p>
    <form v-else class="flat" novalidate @submit.prevent="save">
      <div class="layout">
        <div class="main">
          <!-- 1 -->
          <section id="identite" class="block">
            <header><span class="num">1</span><div><h2>Identité</h2><p>Comment le projet s'appelle et où il se range.</p></div></header>
            <div class="grid2">
              <label>Nom du projet<input v-model="f.name" required maxlength="80" placeholder="Ex. : SpiderNet" /></label>
              <label>Identifiant dans l'adresse
                <input v-model="f.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" :readonly="!isNew" :class="{ locked: !isNew }" placeholder="mon-projet" />
                <span class="hint">/projets/{{ f.slug || '…' }} · {{ isNew ? 'minuscules, chiffres, tirets ; non modifiable ensuite' : 'non modifiable' }}</span>
              </label>
            </div>
            <div class="field">
              <span class="lbl">Catégorie <span class="hint">sert de filtre sur la page Projets</span></span>
              <div class="chips">
                <button v-for="t in tags" :key="t" type="button" class="chip" :class="{ on: f.tag === t }" :aria-pressed="f.tag === t" @click="f.tag = t">{{ t }}</button>
                <input v-model="customTag" class="chip-in" maxlength="20" placeholder="Autre…" aria-label="Nouvelle catégorie" />
              </div>
            </div>
          </section>

          <!-- 2 -->
          <section id="statut" class="block">
            <header><span class="num">2</span><div><h2>Statut</h2><p>Qui voit le projet, et sous quelle forme.</p></div></header>
            <div class="status-grid" role="radiogroup" aria-label="Statut">
              <label v-for="s in STATUSES" :key="s.v" class="status-card" :class="[s.v, { on: f.status === s.v }]">
                <input v-model="f.status" type="radio" name="status" :value="s.v" />
                <span class="ico" :class="s.icon" aria-hidden="true" />
                <strong>{{ s.label }}</strong>
                <span class="hint">{{ s.hint }}</span>
              </label>
            </div>
            <label v-if="f.status === 'maintenance'">Message de la page de maintenance
              <input v-model="f.maintenanceMessage" maxlength="300" placeholder="Cette page revient bientôt…" />
            </label>
            <label class="switch-row">
              <input v-model="f.featured" type="checkbox" />
              <span><strong>Projet phare</strong><span class="hint">Affiché en grand sur l'accueil, avec sa propre page détaillée.</span></span>
            </label>
          </section>

          <!-- 3 -->
          <section id="contenu" class="block">
            <header><span class="num">3</span><div><h2>Contenu</h2><p>Le texte de la carte et les technologies utilisées.</p></div></header>
            <label>Description courte <span class="hint">visible sur la carte du projet</span>
              <textarea v-model="f.description" maxlength="600" rows="4" placeholder="En deux ou trois phrases : à quoi sert ce projet ?" />
              <span class="hint count">{{ f.description.length }} / 600</span>
            </label>
            <div class="field">
              <span class="lbl">Technologies <span class="hint">Entrée ou virgule pour ajouter · {{ f.stack.length }} / 12</span></span>
              <div class="stack-box">
                <span v-for="(t, i) in f.stack" :key="t" class="pill">{{ t }}<button type="button" :aria-label="`Retirer ${t}`" title="Retirer" @click="f.stack.splice(i, 1)">×</button></span>
                <input v-model="stackInput" :disabled="f.stack.length >= 12" placeholder="Ex. : Vue.js" aria-label="Ajouter une technologie" @keydown="stackKey" @blur="addStack" />
              </div>
            </div>
          </section>

          <!-- 4 -->
          <section id="liens" class="block">
            <header><span class="num">4</span><div><h2>Liens</h2><p>Où trouver le code du projet.</p></div></header>
            <div class="grid2">
              <label>Lien du code <span class="hint">https uniquement</span><input v-model="f.repo" type="url" maxlength="200" placeholder="https://github.com/…" /></label>
              <label>Texte si le code est privé <span class="hint">remplace le lien</span><input v-model="f.note" maxlength="200" placeholder="Code privé (projet de stage)." /></label>
            </div>
            <details class="adv">
              <summary>Options avancées</summary>
              <label>Lien interne spécial <span class="hint">ex. /projets/spidernet/tableau. Remplace la page détaillée sur la carte. Laisse vide sinon.</span><input v-model="f.board" maxlength="100" /></label>
            </details>
          </section>

          <!-- 5 -->
          <section id="banniere" class="block">
            <header><span class="num">5</span><div><h2>Bannière</h2><p>Le bandeau en haut de la carte phare et de la page du projet.</p></div></header>
            <div class="seg" role="group" aria-label="Type de bannière">
              <button type="button" :aria-pressed="f.bannerMode === 'gradient'" @click="f.bannerMode = 'gradient'">Dégradé de couleurs</button>
              <button type="button" :aria-pressed="f.bannerMode === 'image'" @click="f.bannerMode = 'image'">Image</button>
            </div>

            <div v-if="f.bannerMode === 'gradient'" class="colors" @input="accentTouched = true">
              <label>Couleur 1<input v-model="f.c1" type="color" /></label>
              <label>Couleur 2<input v-model="f.c2" type="color" /></label>
              <label>Couleur 3<input v-model="f.c3" type="color" /></label>
              <label class="angle">Angle ({{ f.angle }}°)<input v-model.number="f.angle" type="range" min="0" max="360" /></label>
            </div>

            <template v-else>
              <div class="img-row">
                <button type="button" class="btn btn-primary" @click="picking = true">{{ f.bannerImage ? 'Changer l\'image' : 'Choisir une image' }}</button>
                <button v-if="f.bannerImage" type="button" class="btn btn-ghost btn-danger" @click="f.bannerImage = ''">Retirer l'image</button>
                <span v-if="!f.bannerImage" class="hint">Aucune image choisie : le dégradé est utilisé.</span>
              </div>
              <label class="angle">Assombrir l'image ({{ f.bannerDim }} %) <span class="hint">pour que le titre reste lisible</span><input v-model.number="f.bannerDim" type="range" min="0" max="80" step="5" /></label>
              <details class="adv">
                <summary>Dégradé de secours (affiché si l'image ne charge pas)</summary>
                <div class="colors" @input="accentTouched = true">
                  <label>Couleur 1<input v-model="f.c1" type="color" /></label>
                  <label>Couleur 2<input v-model="f.c2" type="color" /></label>
                  <label>Couleur 3<input v-model="f.c3" type="color" /></label>
                </div>
              </details>
            </template>

            <div class="banner-preview" :style="{ background: bannerBg }">
              <span class="bp-tag">Aperçu</span>
              <strong>{{ f.name || 'Nom du projet' }}</strong>
            </div>
          </section>

          <!-- 6 -->
          <section id="page" class="block">
            <header><span class="num">6</span><div><h2>Page détaillée</h2><p>Le texte de la page du projet (pour un projet phare).</p></div></header>
            <label>Introduction<textarea v-model="f.lead" maxlength="800" rows="3" placeholder="Le résumé en haut de la page." /></label>
            <label>Encadré <span class="hint">facultatif : une remarque mise en avant</span><input v-model="f.notice" maxlength="400" /></label>

            <h3 class="sub">Sections ({{ f.sections.length }} / 12)</h3>
            <p v-if="!f.sections.length" class="hint">Aucune section pour le moment.</p>
            <details v-for="(s, i) in f.sections" :key="i" class="sec" :open="s.open" @toggle="s.open = $event.target.open">
              <summary><span class="sn">{{ i + 1 }}</span><span class="st">{{ s.title || 'Section sans titre' }}</span></summary>
              <div class="sec-body">
                <label>Titre<input v-model="s.title" required maxlength="100" /></label>
                <label>Paragraphes <span class="hint">sépare-les par une ligne vide</span><textarea v-model="s.paragraphsText" rows="5" /></label>
                <label>Liste à puces <span class="hint">un point par ligne, facultatif</span><textarea v-model="s.pointsText" rows="4" /></label>
                <div class="actions">
                  <button class="btn btn-ghost small" type="button" :disabled="i === 0" @click="moveSection(i, -1)">↑ Monter</button>
                  <button class="btn btn-ghost small" type="button" :disabled="i === f.sections.length - 1" @click="moveSection(i, 1)">↓ Descendre</button>
                  <button class="btn btn-ghost btn-danger small" type="button" @click="f.sections.splice(i, 1)">Retirer</button>
                </div>
              </div>
            </details>
            <button class="btn btn-ghost small add" type="button" :disabled="f.sections.length >= 12" @click="addSection">+ Ajouter une section</button>
          </section>
        </div>

        <aside class="side" aria-label="Aperçu">
          <div class="side-box">
            <h2>Aperçu en direct</h2>
            <div class="mini-banner" :style="{ background: bannerBg }"><span>{{ f.name || 'Nom du projet' }}</span></div>
            <div class="card-wrap"><ProjectCard :project="preview" /></div>
            <p class="state" :class="f.status"><span class="ico" :class="statusInfo.icon" aria-hidden="true" /> {{ statusInfo.label }} · {{ statusInfo.hint }}</p>
          </div>
        </aside>
      </div>

      <div class="actionbar">
        <p v-if="error" class="err" role="alert">{{ error }}</p>
        <span v-else-if="dirty" class="dirty"><span class="dot" aria-hidden="true" /> Modifications non enregistrées</span>
        <span class="spacer" />
        <button v-if="!isNew" class="btn btn-ghost btn-danger" type="button" @click="remove">Supprimer</button>
        <RouterLink class="btn btn-ghost" to="/admin/projets">Annuler</RouterLink>
        <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Enregistrement…' : isNew ? 'Créer le projet' : 'Enregistrer' }}</button>
      </div>
    </form>

    <MediaPicker v-if="picking" :selected="f.bannerImage" @close="picking = false" @pick="(u) => { f.bannerImage = u; picking = false }" />
  </div>
</template>

<style scoped>
.back{display:inline-block;margin-bottom:4px;color:var(--green);font-weight:600;text-decoration:none;transition:transform .2s}
.back:hover{transform:translateX(-4px);text-decoration:underline}
.jump{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;padding:10px 0;background:var(--bg)}
.jump button{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--fg);font:600 13px/1 var(--font);cursor:pointer;transition:background .2s,border-color .2s,transform .15s}
.jump button:hover{border-color:var(--green);transform:translateY(-1px)}
form.flat{display:block;margin-top:8px;padding:0;border:0;background:transparent}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start}
.main{display:grid;gap:20px;min-width:0}
.block{display:grid;gap:16px;min-width:0;padding:22px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);scroll-margin-top:64px;animation:rise .45s cubic-bezier(.2,.8,.2,1) both}
.block>header{display:flex;gap:14px;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--line)}
.block>header h2{margin:0;font-size:22px}
.block>header p{margin:2px 0 0;font-size:14px}
.num{display:inline-flex;flex:none;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:var(--green);color:var(--on-green);font:700 17px/1 var(--font)}
.field{display:grid;gap:8px;min-width:0}
.lbl{font-weight:600}
input.locked{background:var(--card);color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.chip{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 16px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--fg);font:600 14px/1 var(--font);cursor:pointer;transition:background .2s,border-color .2s,transform .15s}
.chip:hover{border-color:var(--green);transform:translateY(-1px)}
.chip.on{border-color:var(--green);background:var(--green);color:var(--on-green)}
.chip-in{width:120px!important;min-height:38px!important;border-radius:999px!important}
.status-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.status-card{position:relative;display:grid;align-content:start;gap:4px;padding:14px;border:2px solid var(--line);border-radius:14px;background:var(--bg);cursor:pointer;transition:border-color .2s,transform .15s,box-shadow .2s}
.status-card:hover{transform:translateY(-2px);border-color:var(--green)}
.status-card.on{border-color:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 20%,transparent);background:color-mix(in srgb,var(--green) 6%,var(--bg))}
.status-card.maintenance.on{border-color:#d97706;box-shadow:0 0 0 3px color-mix(in srgb,#d97706 20%,transparent);background:color-mix(in srgb,#d97706 7%,var(--bg))}
.status-card.hidden.on{border-color:var(--muted);box-shadow:0 0 0 3px color-mix(in srgb,var(--muted) 20%,transparent)}
.status-card input{position:absolute;opacity:0;pointer-events:none}
.status-card:focus-within{outline:2px solid var(--neon);outline-offset:2px}
.ico{display:inline-block;flex:none;width:18px;height:18px;border-radius:50%;background:var(--green)}
.ico.wip{background:conic-gradient(var(--green) 0 50%,transparent 0);border:2px solid var(--green)}
.ico.maint{background:#d97706;border-radius:5px;transform:rotate(45deg) scale(.85)}
.ico.off{background:transparent;border:2px solid var(--muted)}
.switch-row{display:flex;gap:14px;align-items:flex-start;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg);cursor:pointer}
.switch-row input{flex:none;width:22px;height:22px;min-height:auto;margin-top:2px;accent-color:var(--green)}
.switch-row span{display:grid;gap:2px}
.count{text-align:right}
.stack-box{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:50px;padding:7px 10px;border:1px solid var(--line);border-radius:12px;background:var(--bg);transition:border-color .2s}
.stack-box:focus-within{border-color:var(--neon);outline:2px solid var(--neon);outline-offset:-1px}
.stack-box input{flex:1 1 140px;min-width:0;min-height:34px!important;padding:0 4px!important;border:0!important;outline:0!important;background:transparent!important}
.pill{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 6px 0 12px;border:1px solid var(--green);border-radius:999px;background:color-mix(in srgb,var(--green) 10%,transparent);font-size:14px;font-weight:600;animation:rise .25s ease both}
.pill button{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:50%;background:transparent;color:var(--fg);font:400 18px/1 var(--font);cursor:pointer;transition:background .15s}
.pill button:hover{background:var(--line)}
.adv{padding:10px 14px;border:1px dashed var(--line);border-radius:12px}
.adv summary{cursor:pointer;font-weight:600;color:var(--muted)}
.adv[open] summary{margin-bottom:12px}
.seg{display:inline-flex;justify-self:start;padding:4px;border:1px solid var(--line);border-radius:999px;background:var(--bg)}
.seg button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 20px;border:0;border-radius:999px;background:transparent;color:var(--fg);font:600 14px/1 var(--font);cursor:pointer;transition:background .2s,color .2s}
.seg button[aria-pressed='true']{background:var(--green);color:var(--on-green)}
.colors{display:flex;flex-wrap:wrap;gap:16px;align-items:end}
.colors input[type=color]{width:72px;padding:2px;cursor:pointer}
.angle{flex:1 1 220px}
.angle input[type=range]{width:100%;min-height:auto;padding:0;accent-color:var(--green)}
.img-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.banner-preview{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:6px;min-height:150px;padding:20px;border-radius:14px;color:#fff;overflow:hidden;transition:background .3s}
.banner-preview strong{font:600 clamp(24px,4vw,34px) var(--serif);overflow-wrap:anywhere}
.bp-tag{padding:2px 10px;border-radius:999px;background:rgba(255,255,255,.2);font-size:12px}
.sub{margin:6px 0 0;font-size:17px}
.sec{border:1px solid var(--line);border-radius:12px;background:var(--bg);transition:border-color .2s}
.sec[open]{border-color:var(--green)}
.sec summary{display:flex;gap:12px;align-items:center;min-height:50px;padding:0 14px;cursor:pointer;font-weight:600}
.sn{display:inline-flex;flex:none;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:var(--green);color:var(--on-green);font-size:14px}
.st{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sec-body{display:grid;gap:12px;padding:4px 14px 14px}
.add{justify-self:start}
.small{min-height:38px;padding:0 14px;font-size:14px}
.side{position:sticky;top:64px;min-width:0}
.side-box{display:grid;gap:14px;padding:18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.side-box h2{margin:0;font-size:18px}
.mini-banner{display:flex;align-items:flex-end;min-height:110px;padding:14px;border-radius:12px;color:#fff;font:600 22px var(--serif);overflow-wrap:anywhere;transition:background .3s}
.card-wrap{display:flex;justify-content:center;pointer-events:none}
.card-wrap :deep(.card){flex:1 1 auto;min-width:0;max-width:100%;min-height:0;transform:none!important;box-shadow:none!important}
.state{margin:0;display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4}
.state .ico{margin-top:1px;width:14px;height:14px}
.actionbar{position:sticky;bottom:0;z-index:30;display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:20px;padding:14px 18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);box-shadow:0 -10px 30px -18px rgba(0,0,0,.3)}
.actionbar .spacer{flex:1}
.actionbar .err{margin:0}
.dirty{display:inline-flex;gap:8px;align-items:center;color:#b45309;font-weight:600;font-size:14px}
.dot{width:9px;height:9px;border-radius:50%;background:#d97706;animation:blink 1.6s ease-in-out infinite}
@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes blink{50%{opacity:.35}}
@media (max-width:1000px){.layout{grid-template-columns:minmax(0,1fr)}.side{position:static;order:-1}}
@media (prefers-reduced-motion:reduce){.block,.pill,.dot{animation:none}.status-card,.chip,.jump button,.back{transition:none}}
</style>
