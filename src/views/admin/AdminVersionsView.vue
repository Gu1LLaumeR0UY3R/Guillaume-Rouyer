<script setup>
// Onglet Versions : pour chaque page ou projet, brouillon en attente, publication programmée, historique et restauration.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { PAGES } from '../../admin/pages.js'
import { compact, diffLines, flatten } from '../../lib/diff.js'
import './adminForm.css'

const route = useRoute(), router = useRouter()
const projects = ref([]), summary = ref({}), drafts = ref({}), loading = ref(true), error = ref('')
const q = ref(''), only = ref('all')
const detail = ref({ draft: null, versions: null }), when = ref(''), busy = ref(false)

const kind = computed(() => route.query.kind === 'project' ? 'project' : route.query.kind === 'content' ? 'content' : '')
const ref_ = computed(() => (kind.value ? String(route.query.ref ?? '') : ''))
const idOf = (k, r) => `${k}:${r}`
const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

const entries = computed(() => [
  ...PAGES.map((p) => ({ kind: 'content', ref: p.key, title: p.title, group: 'Pages', to: p.to })),
  ...projects.value.map((p) => ({ kind: 'project', ref: p.slug, title: p.name, group: 'Projets', to: `/admin/projets/${p.slug}` })),
].map((e) => ({ ...e, id: idOf(e.kind, e.ref), n: summary.value[idOf(e.kind, e.ref)]?.count ?? 0, draft: drafts.value[idOf(e.kind, e.ref)] ?? null })))
const shown = computed(() => {
  const s = q.value.trim().toLowerCase()
  return entries.value.filter((e) => (!s || e.title.toLowerCase().includes(s)) && (only.value === 'all' || (only.value === 'draft' && e.draft) || (only.value === 'hist' && e.n)))
})
const groups = computed(() => ['Pages', 'Projets'].map((g) => ({ g, list: shown.value.filter((e) => e.group === g) })).filter((x) => x.list.length))
const current = computed(() => entries.value.find((e) => e.id === idOf(kind.value, ref_.value)) ?? null)

