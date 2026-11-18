<script setup>
// Forêt pixel interactive : se place en arrière-plan de son parent (le hero).
// Un clic dans le hero plante un arbre ; la logique de dessin est dans forest/forestEngine.js.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createForest } from '../forest/forestEngine.js'
import { track } from '../stats.js'

const emit = defineEmits(['plant']) // reçoit le total d'arbres plantés (utile plus tard pour les statistiques)

const root = ref(null)
const cv = ref(null)
const count = ref(0)
const max = ref(0)
const night = ref(false)
let forest = null

onMounted(() => {
  const host = root.value.parentElement
  forest = createForest(cv.value, host, {
    onCount: (n, m) => { count.value = n; max.value = m },
    onNight: (n) => { night.value = n; host.dataset.sky = n ? 'night' : 'day' }, // le hero adapte la couleur du texte
    onPlant: (total) => { track.tree(); emit('plant', total) },
  })
  forest.mount()
})
onBeforeUnmount(() => forest?.destroy())
</script>

<template>
  <div ref="root" class="forest" :class="{ night }">
    <canvas ref="cv" aria-hidden="true" />
    <!-- Alternative clavier : planter sans souris -->
    <div class="hud" data-no-plant>
      <span class="count" aria-live="polite">{{ count ? `${count} / ${max} arbres` : 'Clique dans le décor pour planter' }}</span>
      <button type="button" :disabled="count >= max" @click="forest.plantRandom()">Planter</button>
      <button v-if="count" type="button" @click="forest.clear()">Vider</button>
    </div>
  </div>
</template>

<style scoped>
.forest{position:absolute;inset:0;z-index:0;pointer-events:none}
canvas{display:block;width:100%;height:100%;image-rendering:pixelated}
.hud{position:absolute;left:16px;bottom:14px;display:flex;align-items:center;gap:8px;padding:6px 8px 6px 14px;border:1px solid rgba(20,40,30,.15);border-radius:999px;background:rgba(255,255,255,.78);color:#1b3a28;font-size:14px;pointer-events:auto;backdrop-filter:blur(4px)}
.hud button{padding:4px 12px;border:0;border-radius:999px;background:#1b5e37;color:#fff;font:inherit;cursor:pointer}
.hud button:disabled{opacity:.45;cursor:default}
.hud button:hover{background:#14532d}
.hud button:focus-visible{outline:2px solid #8df2a6;outline-offset:2px}
.night .hud{background:rgba(14,22,60,.72);border-color:rgba(200,215,255,.2);color:#dfe8ff}
.night .hud button{background:#8df2a6;color:#0d2a1a}
</style>
