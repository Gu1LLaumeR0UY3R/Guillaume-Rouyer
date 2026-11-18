<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminPreviewText, bannerBackground, loadAdminProject, loadDetail, safeUrl, statusLabel } from '../content/projects.js'
import AdminPreviewFlag from '../components/AdminPreviewFlag.vue'
import MaintenancePage from '../components/MaintenancePage.vue'

const route = useRoute()
const router = useRouter()
const project = ref(null)
const preview = ref('')
const loading = ref(true)

// Public : un projet masqué ou introuvable renvoie vers l'accueil, un projet en maintenance affiche la page de maintenance.
// Administrateur connecté : il voit toujours le projet, avec un rappel de son statut.
watch(() => route.params.slug, async (slug) => {
  loading.value = true
  preview.value = ''
  let p = await loadDetail(slug)
  if (!p || p.status === 'maintenance') {
    const a = await loadAdminProject(slug)
    if (a) { p = a; preview.value = adminPreviewText(a) }
  }
  project.value = p
  loading.value = false
  if (!p) { router.replace('/'); return }
  document.title = `${p.name} · Er1gon359`
}, { immediate: true })
</script>

<template>
  <p v-if="loading" class="container missing" role="status">Chargement…</p>
  <MaintenancePage v-else-if="project?.status === 'maintenance' && !preview" :project="project" />
  <article v-else-if="project && project.featured && project.details" class="project">
    <header class="banner" :style="{ background: bannerBackground(project) }">
      <div class="container inner">
        <RouterLink class="back" to="/projets">← Tous les projets</RouterLink>
        <span v-if="statusLabel(project)" class="status">{{ statusLabel(project) }}</span>
        <h1>{{ project.name }}</h1>
        <p class="lead">{{ project.details.lead }}</p>
        <ul class="stack"><li v-for="s in project.stack" :key="s">{{ s }}</li></ul>
        <a v-if="safeUrl(project.repo)" class="main" :href="safeUrl(project.repo)" target="_blank" rel="noopener">Voir le code sur GitHub →</a>
      </div>
    </header>
    <div class="container body">
      <p v-if="project.details.notice" class="notice">{{ project.details.notice }}</p>
      <section v-for="(s, i) in project.details.sections" :key="i">
        <h2>{{ s.title }}</h2>
        <p v-for="(t, j) in s.paragraphs" :key="j">{{ t }}</p>
        <ul v-if="s.points?.length"><li v-for="(pt, j) in s.points" :key="j">{{ pt }}</li></ul>
      </section>
    </div>
  </article>
  <section v-else class="container missing">
    <h1>Projet introuvable</h1>
    <RouterLink class="btn btn-primary" to="/projets">Voir les projets</RouterLink>
  </section>
  <AdminPreviewFlag v-if="preview" :text="preview" />
</template>

<style scoped>
.banner{position:relative;color:#fff}
.banner::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.1))}
.inner{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:16px;padding-top:56px;padding-bottom:56px}
.back{color:#fff;opacity:.85;text-decoration:none}
.back:hover{opacity:1;text-decoration:underline}
.status{padding:3px 12px;border-radius:999px;background:rgba(255,255,255,.18);font-size:13px}
h1{font-size:clamp(40px,7vw,64px)}
.lead{max-width:62ch;margin:0;font-size:clamp(17px,2vw,20px);color:rgba(255,255,255,.88)}
.stack{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.stack li{color:#fff;padding:4px 12px;border:1px solid rgba(255,255,255,.45);border-radius:999px;font-size:14px}
.main{display:inline-flex;align-items:center;min-height:44px;padding:0 24px;border-radius:12px;background:#fff;color:#0b1f14;font-weight:600;text-decoration:none}
.body{max-width:860px;padding-top:40px;padding-bottom:72px}
.notice{padding:14px 18px;border:1px dashed var(--green);border-radius:12px;background:var(--card);color:var(--fg)}
.body section{padding:28px 0 0}
h2{margin-bottom:12px;font-size:28px}
p,li{color:var(--muted)}
p{margin:0 0 12px;max-width:68ch}
ul{margin:0 0 12px;padding-left:22px}
li+li{margin-top:6px}
.missing{min-height:50vh;display:grid;align-content:center;justify-items:center;gap:16px;text-align:center}
</style>
