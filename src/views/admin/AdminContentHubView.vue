<script setup>
// Contenu du site, façon explorateur de fichiers : dossiers (un niveau) et pages.
// Clic = sélectionner (Ctrl/Maj pour plusieurs), double-clic = ouvrir, glisser des pages sur un dossier pour les ranger.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { PAGES } from '../../admin/pages.js'
import './adminForm.css'

const route = useRoute(), router = useRouter()
const folders = ref([]), assign = ref({}), items = ref({}), drafts = ref({})
const loading = ref(true), error = ref('')
const q = ref(''), filter = ref('all')
const sel = ref([]) // ids : « p:<clé> » pour une page, « f:<id> » pour un dossier
const anchor = ref(null)
const over = ref(null), dragging = ref(false), got = ref(null), flies = ref([])
const renaming = ref(null), renameText = ref('')

const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
const folderId = computed(() => (folders.value.some((f) => f.id === route.query.dossier) ? route.query.dossier : null))
const openFolder = computed(() => folders.value.find((f) => f.id === folderId.value) ?? null)
const known = computed(() => new Set(folders.value.map((f) => f.id)))
const where = (p) => (known.value.has(assign.value[p.key]) ? assign.value[p.key] : null)
const countIn = (id) => PAGES.filter((p) => where(p) === id).length

