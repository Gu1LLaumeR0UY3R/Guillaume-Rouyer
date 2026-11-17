<script setup>
// Alertes : tentatives suspectes, erreurs, rappels de sécurité. Les répétitions sont regroupées avec un compteur.
import { onMounted, ref, watch } from 'vue'
import { api } from '../../admin/api.js'
import { refreshBadges } from '../../admin/badges.js'
import './adminForm.css'

const alerts = ref([])
const next = ref(null)
const filter = ref('all')
const error = ref('')
const busy = ref(false)

const LEVEL = { info: 'Info', warn: 'À surveiller', critical: 'Critique' }
const fmt = (t) => new Date(t).toLocaleString('fr-FR')

async function load(more = false) {
  error.value = ''
  try {
    const q = `filter=${filter.value}&limit=30${more && next.value ? `&before=${next.value}` : ''}`
    const r = await api(`/api/admin/alerts?${q}`)
    alerts.value = more ? [...alerts.value, ...r.alerts] : r.alerts
    next.value = r.next
  } catch (e) { error.value = e.message }
}
onMounted(load)
watch(filter, () => load())

async function act(action, ids) {
  busy.value = true; error.value = ''
  try {
    await api('/api/admin/alerts', { method: 'POST', body: { action, ...(ids ? { ids } : {}) } })
    await load()
    await refreshBadges()
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
const removeRead = () => { if (window.confirm('Supprimer toutes les alertes déjà lues ?')) act('deleteRead') }
</script>

<template>
  <div class="admin wide">
    <h1>Alertes</h1>
    <p>Tentatives de connexion suspectes, requêtes refusées, erreurs et rappels de sécurité. Une alerte répétée s'affiche une seule fois avec un compteur.</p>

    <div class="bar">
      <label class="inline">Afficher
        <select v-model="filter"><option value="all">Toutes</option><option value="unread">Non lues</option></select>
      </label>
      <span class="spacer" />
      <button class="btn btn-ghost small" type="button" :disabled="busy" @click="act('readAll')">Tout marquer comme lu</button>
      <button class="btn btn-ghost btn-danger small" type="button" :disabled="busy" @click="removeRead">Supprimer les lues</button>
    </div>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="!alerts.length && !error" class="empty">{{ filter === 'unread' ? 'Aucune alerte non lue.' : 'Aucune alerte pour le moment.' }}</p>

    <ul class="list">
      <li v-for="a in alerts" :key="a.id" :class="[a.level, { unread: !a.is_read }]">
        <div class="main">
          <p class="title">
            <span class="lv">{{ LEVEL[a.level] }}</span>
            {{ a.title }}<span v-if="a.count > 1" class="count"> ×{{ a.count }}</span>
            <span v-if="!a.is_read" class="new">Nouvelle</span>
          </p>
          <p class="meta">{{ fmt(a.at) }}<template v-if="a.detail"> · {{ a.detail }}</template></p>
        </div>
        <div class="actions">
          <button v-if="!a.is_read" class="btn btn-ghost small" type="button" :disabled="busy" @click="act('read', [a.id])">Marquer comme lue</button>
          <button class="btn btn-ghost btn-danger small" type="button" :disabled="busy" @click="act('delete', [a.id])">Supprimer</button>
        </div>
      </li>
    </ul>

    <div v-if="next" class="bar"><button class="btn btn-ghost" type="button" @click="load(true)">Voir plus</button></div>
  </div>
</template>

<style scoped>
.inline{display:flex;align-items:center;gap:10px}
.empty{padding:24px;border:1px dashed var(--line);border-radius:var(--radius);text-align:center}
.list{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.list li{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:14px 16px;border:1px solid var(--line);border-left:5px solid var(--line);border-radius:var(--radius);background:var(--card)}
.list li.unread{border-left-color:var(--green)}
.list li.warn.unread{border-left-color:#f59e0b}
.list li.critical.unread{border-left-color:#b42318}
.main{min-width:0;flex:1 1 320px}
.title{margin:0;color:var(--fg);font-weight:700}
.meta{margin:4px 0 0;font-size:14px;overflow-wrap:anywhere}
.lv{margin-right:8px;padding:2px 10px;border:1px solid var(--line);border-radius:999px;font-size:12px;font-weight:600;vertical-align:1px}
.count{color:var(--muted)}
.new{margin-left:8px;padding:2px 8px;border-radius:999px;background:var(--green);color:var(--on-green);font-size:12px}
.small{min-height:36px;padding:0 14px;font-size:14px}
</style>
