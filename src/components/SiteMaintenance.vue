<script setup>
// Page affichée à tout le public quand la maintenance globale est active (réglage de l'admin).
import { onBeforeUnmount, onMounted } from 'vue'
import { settings } from '../content/settings.js'

// Une page en maintenance ne doit pas être indexée
let meta
onMounted(() => { meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex'; document.head.append(meta) })
onBeforeUnmount(() => meta?.remove())
</script>

<template>
  <main id="contenu" class="maint" role="status">
    <span class="tag">Site en maintenance</span>
    <h1>Je reviens très vite</h1>
    <p>{{ settings.maintenanceMessage || 'Le site est en cours de mise à jour. Il sera de retour très bientôt.' }}</p>
    <nav aria-label="Informations légales">
      <RouterLink to="/mentions-legales">Mentions légales</RouterLink>
      <RouterLink to="/confidentialite">Confidentialité</RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.maint{min-height:100vh;display:grid;align-content:center;justify-items:center;gap:16px;padding:48px clamp(20px,5vw,48px);text-align:center}
.tag{padding:4px 14px;border:1px solid var(--neon);border-radius:999px;color:var(--green);font-size:14px;font-weight:600}
h1{font-size:clamp(36px,7vw,60px)}
p{max-width:52ch;margin:0;color:var(--muted);font-size:18px}
nav{display:flex;gap:20px;margin-top:16px;font-size:14px}
nav a{color:var(--muted)}
nav a:hover{color:var(--green)}
</style>
