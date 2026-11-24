<script setup>
// Liste des projets : ordre, statut (maintenance, masqué...), accès à l'édition.
import { onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { projectLink } from '../../content/projects.js'
import { toast } from '../../admin/toasts.js'
import ToggleSwitch from './ToggleSwitch.vue'
import { useBulk } from '../../admin/bulk.js'
import BulkBar from './BulkBar.vue'
import './adminForm.css'

const projects = ref([])
const sched = ref({})
const when = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
const error = ref('')
const STATUS = [['online', 'En ligne'], ['wip', 'En cours'], ['maintenance', 'En maintenance'], ['hidden', 'Masqué']]

async function load() {
  try { projects.value = (await api('/api/admin/projects')).projects } catch (e) { error.value = e.message }
  try { sched.value = Object.fromEntries((await api('/api/admin/drafts')).drafts.filter((d) => d.kind === 'project').map((d) => [d.ref, d])) } catch { sched.value = {} }
}
async function setStatus(p, status) {
  error.value = ''
  try { await api(`/api/admin/projects/${p.slug}`, { method: 'PATCH', body: { status } }); p.status = status } catch (e) { error.value = e.message; await load() }
}
// Interrupteur maintenance : le serveur mémorise l'ancien statut et le rétablit à la désactivation.
async function setMaintenance(p, on) {
  error.value = ''
  try {
    const r = await api(`/api/admin/projects/${p.slug}`, { method: 'PATCH', body: { maintenance: on } })
    p.status = r.status
    toast(on ? `« ${p.name} » en maintenance.` : `« ${p.name} » de nouveau ${r.status === 'wip' ? 'en cours' : 'en ligne'}.`, on ? 'warn' : 'ok')
  } catch (e) { error.value = e.message; await load() }
}
async function move(i, d) {
  const j = i + d
  if (j < 0 || j >= projects.value.length) return
  const list = [...projects.value]
  ;[list[i], list[j]] = [list[j], list[i]]
  projects.value = list
  try { await api('/api/admin/projects/reorder', { method: 'POST', body: { slugs: list.map((p) => p.slug) } }) } catch (e) { error.value = e.message; await load() }
}
onMounted(load)

// Actions groupées : changer le statut ou supprimer (vers la corbeille).
const bulk = useBulk((p) => p.slug)
async function bulkStatus(status) {
  error.value = ''
  const r = await bulk.run(projects.value, (p) => api(`/api/admin/projects/${p.slug}`, { method: 'PATCH', body: { status } }))
  finish(r, 'mis à jour')
}
async function bulkDelete() {
  if (!window.confirm(`Supprimer ${bulk.count.value} projet(s) ? Ils iront dans la corbeille pendant 30 jours.`)) return
  finish(await bulk.run(projects.value, (p) => api(`/api/admin/projects/${p.slug}`, { method: 'DELETE' })), 'supprimé(s)')
}
async function finish(r, what) {
  if (r.ok) toast(`${r.ok} projet(s) ${what}.`, 'ok')
  if (r.failed.length) error.value = r.failed.map((f) => `« ${f.item.name} » : ${f.message}`).join(' · ')
  bulk.clear(); await load()
}
</script>

<template>
  <div class="admin wide">
    <h1>Projets</h1>
    <p>Les modifications apparaissent sur le site en moins d'une minute.</p>
    <div class="bar"><RouterLink class="btn btn-primary" to="/admin/projets/nouveau">+ Nouveau projet</RouterLink></div>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <BulkBar :count="bulk.count.value" :busy="bulk.busy.value" @clear="bulk.clear">
      <select aria-label="Changer le statut de la sélection" :disabled="bulk.busy.value" @change="$event.target.value && bulkStatus($event.target.value); $event.target.value = ''">
        <option value="">Changer le statut…</option>
        <option v-for="[v, l] in STATUS" :key="v" :value="v">{{ l }}</option>
      </select>
      <button class="btn btn-ghost btn-danger small" type="button" :disabled="bulk.busy.value" @click="bulkDelete">Supprimer</button>
    </BulkBar>
    <table>
      <thead><tr><th class="chk"><input type="checkbox" :checked="bulk.allOn(projects)" aria-label="Tout sélectionner" @change="bulk.toggleAll(projects)" /></th><th>Ordre</th><th>Projet</th><th>Statut</th><th>Maintenance</th><th /></tr></thead>
      <tbody>
        <tr v-for="(p, i) in projects" :key="p.slug" :class="{ sel: bulk.has(p) }">
          <td class="chk"><input type="checkbox" :checked="bulk.has(p)" :aria-label="`Sélectionner ${p.name}`" @change="bulk.toggle(p)" /></td>
          <td>
            <button class="btn btn-ghost small" type="button" :disabled="i === 0" :aria-label="`Monter ${p.name}`" @click="move(i, -1)">↑</button>
            <button class="btn btn-ghost small" type="button" :disabled="i === projects.length - 1" :aria-label="`Descendre ${p.name}`" @click="move(i, 1)">↓</button>
          </td>
          <td><span class="name">{{ p.name }}</span><br /><span class="hint">{{ p.tag }} · /{{ p.slug }}{{ p.featured ? ' · projet phare' : '' }}<template v-if="sched[p.slug]"> · {{ sched[p.slug].publishAt ? `programmé le ${when(sched[p.slug].publishAt)}` : 'brouillon en attente' }}</template></span></td>
          <td>
            <select :value="p.status" :aria-label="`Statut de ${p.name}`" @change="setStatus(p, $event.target.value)">
              <option v-for="[v, l] in STATUS" :key="v" :value="v">{{ l }}</option>
            </select>
          </td>
          <td><ToggleSwitch :model-value="p.status === 'maintenance'" :disabled="p.status === 'hidden'" :label="`Maintenance de ${p.name}`" compact @update:model-value="setMaintenance(p, $event)" /></td>
          <td>
           <div class="actions">
            <RouterLink v-if="p.status !== 'hidden'" class="btn btn-ghost small" :to="projectLink(p)" target="_blank" title="Ouvre la page publique du projet dans un nouvel onglet">Voir</RouterLink>
            <RouterLink class="btn btn-primary small" :to="`/admin/projets/${p.slug}`" title="Modifier le contenu, le statut et la couleur">Modifier</RouterLink>
           </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.chk{width:36px}.chk input{width:18px;height:18px;accent-color:var(--green)}
tr.sel{background:color-mix(in srgb,var(--green) 10%,transparent)}
</style>
