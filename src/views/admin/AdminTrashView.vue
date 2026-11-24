<script setup>
// Corbeille : projets et articles supprimés, restaurables pendant 30 jours.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const router = useRouter()
const items = ref([]), keepDays = ref(30), loading = ref(true), error = ref(''), busy = ref(0)
const KIND = { project: 'Projet', article: 'Article' }
const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
const left = (ms) => Math.max(0, Math.ceil((ms + keepDays.value * 86400000 - Date.now()) / 86400000))
const sorted = computed(() => items.value)

async function load() {
  loading.value = true; error.value = ''
  try { const d = await api('/api/admin/trash'); items.value = d.items; keepDays.value = d.keepDays } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(load)

async function restore(it) {
  busy.value = it.id
  try {
    const r = await api('/api/admin/trash', { method: 'POST', body: { id: it.id } })
    toast(`« ${it.title} » restauré.`, 'ok')
    items.value = items.value.filter((x) => x.id !== it.id)
    if (window.confirm('Ouvrir l\'élément restauré ?')) router.push(r.kind === 'project' ? `/admin/projets/${r.ref}` : `/admin/veille/${r.ref}`)
  } catch (e) { toast(e.message, 'err') } finally { busy.value = 0 }
}
async function purge(it) {
  if (!window.confirm(`Effacer définitivement « ${it.title} » ? Impossible de le récupérer ensuite.`)) return
  busy.value = it.id
  try { await api(`/api/admin/trash?id=${it.id}`, { method: 'DELETE' }); items.value = items.value.filter((x) => x.id !== it.id); toast('Effacé définitivement.', 'ok') }
  catch (e) { toast(e.message, 'err') } finally { busy.value = 0 }
}
async function empty() {
  if (!window.confirm(`Vider la corbeille (${items.value.length} élément(s)) ? Impossible de les récupérer ensuite.`)) return
  try { await api('/api/admin/trash', { method: 'DELETE' }); items.value = []; toast('Corbeille vidée.', 'ok') } catch (e) { toast(e.message, 'err') }
}
</script>

<template>
  <div class="admin">
    <h1>Corbeille</h1>
    <p class="hint">Les projets et articles supprimés restent ici {{ keepDays }} jours, puis sont effacés automatiquement. Les images ont leur propre corbeille dans <RouterLink to="/admin/medias">Médias</RouterLink>.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="hint">Chargement…</p>
    <p v-else-if="!sorted.length" class="hint">La corbeille est vide.</p>
    <template v-else>
      <ul class="trash">
        <li v-for="it in sorted" :key="it.id">
          <span class="kind">{{ KIND[it.kind] }}</span>
          <div class="info"><b>{{ it.title }}</b><small>Supprimé le {{ fmt(it.deletedAt) }} · effacé dans {{ left(it.deletedAt) }} jour(s)</small></div>
          <button class="btn btn-primary small" type="button" :disabled="busy === it.id" @click="restore(it)">Restaurer</button>
          <button class="btn btn-ghost btn-danger small" type="button" :disabled="busy === it.id" @click="purge(it)">Effacer</button>
        </li>
      </ul>
      <div class="bar"><button class="btn btn-ghost btn-danger" type="button" @click="empty">Vider la corbeille</button></div>
    </template>
  </div>
</template>

<style scoped>
.trash{list-style:none;margin:16px 0;padding:0;display:grid;gap:10px}
.trash li{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.kind{padding:3px 10px;border-radius:999px;border:1px solid var(--line);font:700 12px var(--font);text-transform:uppercase;letter-spacing:.04em}
.info{flex:1;min-width:200px;display:grid}
.info small{color:var(--muted)}
</style>
