<script setup>
// Barre commune « Versions et publication » : brouillon, publication programmée, historique et restauration.
// Le parent fournit les données à mettre en brouillon (getData) et réagit à `restored` (recharger) et `resume` (reprendre le brouillon).
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'

const props = defineProps({ kind: { type: String, required: true }, refKey: { type: String, required: true }, getData: { type: Function, required: true } })
const emit = defineEmits(['restored', 'resume'])

const q = computed(() => `kind=${props.kind}&ref=${encodeURIComponent(props.refKey)}`)
const draft = ref(null), versions = ref(null), when = ref(''), busy = ref(false), open = ref(false)

const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
// Valeur minimale du champ date : dans 2 minutes, au format local attendu par datetime-local.
const minDate = () => { const d = new Date(Date.now() + 120_000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }

async function loadDraft() { try { draft.value = (await api(`/api/admin/drafts?${q.value}`)).draft } catch { draft.value = null } }
async function loadVersions() { try { versions.value = (await api(`/api/admin/versions?${q.value}`)).versions } catch (e) { versions.value = []; toast(e.message, 'danger') } }
onMounted(loadDraft)

function toggle(e) { open.value = e.target.open; if (open.value && versions.value === null) loadVersions() }

async function run(fn) { busy.value = true; try { await fn() } catch (e) { toast(e.message, 'danger') } finally { busy.value = false } }

const saveDraft = () => run(async () => {
  const at = when.value ? new Date(when.value).getTime() : null
  if (when.value && !Number.isFinite(at)) throw new Error('Date invalide')
  await api('/api/admin/drafts', { method: 'PUT', body: { kind: props.kind, ref: props.refKey, data: props.getData(), publishAt: at } })
  when.value = ''
  await loadDraft()
  toast(at ? `Publication programmée le ${fmt(at)}` : 'Brouillon enregistré : le site n\'a pas changé', 'info')
})
const resume = () => { emit('resume', draft.value.data); toast('Brouillon repris dans le formulaire. Enregistre pour publier.', 'info') }
const publishNow = () => run(async () => {
  if (!confirm('Publier ce brouillon maintenant ? Il remplace la version en ligne (elle reste dans l\'historique).')) return
  await api('/api/admin/drafts/publish', { method: 'POST', body: { kind: props.kind, ref: props.refKey } })
  draft.value = null; versions.value = null
  emit('restored')
  toast('Brouillon publié', 'info')
})
const dropDraft = () => run(async () => {
  if (!confirm('Supprimer ce brouillon ?')) return
  await api(`/api/admin/drafts?${q.value}`, { method: 'DELETE' })
  draft.value = null
})
const restore = (v) => run(async () => {
  if (!confirm(`Restaurer la version du ${fmt(v.at)} ? La version actuelle est gardée dans l'historique.`)) return
  await api(`/api/admin/versions/${v.id}`, { method: 'POST' })
  await loadVersions()
  emit('restored')
  toast('Version restaurée', 'info')
})
</script>

<template>
  <details class="vt" @toggle="toggle">
    <summary>
      Versions et publication
      <span v-if="draft?.publishAt" class="pill sched">Programmé</span>
      <span v-else-if="draft" class="pill">Brouillon</span>
    </summary>

    <div class="body">
      <div v-if="draft" class="state">
        <p>
          <strong v-if="draft.publishAt">Publication programmée le {{ fmt(draft.publishAt) }}.</strong>
          <strong v-else>Brouillon enregistré le {{ fmt(draft.updatedAt) }}.</strong>
          <span v-if="draft.error" class="err"> Échec de la publication : {{ draft.error }}</span>
        </p>
        <div class="row">
          <button class="btn btn-ghost small" type="button" :disabled="busy" @click="resume">Reprendre dans le formulaire</button>
          <button class="btn btn-ghost small" type="button" :disabled="busy" @click="publishNow">Publier maintenant</button>
          <button class="btn btn-ghost small btn-danger" type="button" :disabled="busy" @click="dropDraft">{{ draft.publishAt ? 'Annuler la programmation' : 'Supprimer' }}</button>
        </div>
      </div>

      <div class="make">
        <h3>{{ draft ? 'Remplacer par la version actuelle du formulaire' : 'Mettre de côté la version actuelle du formulaire' }}</h3>
        <div class="row">
          <label>Publier le (facultatif)<input v-model="when" type="datetime-local" :min="minDate()"></label>
          <button class="btn btn-ghost small" type="button" :disabled="busy" @click="saveDraft">{{ when ? 'Programmer la publication' : 'Enregistrer comme brouillon' }}</button>
        </div>
        <p class="hint">Le site ne change pas avant la publication. Une publication programmée part à l'heure choisie, avec quelques instants de retard possible (elle est déclenchée par la première visite après l'heure).</p>
      </div>

      <div class="hist">
        <h3>Historique</h3>
        <p v-if="versions === null" class="hint">Chargement…</p>
        <p v-else-if="!versions.length" class="hint">Aucune ancienne version pour l'instant. Une version est gardée à chaque enregistrement (30 au maximum).</p>
        <ul v-else>
          <li v-for="v in versions" :key="v.id">
            <span>{{ fmt(v.at) }}<small v-if="v.label"> · {{ v.label }}</small></span>
            <button class="btn btn-ghost small" type="button" :disabled="busy" @click="restore(v)">Restaurer</button>
          </li>
        </ul>
      </div>
    </div>
  </details>
</template>

<style scoped>
.vt{border:1px solid var(--line);border-radius:var(--radius);background:var(--card);margin:0 0 16px}
summary{cursor:pointer;padding:10px 14px;font-weight:700;list-style:none;display:flex;align-items:center;gap:10px}
summary::-webkit-details-marker{display:none}
summary::before{content:'▸';transition:transform .15s}
.vt[open] summary::before{transform:rotate(90deg)}
.body{padding:0 14px 14px;display:grid;gap:14px}
h3{margin:0 0 6px;font-size:.92rem}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
label{display:grid;gap:4px;font-size:.85rem;font-weight:600}
input{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg)}
.hint{color:var(--muted);font-size:.85rem;margin:6px 0 0}
.state p{margin:0 0 8px}
.err{color:#b42318}
[data-theme=dark] .err{color:#ff9a90}
.pill{font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:99px;background:var(--line);color:var(--fg)}
.pill.sched{background:var(--green);color:var(--on-green)}
ul{list-style:none;margin:0;padding:0;display:grid;gap:6px;max-height:260px;overflow:auto}
li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 10px;border:1px solid var(--line);border-radius:8px}
li small{color:var(--muted)}
</style>
