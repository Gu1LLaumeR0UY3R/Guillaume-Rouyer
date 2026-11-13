<script setup>
// Liste des projets : ordre, statut (maintenance, masqué...), accès à l'édition.
import { onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { projectLink } from '../../content/projects.js'
import AdminNav from './AdminNav.vue'
import './adminForm.css'

const projects = ref([])
const error = ref('')
const STATUS = [['online', 'En ligne'], ['wip', 'En cours'], ['maintenance', 'En maintenance'], ['hidden', 'Masqué']]

async function load() {
  try { projects.value = (await api('/api/admin/projects')).projects } catch (e) { error.value = e.message }
}
async function setStatus(p, status) {
  error.value = ''
  try { await api(`/api/admin/projects/${p.slug}`, { method: 'PATCH', body: { status } }); p.status = status } catch (e) { error.value = e.message; await load() }
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
</script>

<template>
  <div class="admin wide">
    <AdminNav />
    <h1>Projets</h1>
    <p>Les modifications apparaissent sur le site en moins d'une minute.</p>
    <div class="bar"><RouterLink class="btn btn-primary" to="/admin/projets/nouveau">+ Nouveau projet</RouterLink></div>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <table>
      <thead><tr><th>Ordre</th><th>Projet</th><th>Statut</th><th /></tr></thead>
      <tbody>
        <tr v-for="(p, i) in projects" :key="p.slug">
          <td>
            <button class="btn btn-ghost small" type="button" :disabled="i === 0" :aria-label="`Monter ${p.name}`" @click="move(i, -1)">↑</button>
            <button class="btn btn-ghost small" type="button" :disabled="i === projects.length - 1" :aria-label="`Descendre ${p.name}`" @click="move(i, 1)">↓</button>
          </td>
          <td><span class="name">{{ p.name }}</span><br /><span class="hint">{{ p.tag }} · /{{ p.slug }}{{ p.featured ? ' · projet phare' : '' }}</span></td>
          <td>
            <select :value="p.status" :aria-label="`Statut de ${p.name}`" @change="setStatus(p, $event.target.value)">
              <option v-for="[v, l] in STATUS" :key="v" :value="v">{{ l }}</option>
            </select>
          </td>
          <td class="actions">
            <RouterLink v-if="p.status !== 'hidden'" class="btn btn-ghost small" :to="projectLink(p)" target="_blank">Voir</RouterLink>
            <RouterLink class="btn btn-primary small" :to="`/admin/projets/${p.slug}`">Modifier</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
