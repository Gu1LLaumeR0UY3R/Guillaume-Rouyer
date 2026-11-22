<script setup>
// Édition du tableau SpiderNet : cartes classées par catégorie, formulaire par carte, mini-plan où l'on déplace les cartes à la souris.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { takeDraft } from '../../admin/draftResume.js'
import { DEFAULT_ITEMS } from '../../content/spidernetDefault.js'
import DraftBar from './DraftBar.vue'
import './adminForm.css'

const GROUPS = { concept: 'Concept', socle: 'Socle', valo: 'Valorisation', tech: 'Technique et sécurité' }
const COLORS = { concept: '#d9d2bd', socle: '#9db9e8', valo: '#f0b89c', tech: '#b7a9ec', none: '#ffd0d0' }
const TAGS = ['CONCEPT', 'FAIT', 'EN COURS', 'À FAIRE', 'FAIT EN BASE', 'À DÉCOUVRIR', 'STACK', 'SÉCURITÉ', 'QUALITÉ ET RGPD', 'NOTE']

const items = ref([]), saved = ref(''), custom = ref(false), loading = ref(true), busy = ref(false), error = ref('')
const open = ref(-1)
let uid = 0
const wrap = (list) => list.map((o) => ({ ...o, _id: ++uid, key: !!o.key, web: !!o.web }))
const clean = () => items.value.map(({ _id, ...o }) => ({ ...o, key: o.key ? 1 : undefined, web: o.web ? 1 : undefined, tag: o.tag || undefined, bg: o.bg || undefined, w: o.w || undefined, g: o.g || undefined }))
const snapshot = () => JSON.stringify(clean())
const dirty = computed(() => !loading.value && snapshot() !== saved.value)

async function load() {
  try {
    const d = await api('/api/admin/content/spidernet')
    custom.value = !!d.items
    items.value = wrap(d.items ?? DEFAULT_ITEMS)
    saved.value = snapshot()
  } catch (e) { error.value = e.message } finally { loading.value = false }
  const dr = await takeDraft('content', 'spidernet')
  if (dr?.items) items.value = wrap(dr.items)
}
const warn = (e) => { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => { load(); window.addEventListener('beforeunload', warn) })
onBeforeUnmount(() => window.removeEventListener('beforeunload', warn))

