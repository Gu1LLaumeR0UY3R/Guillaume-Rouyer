<script setup>
import { useRouter } from 'vue-router'
import { api } from '../../admin/api.js'

const router = useRouter()
async function logout() {
  try { await api('/api/admin/logout', { method: 'POST' }) } finally { router.push('/admin') }
}
</script>

<template>
  <nav class="bar" aria-label="Administration">
    <RouterLink class="btn btn-ghost small" to="/admin/projets">Projets</RouterLink>
    <RouterLink class="btn btn-ghost small" to="/admin/tableau">Journaux</RouterLink>
    <span class="spacer" />
    <button class="btn btn-ghost small" type="button" @click="logout">Se déconnecter</button>
  </nav>
</template>
