<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PROJECTS, TAGS } from '../data/projects.js'
import ProjectCard from './ProjectCard.vue'

const current = ref('Tout')
const track = ref(null)
const paused = ref(false)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

const list = computed(() => PROJECTS.filter((p) => current.value === 'Tout' || p.tag === current.value))

// Avec un filtre actif, les résultats s'affichent depuis le début de la liste.
watch(current, async () => {
  await nextTick()
  if (track.value) track.value.scrollLeft = 0
})

// Sans filtre : défilement lent automatique. Avec un filtre : arrêt.
let timer
onMounted(() => {
  timer = setInterval(() => {
    const el = track.value
    if (!el || current.value !== 'Tout' || paused.value || reduceMotion || document.hidden) return
    el.scrollLeft += 1
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollLeft = 0
  }, 30)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <section id="projets" class="projects" v-reveal>
    <div class="container">
      <h2>Projets</h2>
      <div class="chips" role="group" aria-label="Filtrer par catégorie">
        <button
          v-for="t in TAGS"
          :key="t"
          class="chip"
          type="button"
          :aria-pressed="current === t"
          @click="current = t"
        >{{ t }}</button>
      </div>
      <p class="count" aria-live="polite">{{ list.length }} projet{{ list.length > 1 ? 's' : '' }}</p>
    </div>
    <div
      ref="track"
      class="track"
      tabindex="0"
      role="region"
      aria-label="Liste des projets"
      @mouseenter="paused = true"
      @mouseleave="paused = false"
      @focusin="paused = true"
      @focusout="paused = false"
      @pointerdown.passive="paused = true"
      @touchstart.passive="paused = true"
    >
      <ProjectCard v-for="p in list" :key="p.name" :project="p" />
    </div>
  </section>
</template>

<style scoped>
.chips{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0 8px}
.chip{min-height:44px;padding:0 20px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);font:inherit;cursor:pointer;transition:border-color .2s}
.chip:hover{border-color:var(--neon)}
.chip[aria-pressed='true']{border-color:var(--neon);background:var(--card)}
.count{margin:0 0 16px;color:var(--muted)}
.track{display:flex;gap:24px;overflow-x:auto;padding:12px clamp(20px,5vw,48px) 32px;scrollbar-width:thin}
</style>
