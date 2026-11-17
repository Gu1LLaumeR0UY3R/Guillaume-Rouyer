<script setup>
// Enveloppe des pages codées à la main (Goodnight, tableau SpiderNet) : applique le statut défini dans l'admin.
// Public : « en maintenance » -> page de maintenance ; « masqué » ou inconnu -> retour à l'accueil.
// Administrateur connecté : il voit toujours la page, avec un rappel de son statut.
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminPreviewText, getProject, loadAdminProject, loadProjects } from '../content/projects.js'
import AdminPreviewFlag from '../components/AdminPreviewFlag.vue'
import MaintenancePage from '../components/MaintenancePage.vue'

const route = useRoute()
const router = useRouter()
const project = ref(null)
const preview = ref('')
const resolved = ref(false)
const View = computed(() => defineAsyncComponent(route.meta.view))

watch(() => route.meta.project, async (slug) => {
  resolved.value = false
  preview.value = ''
  await loadProjects()
  let p = getProject(slug) ?? null
  if (!p || p.status === 'maintenance') {
    const a = await loadAdminProject(slug)
    if (a) { p = a; preview.value = adminPreviewText(a) }
  }
  project.value = p
  resolved.value = true
  if (!p) router.replace('/')
}, { immediate: true })
</script>

<template>
  <template v-if="resolved && project">
    <MaintenancePage v-if="project.status === 'maintenance' && !preview" :project="project" />
    <component :is="View" v-else />
    <AdminPreviewFlag v-if="preview" :text="preview" />
  </template>
</template>
