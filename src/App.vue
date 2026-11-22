<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import CookieBanner from './components/CookieBanner.vue'
import AdminPreviewFlag from './components/AdminPreviewFlag.vue'
import SiteMaintenance from './components/SiteMaintenance.vue'
import { checkSession } from './admin/api.js'
import { loadSettings, settings, settingsReady } from './content/settings.js'

// Le cadre d'admin (barre latérale) n'est chargé que sur les pages d'administration.
const AdminLayout = defineAsyncComponent(() => import('./views/admin/AdminLayout.vue'))

const route = useRoute()
loadSettings()

// Maintenance de tout le site : le public voit la page de maintenance, l'admin connecté voit le site avec un rappel.
// L'administration, les mentions légales et la confidentialité restent toujours accessibles.
const isAdminArea = computed(() => route.path.startsWith('/admin'))
const alwaysOpen = computed(() => isAdminArea.value || ['legal', 'privacy'].includes(route.name))
const isAdmin = ref(false)
watch([() => settings.value.maintenanceOn, () => route.fullPath], async ([on]) => {
  if (on && !isAdmin.value && !isAdminArea.value) isAdmin.value = await checkSession()
}, { immediate: true })
const blocked = computed(() => settings.value.maintenanceOn && !isAdmin.value && !alwaysOpen.value)
</script>

<template>
  <a class="skip" href="#contenu">Aller au contenu</a>
  <AdminLayout v-if="route.meta.adminLayout"><RouterView /></AdminLayout>
  <template v-else-if="!settingsReady && !isAdminArea" />
  <SiteMaintenance v-else-if="blocked" />
  <template v-else>
    <AdminPreviewFlag v-if="settings.maintenanceOn && isAdmin && !isAdminArea" text="Maintenance du site active : seul toi, connecté, vois ces pages." />
    <AppHeader v-if="!route.meta.fullscreen" />
    <main id="contenu"><RouterView /></main>
    <AppFooter v-if="!route.meta.fullscreen" />
    <CookieBanner />
  </template>
</template>
