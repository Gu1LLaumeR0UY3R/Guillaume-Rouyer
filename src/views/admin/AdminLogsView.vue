<script setup>
// Journaux : onglets (tout, sécurité, erreurs, activité admin), recherche, dates, pagination, export CSV et purge.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { api, download } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const TABS = [['all', 'Tout'], ['security', 'Sécurité'], ['errors', 'Erreurs'], ['admin', 'Activité admin']]
const EVENTS = {
  login_ok: 'Connexion réussie', login_failed: 'Échec de connexion', login_locked: 'Connexion verrouillée', logout: 'Déconnexion',
  reauth_failed: 'Confirmation d\'identité refusée', origin_refused: 'Origine refusée', unhandled: 'Erreur interne',
  project_created: 'Projet créé', project_updated: 'Projet modifié', project_patched: 'Projet modifié (rapide)', project_deleted: 'Projet supprimé', projects_reordered: 'Ordre des projets modifié',
  settings_updated: 'Réglages modifiés', site_maintenance_on: 'Maintenance du site activée', site_maintenance_off: 'Maintenance du site désactivée',
  password_changed: 'Mot de passe modifié', totp_change_started: 'Changement de 2FA commencé', totp_changed: '2FA régénéré', totp_change_bad_code: 'Code 2FA refusé (changement)',
  media_uploaded: 'Image ajoutée', media_updated: 'Image modifiée', media_trashed: 'Image mise à la corbeille', media_restored: 'Image restaurée', media_deleted: 'Image supprimée définitivement',
  session_revoked: 'Session fermée', sessions_revoked_all: 'Autres sessions fermées', logs_purged: 'Journaux purgés',
  setup_started: 'Installation commencée', setup_done: 'Installation terminée', setup_bad_token: 'Jeton d\'installation refusé', setup_bad_code: 'Code d\'installation refusé',
}

const logs = ref([])
const next = ref(null)
const category = ref('all')
const level = ref('')
const q = ref('')
const from = ref('')
const to = ref('')
const error = ref('')
const loading = ref(false)
const purgeDays = ref('7')

function params(more = false) {
  const p = new URLSearchParams({ category: category.value })
  if (level.value) p.set('level', level.value)
  if (q.value.trim()) p.set('q', q.value.trim())
  if (from.value) p.set('from', String(new Date(`${from.value}T00:00:00`).getTime()))
  if (to.value) p.set('to', String(new Date(`${to.value}T23:59:59.999`).getTime()))
  if (more && next.value) p.set('before', String(next.value))
  return p
}

async function load(more = false) {
  error.value = ''; loading.value = true
  try {
    const p = params(more); p.set('limit', '50')
    const r = await api(`/api/admin/logs?${p}`)
    logs.value = more ? [...logs.value, ...r.logs] : r.logs
    next.value = r.next
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

let timer
onMounted(load)
onBeforeUnmount(() => clearTimeout(timer))
watch([category, level, from, to], () => load())
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => load(), 350) })

async function exportCsv() {
  try { await download(`/api/admin/logs?${params()}&format=csv`, 'journaux.csv') } catch (e) { error.value = e.message }
}
async function purge() {
  const days = Number(purgeDays.value)
  const what = days === 0 ? 'TOUS les journaux' : `les journaux de plus de ${days} jour${days > 1 ? 's' : ''}`
  if (!window.confirm(`Supprimer ${what} ? Cette action est définitive.`)) return
  try {
    const r = await api('/api/admin/logs', { method: 'POST', body: { action: 'purge', days } })
    toast(`${r.deleted} ligne(s) supprimée(s).`, 'ok')
    await load()
  } catch (e) { error.value = e.message }
}
const fmt = (t) => new Date(t).toLocaleString('fr-FR')
</script>

<template>
  <div class="admin wide">
    <h1>Journaux</h1>
    <p>Événements de sécurité et d'activité, conservés 30 jours. Les mots de passe, codes et jetons n'y figurent jamais.</p>

    <div class="tabs" role="group" aria-label="Catégorie">
      <button v-for="[v, l] in TABS" :key="v" type="button" class="tab" :aria-pressed="category === v" @click="category = v">{{ l }}</button>
    </div>

    <div class="filters">
      <label>Recherche <input v-model="q" type="search" placeholder="événement, IP, chemin…" maxlength="60" /></label>
      <label>Niveau
        <select v-model="level"><option value="">Tous</option><option>info</option><option>warn</option><option>error</option><option>security</option></select>
      </label>
      <label>Du <input v-model="from" type="date" /></label>
      <label>Au <input v-model="to" type="date" /></label>
    </div>

    <div class="bar">
      <button class="btn btn-ghost small" type="button" @click="exportCsv">Exporter en CSV</button>
      <span class="spacer" />
      <label class="inline">Purger
        <select v-model="purgeDays">
          <option value="7">de plus de 7 jours</option><option value="1">de plus d'un jour</option><option value="0">tout</option>
        </select>
      </label>
      <button class="btn btn-ghost btn-danger small" type="button" @click="purge">Purger</button>
    </div>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="!logs.length && !loading && !error" class="empty">Aucun journal ne correspond.</p>

    <div v-if="logs.length" class="tablewrap">
      <table>
        <thead><tr><th>Date</th><th>Niveau</th><th>Événement</th><th>IP</th><th>Pays</th><th>Navigateur</th><th>Détail</th></tr></thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id">
            <td>{{ fmt(l.at) }}</td>
            <td title="Gravité de l'événement"><span class="lv" :class="l.level">{{ l.level }}</span></td>
            <td>{{ EVENTS[l.event] || l.event }}<br /><code class="raw">{{ l.event }}</code></td>
            <td>{{ l.ip }}</td>
            <td>{{ l.country || '—' }}</td>
            <td class="ua" :title="l.ua">{{ l.ua }}</td>
            <td class="detail" :title="l.meta"><code>{{ l.meta }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="next" class="bar"><button class="btn btn-ghost" type="button" :disabled="loading" @click="load(true)">Voir plus</button></div>
  </div>
</template>

<style scoped>
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 12px}
.tab{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 18px;transition:background .2s,color .2s,transform .15s;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);font:600 15px var(--font);cursor:pointer}
.tab:hover{transform:translateY(-1px);border-color:var(--green)}
.tab[aria-pressed='true']{border-color:var(--green);background:var(--green);color:var(--on-green)}
.filters label{min-width:0}
.filters input,.filters select{width:100%}
.filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
.inline{display:flex;align-items:center;gap:10px;font-weight:600}
.empty{padding:24px;border:1px dashed var(--line);border-radius:var(--radius);text-align:center}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius)}
table{font-size:14px}
th,td{white-space:nowrap;vertical-align:middle}
.raw{color:var(--muted);font-size:12px}
.ua{max-width:200px;overflow:hidden;text-overflow:ellipsis}
.detail{min-width:200px;max-width:380px;overflow:hidden;text-overflow:ellipsis}
.lv{display:inline-flex;align-items:center;padding:3px 10px;line-height:1;border:1px solid var(--line);border-radius:999px;font-size:12px;font-weight:600}
.lv.security,.lv.error{border-color:#b42318;color:#b42318}
.lv.warn{border-color:#b45309;color:#b45309}
.small{min-height:36px;padding:0 14px;font-size:14px}
</style>
