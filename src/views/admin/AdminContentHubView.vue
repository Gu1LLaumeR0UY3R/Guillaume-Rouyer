<script setup>
// Accueil du contenu : toutes les pages modifiables en cartes, rangées dans des dossiers (un niveau), avec recherche et filtres.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const PAGES = [
  { key: 'home', title: 'Accueil', desc: "Titre, présentation et bouton de la page d'accueil", to: '/admin/contenu/pages?onglet=home' },
  { key: 'about', title: 'À propos', desc: 'Paragraphes de présentation et infos rapides', to: '/admin/contenu/pages?onglet=about' },
  { key: 'skills', title: 'Compétences', desc: 'Groupes de compétences et niveaux', to: '/admin/contenu/pages?onglet=skills' },
  { key: 'timeline', title: 'Parcours', desc: 'Formations et expériences', to: '/admin/contenu/pages?onglet=timeline' },
  { key: 'contact', title: 'Contact', desc: 'Titre et texte de la section contact', to: '/admin/contenu/pages?onglet=contact' },
  { key: 'legal', title: 'Mentions légales', desc: 'Page des mentions légales', to: '/admin/contenu/pages?onglet=legal' },
  { key: 'privacy', title: 'Confidentialité', desc: 'Page de politique de confidentialité', to: '/admin/contenu/pages?onglet=privacy' },
  { key: 'goodnight', title: 'Étude de cas Goodnight', desc: 'Bandeau, aperçu, étapes, technique et images', to: '/admin/contenu/goodnight' },
  { key: 'spidernet', title: 'Tableau SpiderNet', desc: "Cartes et colonnes du tableau d'enquête", to: '/admin/contenu/spidernet' },
]

const folders = ref([]), assign = ref({}), items = ref({}), drafts = ref({})
const loading = ref(true), error = ref('')
const q = ref(''), filter = ref('all')
const overFolder = ref(null), dragKey = ref(null)

const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

