<script setup>
// Enveloppe des pages codées à la main (Goodnight, tableau SpiderNet) : applique le statut défini dans l'admin.
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { getProject, loadProjects, ready } from '../content/projects.js'
import MaintenancePage from '../components/MaintenancePage.vue'
import NotFoundView from './NotFoundView.vue'

const route = useRoute()
loadProjects()
const project = computed(() => getProject(route.meta.project))
const View = computed(() => defineAsyncComponent(route.meta.view))
</script>

<template>
  <template v-if="ready">
    <MaintenancePage v-if="project?.status === 'maintenance'" :project="project" />
    <NotFoundView v-else-if="!project" />
    <component :is="View" v-else />
  </template>
</template>