async function load() {
  try {
    const [f, c] = await Promise.all([api('/api/admin/folders'), api('/api/admin/content')])
    folders.value = f.folders ?? []; assign.value = f.assign ?? {}
    items.value = c.items; drafts.value = c.drafts
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(() => { load(); addEventListener('keydown', onKey) })
onBeforeUnmount(() => removeEventListener('keydown', onKey))
watch(folderId, () => { sel.value = []; anchor.value = null })

async function persist() {
  try {
    const r = await api('/api/admin/folders', { method: 'PUT', body: { folders: folders.value, assign: assign.value } })
    folders.value = r.folders; assign.value = r.assign
  } catch (e) { toast(e.message, 'danger'); await load() }
}

const filtering = computed(() => !!q.value.trim() || filter.value !== 'all')
const matches = (p) => {
  const s = q.value.trim().toLowerCase()
  return (!s || `${p.title} ${p.desc}`.toLowerCase().includes(s)) && (filter.value === 'all' || (filter.value === 'mod' && items.value[p.key]) || (filter.value === 'draft' && drafts.value[p.key]))
}
// Ce qu'on voit : en recherche ou filtre, toutes les pages concernées ; sinon le contenu du dossier ouvert (ou la racine).
const visiblePages = computed(() => PAGES.filter((p) => (filtering.value ? matches(p) : where(p) === folderId.value)))
const visibleFolders = computed(() => (filtering.value || folderId.value ? [] : folders.value))
const order = computed(() => [...visibleFolders.value.map((f) => `f:${f.id}`), ...visiblePages.value.map((p) => `p:${p.key}`)])

function status(p) {
  const d = drafts.value[p.key]
  if (d) return { text: d.publishAt ? `Programmé le ${fmt(d.publishAt)}` : 'Brouillon en attente', cls: d.publishAt ? 'sched' : 'draft' }
  if (items.value[p.key]) return { text: `Modifié le ${fmt(items.value[p.key])}`, cls: 'mod' }
  return { text: "Texte d'origine", cls: '' }
}

// --- Sélection ---
function pick(id, e) {
  if (e.shiftKey && anchor.value && order.value.includes(anchor.value)) {
    const a = order.value.indexOf(anchor.value), b = order.value.indexOf(id)
    sel.value = order.value.slice(Math.min(a, b), Math.max(a, b) + 1)
  } else if (e.ctrlKey || e.metaKey) {
    sel.value = sel.value.includes(id) ? sel.value.filter((x) => x !== id) : [...sel.value, id]
    anchor.value = id
  } else { sel.value = [id]; anchor.value = id }
}
const isSel = (id) => sel.value.includes(id)
const selPages = computed(() => sel.value.filter((s) => s.startsWith('p:')).map((s) => s.slice(2)))
const selFolders = computed(() => sel.value.filter((s) => s.startsWith('f:')).map((s) => s.slice(2)))
function clearSel(e) { if (!e.target.closest('.tile, .bar, button, a, input, select, label')) sel.value = [] }
function onKey(e) {
  if (renaming.value || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); sel.value = order.value.filter((x) => x.startsWith('p:')) }
  else if (e.key === 'Escape') sel.value = []
  else if (e.key === 'F2' && selFolders.value.length === 1 && sel.value.length === 1) startRename(selFolders.value[0])
}

// --- Ouvrir ---
const goFolder = (id) => router.replace({ query: id ? { dossier: id } : {} })
const openPage = (p) => router.push(p.to)

// --- Dossiers ---
async function newFolder() {
  const id = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('')
  folders.value = [...folders.value, { id, name: 'Nouveau dossier' }]
  await persist()
  sel.value = [`f:${id}`]
  startRename(id)
}
async function startRename(id) {
  renaming.value = id; renameText.value = folders.value.find((f) => f.id === id)?.name ?? ''
  await nextTick()
  const el = document.querySelector('.rename'); el?.focus(); el?.select()
}
function endRename(save) {
  const id = renaming.value
  if (!id) return
  renaming.value = null
  const f = folders.value.find((x) => x.id === id), name = renameText.value.trim().slice(0, 40)
  if (save && f && name && name !== f.name) { f.name = name; persist() }
}
function removeFolders() {
  const list = folders.value.filter((f) => selFolders.value.includes(f.id))
  if (!list.length) return
  const n = Object.values(assign.value).filter((v) => selFolders.value.includes(v)).length
  if (!confirm(`Supprimer ${list.length > 1 ? `${list.length} dossiers` : `le dossier « ${list[0].name} »`} ? ${n ? `Les ${n} page(s) qu'il contient retournent à la racine. ` : ''}Aucune page n'est supprimée.`)) return
  folders.value = folders.value.filter((f) => !selFolders.value.includes(f.id))
  for (const k of Object.keys(assign.value)) if (selFolders.value.includes(assign.value[k])) delete assign.value[k]
  sel.value = []
  persist()
}
function shift(d) {
  const id = selFolders.value[0], i = folders.value.findIndex((f) => f.id === id), j = i + d
  if (i < 0 || j < 0 || j >= folders.value.length) return
  const a = [...folders.value]; [a[i], a[j]] = [a[j], a[i]]
  folders.value = a
  persist()
}

// --- Déplacer des pages ---
function moveTo(keys, id) {
  if (!keys.length) return
  const next = { ...assign.value }
  for (const k of keys) { if (id) next[k] = id; else delete next[k] }
  assign.value = next
  sel.value = []
  persist()
  if (id) celebrate(id, keys.length)
}
// Petit retour visuel : le dossier rebondit et « +n » s'envole.
function celebrate(id, n) {
  got.value = id
  const t = Date.now()
  flies.value = [...flies.value, { id, n, t }]
  setTimeout(() => { if (got.value === id) got.value = null }, 650)
  setTimeout(() => { flies.value = flies.value.filter((f) => f.t !== t) }, 900)
}

// --- Glisser-déposer : le curseur porte une icône de fichier (ou plusieurs, avec le nombre) ---
function ghost(n, label) {
  const g = document.createElement('div')
  g.setAttribute('aria-hidden', 'true')
  g.style.cssText = 'position:fixed;top:-300px;left:-300px;width:84px;height:84px;pointer-events:none'
  const sheet = (x, y, o) => `<g transform="translate(${x} ${y})" opacity="${o}"><path d="M2 2h24l10 10v30a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#f4faf6" stroke="#14532d" stroke-width="2"/><path d="M26 2v10h10" fill="#bbf7d0" stroke="#14532d" stroke-width="2"/><path d="M7 22h22M7 28h22M7 34h14" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/></g>`
  const stack = n > 2 ? sheet(18, 12, 0.55) : ''
  const mid = n > 1 ? sheet(12, 6, 0.8) : ''
  const badge = n > 1 ? `<circle cx="62" cy="58" r="13" fill="#16a34a" stroke="#fff" stroke-width="2"/><text x="62" y="63" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#fff">${n}</text>` : ''
  g.innerHTML = `<svg width="84" height="84" viewBox="0 0 84 84">${stack}${mid}${sheet(4, 4, 1)}${badge}</svg>`
  document.body.append(g)
  setTimeout(() => g.remove(), 0)
  return g
}
function onDragStart(e, p) {
  const id = `p:${p.key}`
  if (!isSel(id)) { sel.value = [id]; anchor.value = id }
  const keys = selPages.value
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', keys.join(','))
  e.dataTransfer.setDragImage(ghost(keys.length, p.title), 30, 30)
  dragging.value = true
}
const onDragEnd = () => { dragging.value = false; over.value = null }
function onDrop(id) {
  over.value = null; dragging.value = false
  const keys = selPages.value.filter((k) => (where(PAGES.find((p) => p.key === k)) ?? null) !== (id ?? null))
  moveTo(keys, id)
}
const dropOk = (e) => { if (dragging.value) e.preventDefault() }
</script>

<template>
  <div class="admin wide hub" @click="clearSel">
    <h1>Contenu du site</h1>
    <p>Comme dans l'explorateur de fichiers : clique pour sélectionner (Ctrl ou Maj pour plusieurs), double-clique pour ouvrir, glisse des pages sur un dossier pour les ranger.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <div class="bar">
      <nav class="crumbs" aria-label="Emplacement">
        <button type="button" :class="{ drop: openFolder && over === 'root' }" @click="goFolder(null)" @dragover="dropOk($event); over = 'root'" @dragleave="over === 'root' && (over = null)" @drop.prevent="onDrop(null)">Contenu</button>
        <template v-if="openFolder"><span aria-hidden="true">›</span><strong>{{ openFolder.name }}</strong></template>
        <template v-else-if="filtering"><span aria-hidden="true">›</span><strong>Résultats</strong></template>
      </nav>
      <input v-model="q" type="search" placeholder="Rechercher une page…" aria-label="Rechercher une page">
      <div class="chips" role="group" aria-label="Filtrer">
        <button v-for="[v, l] in [['all', 'Toutes'], ['mod', 'Modifiées'], ['draft', 'Avec brouillon']]" :key="v" type="button" :class="{ on: filter === v }" :aria-pressed="filter === v" @click="filter = v">{{ l }}</button>
      </div>
      <button v-if="!openFolder && !filtering" class="btn btn-ghost small" type="button" @click="newFolder">+ Nouveau dossier</button>
    </div>

    <div class="selbar" :class="{ on: sel.length }" role="toolbar" aria-label="Actions sur la sélection">
      <template v-if="sel.length">
        <strong>{{ sel.length }} sélectionné{{ sel.length > 1 ? 's' : '' }}</strong>
        <template v-if="selPages.length">
          <label>Déplacer vers
            <select aria-label="Déplacer la sélection vers" @change="moveTo(selPages, $event.target.value === '__root' ? null : $event.target.value); $event.target.value = ''">
              <option value="">Choisir…</option>
              <option v-if="folderId" value="__root">Racine (hors dossier)</option>
              <option v-for="f in folders.filter((x) => x.id !== folderId)" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </label>
          <button v-if="folderId || filtering" class="btn btn-ghost small" type="button" @click="moveTo(selPages, null)">Sortir du dossier</button>
        </template>
        <template v-if="selFolders.length && !selPages.length">
          <button v-if="selFolders.length === 1" class="btn btn-ghost small" type="button" @click="goFolder(selFolders[0])">Ouvrir</button>
          <button v-if="selFolders.length === 1" class="btn btn-ghost small" type="button" @click="startRename(selFolders[0])">Renommer (F2)</button>
          <button v-if="selFolders.length === 1" class="btn btn-ghost small" type="button" aria-label="Monter le dossier" @click="shift(-1)">↑</button>
          <button v-if="selFolders.length === 1" class="btn btn-ghost small" type="button" aria-label="Descendre le dossier" @click="shift(1)">↓</button>
          <button class="btn btn-ghost small btn-danger" type="button" @click="removeFolders">Supprimer</button>
        </template>
        <button class="btn btn-ghost small" type="button" @click="sel = []">Désélectionner</button>
      </template>
      <span v-else class="hint">{{ openFolder ? 'Glisse une page sur « Contenu » en haut pour la sortir du dossier.' : 'Astuce : Ctrl + A sélectionne toutes les pages.' }}</span>
    </div>

    <p v-if="loading" role="status">Chargement…</p>
    <template v-else>
      <TransitionGroup tag="ul" name="tile" class="grid" aria-label="Contenu">
        <li v-for="f in visibleFolders" :key="`f:${f.id}`" class="tile folder" :class="{ on: isSel(`f:${f.id}`), over: over === f.id, got: got === f.id }"
          tabindex="0" role="button" :aria-pressed="isSel(`f:${f.id}`)" :aria-label="`Dossier ${f.name}, ${countIn(f.id)} page(s)`"
          @click.stop="pick(`f:${f.id}`, $event)" @dblclick="goFolder(f.id)" @keydown.enter.self="goFolder(f.id)" @keydown.space.self.prevent="pick(`f:${f.id}`, $event)"
          @dragover="dropOk($event); over = f.id" @dragleave="over === f.id && (over = null)" @drop.prevent="onDrop(f.id)">
          <svg class="fi" viewBox="0 0 120 96" aria-hidden="true">
            <path class="back" d="M6 18a8 8 0 018-8h26l10 12h56a8 8 0 018 8v50a8 8 0 01-8 8H14a8 8 0 01-8-8z" />
            <g v-if="countIn(f.id)" class="papers"><rect x="20" y="22" width="76" height="46" rx="4" class="p1" /><rect x="26" y="28" width="76" height="46" rx="4" class="p2" /></g>
            <path class="front" d="M6 34a8 8 0 018-8h92a8 8 0 018 8v44a8 8 0 01-8 8H14a8 8 0 01-8-8z" />
          </svg>
          <input v-if="renaming === f.id" v-model="renameText" class="rename" maxlength="40" aria-label="Nom du dossier" @click.stop @dblclick.stop @keydown.enter.prevent="endRename(true)" @keydown.esc.stop="endRename(false)" @blur="endRename(true)">
          <span v-else class="nm">{{ f.name }}</span>
          <small>{{ countIn(f.id) }} page{{ countIn(f.id) > 1 ? 's' : '' }}</small>
          <span v-for="fl in flies.filter((x) => x.id === f.id)" :key="fl.t" class="fly" aria-hidden="true">+{{ fl.n }}</span>
        </li>

        <li v-for="p in visiblePages" :key="`p:${p.key}`" class="tile page" :class="{ on: isSel(`p:${p.key}`) }" draggable="true"
          tabindex="0" role="button" :aria-pressed="isSel(`p:${p.key}`)" :aria-label="`Page ${p.title}`"
          @click.stop="pick(`p:${p.key}`, $event)" @dblclick="openPage(p)" @keydown.enter.self="openPage(p)" @keydown.space.self.prevent="pick(`p:${p.key}`, $event)"
          @dragstart="onDragStart($event, p)" @dragend="onDragEnd">
          <svg class="pi" viewBox="0 0 40 46" aria-hidden="true"><path d="M2 2h24l10 10v30a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2z" class="sheet" /><path d="M26 2v10h10" class="fold" /><path d="M7 22h22M7 28h22M7 34h14" class="lines" /></svg>
          <span class="nm">{{ p.title }}</span>
          <span class="d">{{ p.desc }}</span>
          <span class="st" :class="status(p).cls">{{ status(p).text }}</span>
          <RouterLink :to="p.to" class="edit" @click.stop>Modifier</RouterLink>
        </li>
      </TransitionGroup>

      <p v-if="!visibleFolders.length && !visiblePages.length" class="empty">
        {{ filtering ? 'Aucune page ne correspond.' : openFolder ? 'Dossier vide. Glisse des pages ici depuis « Contenu », ou utilise « Déplacer vers » après les avoir sélectionnées.' : 'Rien ici.' }}
      </p>
      <p v-else-if="folderId && !visiblePages.length" class="empty">Dossier vide.</p>
    </template>

    <p class="more">Les projets se gèrent dans <RouterLink to="/admin/projets">Projets</RouterLink>. Brouillons, historique et publications programmées : onglet <RouterLink to="/admin/versions">Versions</RouterLink>.</p>
  </div>
</template>

<style scoped>
.hub{min-height:60vh}
.bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:16px 0 8px}
.bar input{flex:1 1 200px;max-width:320px;font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg)}
.crumbs{display:flex;align-items:center;gap:8px;font-size:1.05rem}
.crumbs button{font:inherit;font-weight:700;padding:4px 10px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--fg);cursor:pointer}
.crumbs button:hover,.crumbs button.drop{background:color-mix(in srgb,var(--green) 14%,transparent);border-color:var(--green)}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips button{font:inherit;font-weight:600;font-size:.88rem;padding:6px 12px;border:1px solid var(--line);border-radius:99px;background:var(--card);color:var(--fg);cursor:pointer}
.chips button.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.selbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;min-height:44px;padding:6px 12px;margin-bottom:12px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.selbar.on{border-color:var(--green)}
.selbar label{display:flex;align-items:center;gap:6px;font-size:.88rem;font-weight:600}
.selbar select{font:inherit;padding:5px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg)}
.grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:14px}
.tile{position:relative;display:grid;justify-items:center;align-content:start;gap:4px;padding:14px 10px 12px;border:2px solid transparent;border-radius:14px;text-align:center;cursor:pointer;user-select:none;outline:none;transition:background .15s,border-color .15s,transform .15s}
.tile:hover{background:color-mix(in srgb,var(--green) 7%,transparent)}
.tile:focus-visible{border-color:var(--fg)}
.tile.on{background:color-mix(in srgb,var(--green) 16%,transparent);border-color:var(--green)}
.nm{font-weight:700;font-size:.95rem;word-break:break-word}
.tile small,.d{color:var(--muted);font-size:.8rem}
.rename{width:100%;box-sizing:border-box;font:inherit;font-weight:700;text-align:center;padding:2px 6px;border:2px solid var(--green);border-radius:6px;background:var(--bg);color:var(--fg)}
/* Dossier */
.fi{width:112px;height:90px;overflow:visible}
.fi .back{fill:color-mix(in srgb,var(--green) 70%,#000)}
.fi .front{fill:var(--green);transform-origin:12% 100%;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.fi .p1,.fi .p2{fill:#f4faf6;stroke:color-mix(in srgb,var(--green) 40%,#000);stroke-width:1.5;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.fi .p2{fill:#e6f4ea}
.folder.over .front,.folder:hover .front{transform:skewX(-7deg) scaleY(.94)}
.folder.over .p1,.folder:hover .p1{transform:translateY(-9px)}
.folder.over .p2,.folder:hover .p2{transform:translateY(-5px)}
.folder.over{background:color-mix(in srgb,var(--green) 18%,transparent);border-color:var(--green);transform:scale(1.04)}
.folder.got{animation:got .6s cubic-bezier(.3,1.6,.5,1)}
.fly{position:absolute;top:18px;left:50%;font-weight:800;color:var(--on-green);background:var(--green);padding:2px 10px;border-radius:99px;pointer-events:none;animation:fly .9s ease-out forwards}
@keyframes got{0%{transform:scale(1)}35%{transform:scale(1.14) rotate(-3deg)}70%{transform:scale(.97)}100%{transform:scale(1)}}
@keyframes fly{from{opacity:1;transform:translate(-50%,10px)}to{opacity:0;transform:translate(-50%,-46px)}}
/* Page */
.pi{width:46px;height:54px}
.pi .sheet{fill:var(--card);stroke:var(--green);stroke-width:2}
.pi .fold{fill:color-mix(in srgb,var(--green) 25%,transparent);stroke:var(--green);stroke-width:2}
.pi .lines{stroke:var(--green);stroke-width:2;stroke-linecap:round;fill:none}
.page{cursor:grab}
.page:active{cursor:grabbing}
.st{font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--line);color:var(--fg)}
.st.mod{background:color-mix(in srgb,var(--green) 18%,transparent)}
.st.draft{background:#fde68a;color:#78350f}
.st.sched{background:var(--green);color:var(--on-green)}
.edit{font-size:.82rem;font-weight:600;margin-top:2px}
.empty{color:var(--muted);margin:16px 4px}
.more{color:var(--muted);font-size:.9rem;margin-top:24px}
.tile-enter-active,.tile-leave-active{transition:opacity .25s,transform .25s}
.tile-enter-from,.tile-leave-to{opacity:0;transform:scale(.85)}
.tile-leave-active{position:absolute}
@media (prefers-reduced-motion:reduce){.tile,.fi .front,.fi .p1,.fi .p2,.tile-enter-active,.tile-leave-active{transition:none}.folder.got,.fly{animation:none}}
</style>