async function save() {
  busy.value = true
  try {
    await api('/api/admin/content/spidernet', { method: 'PUT', body: { items: clean() } })
    saved.value = snapshot(); custom.value = true
    toast("Tableau enregistré : visible sur le site d'ici quelques secondes", 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
async function reset() {
  if (!confirm('Revenir au contenu d\'origine ? Tes modifications enregistrées seront effacées.')) return
  busy.value = true
  try {
    await api('/api/admin/content/spidernet', { method: 'DELETE' })
    items.value = wrap(DEFAULT_ITEMS); saved.value = snapshot(); custom.value = false; open.value = -1
    toast('Contenu d\'origine rétabli', 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}

// Regroupement pour l'affichage ; l'ordre dans une catégorie est l'ordre de la visite guidée
const groups = computed(() => {
  const out = Object.keys(GROUPS).map((g) => ({ g, name: GROUPS[g], list: [] }))
  const other = { g: '', name: 'Sans catégorie (notes)', list: [] }
  items.value.forEach((o, i) => (out.find((x) => x.g === o.g) ?? other).list.push({ o, i }))
  return other.list.length ? [...out, other] : out
})
const label = (o) => (o.k === 'head' ? `Titre : ${o.t}` : o.t)

function add(head = false) {
  const g = open.value >= 0 ? items.value[open.value].g : 'concept'
  items.value.push(wrap([head ? { k: 'head', g, t: 'Nouvelle colonne', x: 1500, y: 1000, w: 300, r: 0 } : { g, tag: 'À FAIRE', t: 'Nouvelle carte', txt: '', x: 1500, y: 1000, r: 0 }])[0])
  open.value = items.value.length - 1
}
function duplicate(i) {
  const c = wrap([items.value[i]])[0]; c.t += ' (copie)'; c.x = Math.min(3600, c.x + 60); c.y = Math.min(2250, c.y + 60)
  items.value.splice(i + 1, 0, c); open.value = i + 1
}
function remove(i) {
  if (!confirm(`Supprimer « ${items.value[i].t} » ?`)) return
  items.value.splice(i, 1); open.value = -1
}
function move(i, d) {
  const g = items.value[i].g
  let j = i + d
  while (items.value[j] && items.value[j].g !== g) j += d
  if (!items.value[j]) return
  ;[items.value[i], items.value[j]] = [items.value[j], items.value[i]]
  open.value = j
}
const toggle = (i) => { open.value = open.value === i ? -1 : i }

// Mini-plan : déplacement à la souris ou au doigt
const stage = ref(null)
let drag = null
function down(e, i) {
  open.value = i
  const o = items.value[i]
  drag = { i, px: e.clientX, py: e.clientY, x: o.x, y: o.y }
  e.currentTarget.setPointerCapture(e.pointerId)
}
function moveDrag(e) {
  if (!drag) return
  const k = 3600 / stage.value.getBoundingClientRect().width
  const o = items.value[drag.i]
  o.x = Math.round(Math.max(0, Math.min(3600 - 100, drag.x + (e.clientX - drag.px) * k)))
  o.y = Math.round(Math.max(0, Math.min(2250 - 100, drag.y + (e.clientY - drag.py) * k)))
}
const up = () => { drag = null }
const boxStyle = (o, i) => ({
  left: (o.x / 36) + '%', top: (o.y / 22.5) + '%', width: ((o.w || 290) / 36) + '%',
  background: o.bg || COLORS[o.g ?? 'none'], transform: `rotate(${o.r || 0}deg)`, zIndex: open.value === i ? 5 : 1,
})
const edited = (o, f, v) => { o[f] = v }
const num = (o, f, e, min, max) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) o[f] = Math.max(min, Math.min(max, v)) }
</script>

<template>
  <main class="admin wide">
    <RouterLink to="/admin/contenu" class="hint">← Tous les contenus</RouterLink>
    <h1>Tableau SpiderNet</h1>
    <p class="hint">Les cartes du tableau d'enquête du projet SpiderNet. Chaque changement est visible sur le site quelques secondes après l'enregistrement.
      <strong>{{ custom ? 'Contenu modifié.' : 'Contenu d\'origine (jamais modifié).' }}</strong></p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <template v-if="!loading && !error">
      <div class="bar sticky">
        <button class="btn btn-primary" type="button" :disabled="busy || !dirty" @click="save">{{ busy ? 'Enregistrement…' : 'Enregistrer' }}</button>
        <span v-if="dirty" class="dirty">Modifications non enregistrées</span>
        <span class="spacer" />
        <button class="btn btn-ghost small" type="button" @click="add(false)">+ Carte</button>
        <button class="btn btn-ghost small" type="button" @click="add(true)">+ Titre de colonne</button>
        <button v-if="custom" class="btn btn-ghost small btn-danger" type="button" :disabled="busy" @click="reset">Revenir à l'origine</button>
      </div>
      <DraftBar kind="content" ref-key="spidernet" :get-data="() => ({ items: clean() })" />

      <section class="card">
        <h2>Plan du tableau</h2>
        <p class="hint">Glisse une carte pour la déplacer. Clique-la pour la modifier plus bas.</p>
        <div ref="stage" class="stage" @pointermove="moveDrag" @pointerup="up" @pointercancel="up">
          <div v-for="(o, i) in items" :key="o._id" class="mini" :class="{ head: o.k === 'head', sel: open === i }" :style="boxStyle(o, i)" tabindex="0"
               role="button" :aria-label="`Déplacer ${o.t}`" @pointerdown.prevent="down($event, i)" @keydown.enter="open = i">
            <span>{{ o.t }}</span>
          </div>
        </div>
        <p class="legend"><span v-for="(n, g) in GROUPS" :key="g"><i :style="{ background: COLORS[g] }" />{{ n }}</span></p>
      </section>

      <section v-for="grp in groups" :key="grp.g" class="card">
        <h2>{{ grp.name }} <small>({{ grp.list.length }})</small></h2>
        <div v-for="{ o, i } in grp.list" :key="o._id" class="entry" :class="{ open: open === i }">
          <div class="row">
            <button class="title" type="button" :aria-expanded="open === i" @click="toggle(i)">
              <i :style="{ background: o.bg || COLORS[o.g ?? 'none'] }" /><span>{{ label(o) }}</span><em v-if="o.tag">{{ o.tag }}</em>
            </button>
            <div class="actions">
              <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(i, -1)">↑</button>
              <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(i, 1)">↓</button>
              <button class="btn btn-ghost small" type="button" @click="duplicate(i)">Dupliquer</button>
              <button class="btn btn-ghost small btn-danger" type="button" @click="remove(i)">Supprimer</button>
            </div>
          </div>
          <div v-if="open === i" class="form">
            <div class="grid2">
              <label>Titre<input v-model="o.t" maxlength="80"></label>
              <label v-if="o.k !== 'head'">Étiquette
                <input v-model="o.tag" list="tags" maxlength="30"><datalist id="tags"><option v-for="t in TAGS" :key="t" :value="t" /></datalist>
              </label>
              <label>Catégorie
                <select v-model="o.g"><option v-for="(n, g) in GROUPS" :key="g" :value="g">{{ n }}</option><option v-if="o.k !== 'head'" value="">Aucune (note)</option></select>
              </label>
            </div>
            <label v-if="o.k !== 'head'">Texte<textarea v-model="o.txt" maxlength="600" rows="4" /><span class="hint">{{ (o.txt || '').length }} / 600</span></label>
            <fieldset>
              <legend>Position et aspect</legend>
              <div class="grid2">
                <label>Position horizontale (0 à 3600)<input type="number" min="0" max="3600" :value="o.x" @input="num(o, 'x', $event, 0, 3600)"></label>
                <label>Position verticale (0 à 2250)<input type="number" min="0" max="2250" :value="o.y" @input="num(o, 'y', $event, 0, 2250)"></label>
                <label>Inclinaison (−8° à 8°)<input type="number" step="0.5" min="-8" max="8" :value="o.r" @input="num(o, 'r', $event, -8, 8)"></label>
                <label>Largeur (vide = standard)<input type="number" min="150" max="600" :value="o.w" @input="edited(o, 'w', $event.target.value ? Math.max(150, Math.min(600, +$event.target.value)) : undefined)"></label>
              </div>
              <div v-if="o.k !== 'head'" class="colors">
                <label>Couleur de fond (vide = celle de la catégorie)<input type="color" :value="o.bg || '#ffffff'" @input="o.bg = $event.target.value"></label>
                <button v-if="o.bg" class="btn btn-ghost small" type="button" @click="o.bg = undefined">Couleur par défaut</button>
              </div>
            </fieldset>
            <div v-if="o.k !== 'head'" class="checks">
              <label class="check"><input v-model="o.key" type="checkbox"> Carte clé : s'affiche d'elle-même quand on arrive sur sa catégorie dans la visite guidée</label>
              <label class="check"><input v-model="o.web" type="checkbox"> Animation « toile » : la carte est collée avec une toile quand elle entre à l'écran</label>
            </div>
          </div>
        </div>
        <p v-if="!grp.list.length" class="hint">Aucune carte.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.card{display:grid;gap:12px;align-content:start;margin-top:20px;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.card h2{margin:0;font-size:22px}.card h2 small{color:var(--muted);font:400 15px var(--font)}
.sticky{position:sticky;top:0;z-index:20;padding:10px 0;background:var(--bg)}
.dirty{color:#b45309;font-weight:700}
[data-theme=dark] .dirty{color:#fbbf24}
.stage{position:relative;width:100%;aspect-ratio:3600/2250;border:1px solid var(--line);border-radius:12px;background:var(--bg);overflow:hidden;touch-action:none;user-select:none}
.mini{position:absolute;display:flex;align-items:center;justify-content:center;aspect-ratio:290/150;min-height:0;padding:2px 4px;border:1px solid rgba(0,0,0,.35);border-radius:4px;color:#1a1a1a;font:600 clamp(7px,1.1vw,12px)/1.15 var(--font);text-align:center;cursor:grab;overflow:hidden;box-shadow:0 2px 6px -2px rgba(0,0,0,.4);transition:box-shadow .15s}
.mini.head{aspect-ratio:300/90;font-weight:800;border-width:2px}
.mini:active{cursor:grabbing}
.mini.sel{outline:3px solid var(--neon);outline-offset:1px;box-shadow:0 6px 16px -4px rgba(0,0,0,.5)}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0;font-size:14px}
.legend span{display:inline-flex;align-items:center;gap:6px}
.legend i,.title i{display:inline-block;width:14px;height:14px;border-radius:4px;border:1px solid rgba(0,0,0,.3);flex:none}
.entry{border:1px solid var(--line);border-radius:12px;background:var(--bg);transition:border-color .2s,box-shadow .2s}
.entry.open{border-color:var(--green);box-shadow:0 8px 20px -14px var(--glow)}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px}
.title{display:flex;align-items:center;gap:10px;flex:1 1 220px;min-width:0;min-height:40px;padding:0 6px;border:0;background:transparent;color:var(--fg);font:600 15px var(--font);text-align:left;cursor:pointer}
.title span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.title em{flex:none;padding:2px 8px;border-radius:99px;background:var(--card);border:1px solid var(--line);color:var(--muted);font:600 11px var(--font);font-style:normal}
.form{display:grid;gap:14px;padding:4px 14px 16px}
.checks{display:grid;gap:8px}
.check{align-items:flex-start}
@media (prefers-reduced-motion:reduce){.entry,.mini{transition:none}}
</style>
