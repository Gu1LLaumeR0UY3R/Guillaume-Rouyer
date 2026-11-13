<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

defineProps({ project: { type: Object, required: true } })

// Une page en maintenance ne doit pas être indexée
let meta
onMounted(() => { meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex'; document.head.append(meta) })
onBeforeUnmount(() => meta?.remove())
</script>

<template>
  <section class="maint container" role="status">
    <span class="tag">Page en maintenance</span>
    <h1>{{ project.name }}</h1>
    <p>{{ project.maintenanceMessage || 'Cette page est en cours de mise à jour. Elle sera de retour très bientôt.' }}</p>
    <RouterLink class="btn btn-primary" to="/projets">← Voir les autres projets</RouterLink>
  </section>
</template>

<style scoped>
.maint{min-height:60vh;display:grid;align-content:center;justify-items:start;gap:16px;padding-top:72px;padding-bottom:72px}
.tag{padding:4px 14px;border:1px solid var(--neon);border-radius:999px;color:var(--green);font-size:14px;font-weight:600}
h1{font-size:clamp(36px,6vw,56px)}
p{max-width:56ch;margin:0;color:var(--muted);font-size:18px}
</style>
