<script setup>
// Tableau de bord provisoire : il montre que la connexion et les journaux fonctionnent. L'admin complet arrive à l'étape suivante.
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import './adminForm.css'

const router = useRouter()
const logs = ref([])
const level = ref('')
const error = ref('')

async function load() {
  error.value = ''
  try { logs.value = (await api(`/api/admin/logs?limit=100${level.value ? `&level=${level.value}` : ''}`)).logs } catch (e) { error.value = e.message }
}
async function logout() {
  try { await api('/api/admin/logout', { method: 'POST' }) } finally { router.push('/admin') }
}
onMounted(load)
watch(level, load)
const fmt = (t) => new Date(t).toLocaleString('fr-FR')
</script>

<template>
  <div class="admin dash">
    <h1>Tableau de bord</h1>
    <p>Connecté. Journaux de sécurité et d'activité (30 jours).</p>
    <p><label>Niveau
      <select v-model="level"><option value="">Tous</option><option>info</option><option>warn</option><option>error</option><option>security</option></select>
    </label>
    <button class="btn btn-ghost" @click="logout">Se déconnecter</button></p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>Date</th><th>Niveau</th><th>Événement</th><th>IP</th><th>Pays</th><th>Détail</th></tr></thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id">
            <td>{{ fmt(l.at) }}</td><td>{{ l.level }}</td><td>{{ l.event }}</td><td>{{ l.ip }}</td><td>{{ l.country }}</td><td><code>{{ l.meta }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.dash{max-width:1100px}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}
td:last-child{white-space:normal}
select{margin:0 12px 0 8px;min-height:40px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg)}
</style>