async function load() {
  try {
    const [f, c] = await Promise.all([api('/api/admin/folders'), api('/api/admin/content')])
    folders.value = f.folders ?? []; assign.value = f.assign ?? {}
    items.value = c.items; drafts.value = c.drafts
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(load)

async function persist() {
  try {
    const r = await api('/api/admin/folders', { method: 'PUT', body: { folders: folders.value, assign: assign.value } })
    folders.value = r.folders; assign.value = r.assign
  } catch (e) { toast(e.message, 'danger'); await load() }
}

function newFolder() {
  const name = (prompt('Nom du nouveau dossier ?') ?? '').trim()
  if (!name) return
  const id = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('')
  folders.value = [...folders.value, { id, name: name.slice(0, 40) }]
  persist()
}
function rename(f) {
  const name = (prompt('Nouveau nom du dossier ?', f.name) ?? '').trim()
  if (!name || name === f.name) return
  f.name = name.slice(0, 40)
  persist()
}
function removeFolder(f) {
  const n = Object.values(assign.value).filter((v) => v === f.id).length
  if (!confirm(`Supprimer le dossier « ${f.name} » ? ${n ? `Ses ${n} page(s) retournent dans « Sans dossier ». ` : ''}Aucune page n'est supprimée.`)) return
  folders.value = folders.value.filter((x) => x.id !== f.id)
  for (const k of Object.keys(assign.value)) if (assign.value[k] === f.id) delete assign.value[k]
  persist()
}
function move(key, id) {
  if (id) assign.value = { ...assign.value, [key]: id }
  else { const { [key]: _, ...rest } = assign.value; assign.value = rest }
  persist()
}
function shift(i, d) {
  const j = i + d
  if (j < 0 || j >= folders.value.length) return
  const a = [...folders.value]; [a[i], a[j]] = [a[j], a[i]]
  folders.value = a
  persist()
}

function status(p) {
  const d = drafts.value[p.key]
  if (d) return { text: d.publishAt ? `Programmé le ${fmt(d.publishAt)}` : 'Brouillon en attente', cls: d.publishAt ? 'sched' : 'draft' }
  if (items.value[p.key]) return { text: `Modifié le ${fmt(items.value[p.key])}`, cls: 'mod' }
  return { text: "Texte d'origine", cls: '' }
}
const shown = computed(() => {
  const s = q.value.trim().toLowerCase()
  return PAGES.filter((p) => (!s || `${p.title} ${p.desc}`.toLowerCase().includes(s))
    && (filter.value === 'all' || (filter.value === 'mod' && items.value[p.key]) || (filter.value === 'draft' && drafts.value[p.key])))
})
const filtering = computed(() => !!q.value.trim() || filter.value !== 'all')
const sections = computed(() => {
  const out = folders.value.map((f, i) => ({ id: f.id, folder: f, i, pages: shown.value.filter((p) => assign.value[p.key] === f.id) }))
  const known = new Set(folders.value.map((f) => f.id))
  out.push({ id: '', folder: null, pages: shown.value.filter((p) => !known.has(assign.value[p.key])) })
  return out.filter((s) => s.folder ? (!filtering.value || s.pages.length) : s.pages.length || !folders.value.length)
})

const onDrop = (id) => { overFolder.value = null; if (dragKey.value) move(dragKey.value, id); dragKey.value = null }
</script>

<template>
  <div class="admin wide hub">
    <h1>Contenu du site</h1>
    <p>Toutes les pages dont tu peux modifier les textes. Range-les dans des dossiers : glisse une carte, ou utilise son menu « Dossier ».</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <div class="tools">
      <input v-model="q" type="search" placeholder="Rechercher une page…" aria-label="Rechercher une page">
      <div class="chips" role="group" aria-label="Filtrer">
        <button v-for="[v, l] in [['all', 'Toutes'], ['mod', 'Modifiées'], ['draft', 'Avec brouillon']]" :key="v" type="button" :class="{ on: filter === v }" :aria-pressed="filter === v" @click="filter = v">{{ l }}</button>
      </div>
      <button class="btn btn-ghost small" type="button" @click="newFolder">+ Nouveau dossier</button>
    </div>

    <p v-if="loading" role="status">Chargement…</p>
    <template v-else>
      <section v-for="s in sections" :key="s.id || 'none'" class="folder" :class="{ over: overFolder === s.id }"
        @dragover.prevent="overFolder = s.id" @dragleave="overFolder === s.id && (overFolder = null)" @drop.prevent="onDrop(s.id)">
        <header>
          <h2>
            <svg class="ico" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            {{ s.folder ? s.folder.name : 'Sans dossier' }} <small>({{ s.pages.length }})</small>
          </h2>
          <div v-if="s.folder" class="fa">
            <button class="btn btn-ghost small" type="button" :disabled="s.i === 0" :aria-label="`Monter le dossier ${s.folder.name}`" @click="shift(s.i, -1)">↑</button>
            <button class="btn btn-ghost small" type="button" :disabled="s.i === folders.length - 1" :aria-label="`Descendre le dossier ${s.folder.name}`" @click="shift(s.i, 1)">↓</button>
            <button class="btn btn-ghost small" type="button" @click="rename(s.folder)">Renommer</button>
            <button class="btn btn-ghost small btn-danger" type="button" @click="removeFolder(s.folder)">Supprimer</button>
          </div>
        </header>
        <ul v-if="s.pages.length" class="cards">
          <li v-for="p in s.pages" :key="p.key" class="pcard" draggable="true" @dragstart="dragKey = p.key" @dragend="dragKey = null; overFolder = null">
            <RouterLink :to="p.to" class="t">{{ p.title }}</RouterLink>
            <p class="d">{{ p.desc }}</p>
            <span class="st" :class="status(p).cls">{{ status(p).text }}</span>
            <div class="foot">
              <label>Dossier
                <select :value="assign[p.key] && folders.some((f) => f.id === assign[p.key]) ? assign[p.key] : ''" @change="move(p.key, $event.target.value)">
                  <option value="">Sans dossier</option>
                  <option v-for="f in folders" :key="f.id" :value="f.id">{{ f.name }}</option>
                </select>
              </label>
              <RouterLink :to="p.to" class="btn btn-primary small">Modifier</RouterLink>
            </div>
          </li>
        </ul>
        <p v-else class="empty">Dossier vide. Glisse une carte ici, ou choisis ce dossier dans le menu d'une carte.</p>
      </section>
      <p v-if="!shown.length" class="empty">Aucune page ne correspond.</p>
    </template>

    <p class="more">Les projets se gèrent dans <RouterLink to="/admin/projets">Projets</RouterLink>. Les brouillons, publications programmées et sauvegardes sont dans <RouterLink to="/admin/sauvegarde">Sauvegarde</RouterLink>.</p>
  </div>
</template>

<style scoped>
.tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:16px 0}
.tools input{flex:1 1 220px;max-width:340px;font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg)}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips button{font:inherit;font-weight:600;font-size:.88rem;padding:6px 12px;border:1px solid var(--line);border-radius:99px;background:var(--card);color:var(--fg);cursor:pointer}
.chips button.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.folder{margin:0 0 20px;padding:14px;border:1px dashed var(--line);border-radius:var(--radius);transition:background .15s,border-color .15s}
.folder.over{border-color:var(--green);background:color-mix(in srgb,var(--green) 8%,transparent)}
.folder header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.folder h2{margin:0;font-size:1.1rem;display:flex;align-items:center;gap:8px}
.folder h2 small{color:var(--muted);font-weight:400}
.fa{display:flex;gap:6px;flex-wrap:wrap}
.cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.pcard{display:grid;gap:6px;align-content:start;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--card);cursor:grab}
.pcard:active{cursor:grabbing}
.t{font-weight:700;font-size:1.02rem;color:var(--fg);text-decoration:none}
.t:hover{text-decoration:underline}
.d{margin:0;color:var(--muted);font-size:.88rem}
.st{justify-self:start;font-size:.75rem;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--line);color:var(--fg)}
.st.mod{background:color-mix(in srgb,var(--green) 18%,transparent)}
.st.draft{background:#fde68a;color:#78350f}
.st.sched{background:var(--green);color:var(--on-green)}
.foot{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-top:6px;flex-wrap:wrap}
.foot label{display:grid;gap:2px;font-size:.78rem;font-weight:600;color:var(--muted)}
.foot select{font:inherit;font-size:.88rem;padding:5px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);max-width:150px}
.empty{color:var(--muted);margin:4px 0}
.more{color:var(--muted);font-size:.9rem}
@media (prefers-reduced-motion:reduce){.folder{transition:none}}
</style>
