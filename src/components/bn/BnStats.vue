<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { AI, ARSENAL, EDITOR } from '../../data/bataille.js'

const root = ref(null)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const items = [
  { label: 'cases de côté', fixed: '10 × 10' },
  { label: 'outils dans l\u2019arsenal', to: ARSENAL.length },
  { label: 'niveaux d\u2019IA', to: AI.levels.length },
  { label: 'cartes fournies', to: EDITOR.maps.length },
]
const shown = ref(items.map((it) => (it.fixed ?? it.to)))
let io
let raf = 0

function countUp() {
  const start = performance.now()
  const step = (now) => {
    const k = Math.min(1, (now - start) / 1100)
    const ease = 1 - (1 - k) ** 3
    shown.value = items.map((it) => (it.fixed ?? Math.round(it.to * ease)))
    if (k < 1) raf = requestAnimationFrame(step)
  }
  shown.value = items.map((it) => (it.fixed ?? 0))
  raf = requestAnimationFrame(step)
}
onMounted(() => {
  if (reduceMotion) return
  io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { countUp(); io.disconnect() } }, { threshold: 0.4 })
  io.observe(root.value)
})
onBeforeUnmount(() => { io?.disconnect(); cancelAnimationFrame(raf) })
</script>

<template>
  <section ref="root" class="stats" aria-label="Le jeu en chiffres">
    <div class="container">
      <ul>
        <li v-for="(it, i) in items" :key="it.label">
          <strong>{{ shown[i] }}</strong>
          <span>{{ it.label }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.stats{padding:8px 0 56px;background:var(--paper)}
ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:12px;margin:0;padding:0;list-style:none}
li{padding:18px 12px;text-align:center;border-radius:16px;background:#fff;border:1px solid #eadfc2;box-shadow:0 18px 34px -26px rgba(11,53,80,.5)}
strong{display:block;font:600 clamp(32px,4.5vw,46px)/1.1 var(--serif);color:var(--ocean)}
span{font-size:13px;letter-spacing:.04em;color:var(--muted)}
</style>
