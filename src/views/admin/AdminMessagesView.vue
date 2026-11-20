<script setup>
// Boîte de réception : messages du formulaire de contact. Ils ne sont lus qu'ici (aucune copie par e-mail).
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../../admin/api.js'
import { refreshBadges } from '../../admin/badges.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const FILTERS = [['', 'Tous'], ['new', 'Nouveaux'], ['open', 'Ouverts'], ['closed', 'Fermés']]
const LABEL = { new: 'Nouveau', open: 'Ouvert', closed: 'Fermé' }
const status = ref(''), q = ref(''), list = ref([]), counts = ref({ new: 0, open: 0, closed: 0 })
const current = ref(null), note = ref(''), loading = ref(true), busy = ref(false), error = ref('')

async function load() {
  try {
    const d = await api(`/api/admin/messages?status=${status.value}&q=${encodeURIComponent(q.value)}`)
    list.value = d.messages; counts.value = d.counts; error.value = ''
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(load)
let timer
watch([status, q], () => { clearTimeout(timer); timer = setTimeout(load, 250) })

const total = computed(() => counts.value.new + counts.value.open + counts.value.closed)
const date = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

async function openMsg(id) {
  try {
    const { message } = await api(`/api/admin/messages/${id}`)
    current.value = message; note.value = message.note
    if (message.status === 'new') await setStatus('open', true) // lire un message le fait passer en « ouvert »
  } catch (e) { toast(e.message, 'danger') }
}
async function patch(body, ok) {
  busy.value = true
  try {
    await api(`/api/admin/messages/${current.value.id}`, { method: 'PATCH', body })
    Object.assign(current.value, body)
    if (ok) toast(ok, 'info')
    await Promise.all([load(), refreshBadges()])
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
const setStatus = (s, quiet = false) => patch({ status: s }, quiet ? '' : `Message ${LABEL[s].toLowerCase()}`)
const saveNote = () => patch({ note: note.value }, 'Note enregistrée')
async function remove() {
  if (!confirm(`Supprimer définitivement le message de ${current.value.name} ?`)) return
  busy.value = true
  try {
    await api(`/api/admin/messages/${current.value.id}`, { method: 'DELETE' })
    current.value = null; toast('Message supprimé', 'info')
    await Promise.all([load(), refreshBadges()])
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
const mailto = computed(() => current.value && `mailto:${current.value.email}?subject=${encodeURIComponent('Re: ' + (current.value.subject || 'Ton message'))}`)
</script>

<template>
  <main class="admin wide">
    <h1>Messages</h1>
    <p class="hint">Reçus par le formulaire de contact. Ils ne sont visibles qu'ici et supprimés automatiquement après 12 mois.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <div class="bar">
      <div class="chips" role="group" aria-label="Filtrer par état">
        <button v-for="[k, n] in FILTERS" :key="k" type="button" :class="{ on: status === k }" :aria-pressed="status === k" @click="status = k">
          {{ n }}<span class="n">{{ k ? counts[k] : total }}</span>
        </button>
      </div>
      <span class="spacer" />
      <input v-model="q" type="search" placeholder="Rechercher (nom, e-mail, texte)" aria-label="Rechercher dans les messages" class="search">
    </div>

    <div class="split">
      <section class="listbox" aria-label="Liste des messages">
        <p v-if="loading" role="status">Chargement…</p>
        <p v-else-if="!list.length" class="hint empty">{{ q || status ? 'Aucun message ne correspond.' : "Aucun message pour l'instant." }}</p>
        <ul v-else>
          <li v-for="m in list" :key="m.id">
            <button type="button" class="row" :class="{ sel: current?.id === m.id, unread: m.status === 'new' }" :aria-current="current?.id === m.id ? 'true' : undefined" @click="openMsg(m.id)">
              <span class="top"><strong>{{ m.name }}</strong><time>{{ date(m.created_at) }}</time></span>
              <span class="subj">{{ m.subject || '(sans sujet)' }}</span>
              <span class="prev">{{ m.preview }}</span>
              <span class="tags"><em :class="m.status">{{ LABEL[m.status] }}</em><em v-if="m.has_note" class="note">Note</em></span>
            </button>
          </li>
        </ul>
      </section>

      <section class="detail" aria-live="polite">
        <p v-if="!current" class="hint empty">Choisis un message dans la liste.</p>
        <template v-else>
          <header>
            <div>
              <h2>{{ current.subject || '(sans sujet)' }}</h2>
              <p class="who"><strong>{{ current.name }}</strong> · <a :href="`mailto:${current.email}`">{{ current.email }}</a> · {{ date(current.created_at) }}</p>
            </div>
            <em :class="['pill', current.status]">{{ LABEL[current.status] }}</em>
          </header>
          <p class="body">{{ current.body }}</p>
          <div class="actions left">
            <a class="btn btn-primary small" :href="mailto">Répondre par e-mail</a>
            <button v-if="current.status !== 'closed'" class="btn btn-ghost small" type="button" :disabled="busy" @click="setStatus('closed')">Fermer</button>
            <button v-else class="btn btn-ghost small" type="button" :disabled="busy" @click="setStatus('open')">Rouvrir</button>
            <button v-if="current.status === 'open'" class="btn btn-ghost small" type="button" :disabled="busy" @click="setStatus('new')">Marquer non lu</button>
            <span class="spacer" />
            <button class="btn btn-ghost small btn-danger" type="button" :disabled="busy" @click="remove">Supprimer</button>
          </div>
          <label>Note privée (toi seul la vois)
            <textarea v-model="note" rows="3" maxlength="2000" />
          </label>
          <div class="actions left"><button class="btn btn-ghost small" type="button" :disabled="busy || note === current.note" @click="saveNote">Enregistrer la note</button></div>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips button{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--fg);font:600 14px var(--font);cursor:pointer;transition:background .2s,transform .2s}
.chips button:hover{transform:translateY(-2px)}
.chips button.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.n{min-width:22px;padding:2px 7px;border-radius:99px;background:rgba(127,127,127,.2);font-size:12px;text-align:center}
.search{max-width:340px}
.split{display:grid;grid-template-columns:minmax(280px,380px) minmax(0,1fr);gap:20px;align-items:start}
@media (max-width:900px){.split{grid-template-columns:1fr}}
.listbox,.detail{border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.listbox{max-height:70vh;overflow:auto}
.listbox ul{margin:0;padding:0;list-style:none}
.row{display:grid;gap:4px;width:100%;padding:14px 16px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--fg);font:inherit;text-align:left;cursor:pointer;transition:background .15s}
.row:hover{background:var(--bg)}
.row.sel{background:var(--bg);box-shadow:inset 4px 0 0 var(--green)}
.row.unread .top strong,.row.unread .subj{font-weight:800}
.top{display:flex;justify-content:space-between;gap:10px}
.top time{color:var(--muted);font-size:12px;white-space:nowrap}
.subj{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prev{color:var(--muted);font-size:14px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tags{display:flex;gap:6px}
em{padding:2px 9px;border-radius:99px;border:1px solid var(--line);font:600 11px var(--font);font-style:normal}
em.new{background:#b42318;border-color:#b42318;color:#fff}
em.open{border-color:var(--green);color:var(--green)}
em.closed{color:var(--muted)}
em.note{color:var(--muted)}
.empty{padding:24px;text-align:center}
.detail{display:grid;gap:16px;padding:22px;min-height:200px;align-content:start}
.detail header{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:start}
.detail h2{margin:0;font-size:22px}
.who{margin:6px 0 0;color:var(--muted)}
.pill{font-size:12px}
.body{margin:0;padding:16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--fg);white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}
.actions.left{justify-content:flex-start;align-items:center}
.actions .spacer{flex:1}
</style>