async function loadLists() {
  try {
    const [p, v, d] = await Promise.all([api('/api/admin/projects'), api('/api/admin/versions'), api('/api/admin/drafts')])
    projects.value = p.projects
    summary.value = Object.fromEntries(v.items.map((i) => [idOf(i.kind, i.ref), i]))
    drafts.value = Object.fromEntries(d.drafts.map((i) => [idOf(i.kind, i.ref), i]))
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
async function loadDetail() {
  detail.value = { draft: null, versions: null }; when.value = ''
  if (!current.value) return
  const qs = `kind=${kind.value}&ref=${encodeURIComponent(ref_.value)}`
  try {
    const [d, v] = await Promise.all([api(`/api/admin/drafts?${qs}`), api(`/api/admin/versions?${qs}`)])
    detail.value = { draft: d.draft, versions: v.versions }
  } catch (e) { toast(e.message, 'danger'); detail.value = { draft: null, versions: [] } }
}
onMounted(async () => { await loadLists(); await loadDetail() })
watch(() => [kind.value, ref_.value], loadDetail)

const select = (e) => router.replace({ query: { kind: e.kind, ref: e.ref } })
const minDate = () => { const d = new Date(Date.now() + 120_000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
const body = (extra = {}) => ({ kind: kind.value, ref: ref_.value, ...extra })
async function run(fn) { busy.value = true; try { await fn(); await loadLists(); await loadDetail() } catch (e) { toast(e.message, 'danger') } finally { busy.value = false } }

const schedule = () => run(async () => {
  const at = new Date(when.value).getTime()
  if (!when.value || !Number.isFinite(at)) throw new Error('Choisis une date et une heure')
  await api('/api/admin/drafts', { method: 'PATCH', body: body({ publishAt: at }) })
  toast(`Publication programmée le ${fmt(at)}`, 'ok')
})
const unschedule = () => run(async () => { await api('/api/admin/drafts', { method: 'PATCH', body: body({ publishAt: null }) }); toast('Programmation retirée : le brouillon reste en attente', 'info') })
const publishNow = () => run(async () => {
  if (!confirm("Publier ce brouillon maintenant ? Il remplace la version en ligne (elle reste dans l'historique).")) return
  await api('/api/admin/drafts/publish', { method: 'POST', body: body() }); toast('Brouillon publié', 'ok')
})
const dropDraft = () => run(async () => {
  if (!confirm('Supprimer ce brouillon ?')) return
  await api(`/api/admin/drafts?kind=${kind.value}&ref=${encodeURIComponent(ref_.value)}`, { method: 'DELETE' })
})
// Comparaison d'une ancienne version avec l'état actuel
const cmp = ref(null), cmpDlg = ref(null)
const cmpStats = computed(() => (cmp.value ? { add: cmp.value.lines.filter((l) => l.t === 'add').length, del: cmp.value.lines.filter((l) => l.t === 'del').length } : null))
async function compare(v) {
  try {
    const d = await api(`/api/admin/versions/${v.id}`)
    const all = diffLines(flatten(d.data), flatten(d.current ?? {}))
    cmp.value = { at: v.at, lines: compact(all), identical: all.every((l) => l.t === 'same') }
    cmpDlg.value?.showModal()
  } catch (e) { toast(e.message, 'danger') }
}
const restore = (v) => run(async () => {
  if (!confirm(`Restaurer la version du ${fmt(v.at)} ? La version actuelle est gardée dans l'historique.`)) return
  await api(`/api/admin/versions/${v.id}`, { method: 'POST' }); toast('Version restaurée', 'ok')
})
</script>

<template>
  <div class="admin wide vers">
    <h1>Versions et publication</h1>
    <p>Historique de chaque page et projet, brouillons en attente et publications programmées. Pour créer un brouillon : ouvre l'éditeur et clique sur « Enregistrer en brouillon ».</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="loading" role="status">Chargement…</p>

    <div v-else class="cols">
      <aside>
        <input v-model="q" type="search" placeholder="Rechercher…" aria-label="Rechercher une page ou un projet">
        <div class="chips" role="group" aria-label="Filtrer">
          <button v-for="[v, l] in [['all', 'Tout'], ['draft', 'Brouillons'], ['hist', 'Avec historique']]" :key="v" type="button" :class="{ on: only === v }" :aria-pressed="only === v" @click="only = v">{{ l }}</button>
        </div>
        <template v-for="x in groups" :key="x.g">
          <h2>{{ x.g }}</h2>
          <ul>
            <li v-for="e in x.list" :key="e.id">
              <button type="button" :class="{ on: current?.id === e.id }" :aria-current="current?.id === e.id ? 'true' : undefined" @click="select(e)">
                <span class="nm">{{ e.title }}</span>
                <span class="meta">
                  <i v-if="e.draft" class="pill" :class="{ sched: e.draft.publishAt }">{{ e.draft.publishAt ? 'Programmé' : 'Brouillon' }}</i>
                  <small v-if="e.n">{{ e.n }} version{{ e.n > 1 ? 's' : '' }}</small>
                </span>
              </button>
            </li>
          </ul>
        </template>
        <p v-if="!groups.length" class="hint">Rien ne correspond.</p>
      </aside>

      <main>
        <p v-if="!current" class="hint">Choisis une page ou un projet dans la liste.</p>
        <template v-else>
          <header>
            <h2>{{ current.title }}</h2>
            <RouterLink class="btn btn-ghost small" :to="current.to">Ouvrir l'éditeur</RouterLink>
          </header>

          <section class="card">
            <h3>Brouillon et publication</h3>
            <template v-if="detail.draft">
              <p><strong v-if="detail.draft.publishAt">Publication programmée le {{ fmt(detail.draft.publishAt) }}.</strong><strong v-else>Brouillon du {{ fmt(detail.draft.updatedAt) }}, pas encore programmé.</strong>
                <span v-if="detail.draft.error" class="err"> Échec de la dernière publication : {{ detail.draft.error }}</span></p>
              <div class="row">
                <label>{{ detail.draft.publishAt ? 'Changer la date' : 'Publier le' }}<input v-model="when" type="datetime-local" :min="minDate()"></label>
                <button class="btn btn-primary small" type="button" :disabled="busy || !when" @click="schedule">Programmer</button>
                <button v-if="detail.draft.publishAt" class="btn btn-ghost small" type="button" :disabled="busy" @click="unschedule">Retirer la programmation</button>
              </div>
              <div class="row">
                <RouterLink class="btn btn-ghost small" :to="`${current.to}${current.to.includes('?') ? '&' : '?'}brouillon=1`">Reprendre dans l'éditeur</RouterLink>
                <button class="btn btn-ghost small" type="button" :disabled="busy" @click="publishNow">Publier maintenant</button>
                <button class="btn btn-ghost small btn-danger" type="button" :disabled="busy" @click="dropDraft">Supprimer le brouillon</button>
              </div>
              <p class="hint">La publication part à l'heure choisie, avec quelques instants de retard possible : elle est déclenchée par la première visite après l'heure.</p>
            </template>
            <p v-else class="hint">Aucun brouillon. Dans l'éditeur, « Enregistrer en brouillon » met ta version de côté sans toucher au site.</p>
          </section>

          <section class="card">
            <h3>Historique</h3>
            <p v-if="detail.versions === null" class="hint">Chargement…</p>
            <p v-else-if="!detail.versions.length" class="hint">Aucune ancienne version pour l'instant. Une version est gardée à chaque enregistrement (30 au maximum).</p>
            <ul v-else class="hist">
              <li v-for="v in detail.versions" :key="v.id">
                <span>{{ fmt(v.at) }}<small v-if="v.label"> · {{ v.label }}</small></span>
                <span class="vbtn">
                  <button class="btn btn-ghost small" type="button" :disabled="busy" @click="compare(v)">Comparer</button>
                  <button class="btn btn-ghost small" type="button" :disabled="busy" @click="restore(v)">Restaurer</button>
                </span>
              </li>
            </ul>
          </section>
        </template>
      </main>
    </div>

    <dialog ref="cmpDlg" class="diff" aria-labelledby="diff-t" @click="(e) => e.target === cmpDlg && cmpDlg.close()">
      <header><h2 id="diff-t">Version du {{ cmp && fmt(cmp.at) }} → état actuel</h2><button type="button" class="btn btn-ghost small" @click="cmpDlg.close()">Fermer</button></header>
      <template v-if="cmp">
        <p v-if="cmp.identical" class="hint">Aucune différence : cette version est identique à l'état actuel.</p>
        <template v-else>
          <p class="legend"><span class="d">− {{ cmpStats.del }} ligne(s) de la version ancienne</span><span class="a">+ {{ cmpStats.add }} ligne(s) dans l'état actuel</span></p>
          <ul class="lines">
            <li v-for="(l, i) in cmp.lines" :key="i" :class="l.t"><b aria-hidden="true">{{ l.t === 'add' ? '+' : l.t === 'del' ? '−' : '' }}</b><span>{{ l.s }}</span><span class="sr">{{ l.t === 'add' ? ' (ajouté)' : l.t === 'del' ? ' (retiré)' : '' }}</span></li>
          </ul>
        </template>
      </template>
    </dialog>
  </div>
</template>

<style scoped>
.cols{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:20px;align-items:start;margin-top:16px}
@media (max-width:760px){.cols{grid-template-columns:1fr}}
aside{display:grid;gap:10px;align-content:start}
aside input{font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg)}
aside h2{margin:8px 0 0;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
aside ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}
aside li button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg);cursor:pointer}
aside li button:hover{background:var(--bg)}
aside li button.on{border-color:var(--green);box-shadow:0 0 0 2px color-mix(in srgb,var(--green) 25%,transparent);font-weight:700}
.nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meta{display:flex;align-items:center;gap:6px;flex:none}
.meta small{color:var(--muted)}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips button{font:inherit;font-weight:600;font-size:.82rem;padding:5px 10px;border:1px solid var(--line);border-radius:99px;background:var(--card);color:var(--fg);cursor:pointer}
.chips button.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.pill{font-style:normal;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:99px;background:#fde68a;color:#78350f}
.pill.sched{background:var(--green);color:var(--on-green)}
main header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
main h2{margin:0}
h3{margin:0 0 8px;font-size:1rem}
.card{margin-bottom:14px}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0}
label{display:grid;gap:4px;font-size:.85rem;font-weight:600}
label input{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg)}
.hist{list-style:none;margin:0;padding:0;display:grid;gap:6px;max-height:420px;overflow:auto}
.hist li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 10px;border:1px solid var(--line);border-radius:8px}
.hist small{color:var(--muted)}
.vbtn{display:flex;gap:6px}
.diff{width:min(860px,calc(100vw - 24px));max-height:86vh;margin:auto;padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--fg)}
.diff::backdrop{background:rgba(0,0,0,.5)}
.diff header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}
.diff h2{margin:0;font-size:1.1rem}
.legend{display:flex;flex-wrap:wrap;gap:16px;font-size:.85rem;font-weight:700}
.legend .a{color:#1b7a3a}.legend .d{color:#b42318}
.lines{list-style:none;margin:8px 0 0;padding:0;max-height:62vh;overflow:auto;border:1px solid var(--line);border-radius:10px;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}
.lines li{display:grid;grid-template-columns:22px 1fr;padding:1px 10px;white-space:pre-wrap;word-break:break-word}
.lines b{text-align:center}
.lines .add{background:#e3f6e8;color:#14532d}.lines .del{background:#fde8e6;color:#7a1d14}
.lines .gap{color:var(--muted);background:var(--bg)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
</style>
