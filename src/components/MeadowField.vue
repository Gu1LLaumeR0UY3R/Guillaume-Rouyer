<script setup>
import { computed, ref } from 'vue'

// Champ d'herbe interactif : chaque clic fait pousser un élément à un emplacement fixe.
const SPOTS = [
  { x: 10, type: 'cherry' }, { x: 24, type: 'flower' }, { x: 36, type: 'willow' }, { x: 50, type: 'flower' },
  { x: 62, type: 'cherry' }, { x: 76, type: 'flower' }, { x: 88, type: 'willow' },
]
const WIDTH = { cherry: 100, willow: 100, flower: 30, mark: 20 }

const rnd = (k) => Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1
const blades = Array.from({ length: 120 }, (_, i) => {
  const r = rnd(i)
  return {
    left: `${(i * 0.83).toFixed(2)}%`,
    height: `${10 + Math.round(r * 16)}px`,
    animationDuration: `${(3 + r * 3).toFixed(1)}s`,
    animationDelay: `-${(r * 4).toFixed(1)}s`,
  }
})
const strands = [16, 26, 36, 46, 56, 66, 76, 86].map(
  (x, i) => `M${x} 38C${x - 6} 70 ${x + 4} 92 ${x - 2} ${100 + (i % 3) * 6}`,
)

const planted = ref(0)
const spots = computed(() => SPOTS.map((s, i) => {
  const on = i < planted.value
  return { ...s, on, style: { left: `${s.x}%`, marginLeft: `-${WIDTH[on ? s.type : 'mark'] / 2}px` } }
}))
const hint = computed(() => (planted.value ? `${planted.value} / ${SPOTS.length} plantés` : "Clique dans l'herbe"))

function plant() {
  planted.value = planted.value >= SPOTS.length ? 0 : planted.value + 1
}
</script>

<template>
  <button class="meadow" type="button" aria-label="Champ d'herbe : cliquer pour faire pousser des arbres et des fleurs" @click="plant">
    <span class="hint">{{ hint }}</span>
    <span v-for="(style, i) in blades" :key="i" class="blade" :style="style" />
    <span v-for="s in spots" :key="s.x" class="spot" :style="s.style">
      <svg v-if="!s.on" viewBox="0 0 20 8" width="20" height="8" aria-hidden="true">
        <ellipse cx="10" cy="4" rx="8" ry="3" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-dasharray="3 3" />
      </svg>
      <svg v-else-if="s.type === 'cherry'" class="grow" viewBox="0 0 100 120" width="100" height="120" aria-hidden="true">
        <path d="M48 120C50 90 44 75 40 60M50 100C56 85 62 72 70 58M46 82C42 74 34 70 28 66" stroke="#7a5a48" stroke-width="5" stroke-linecap="round" fill="none" />
        <g fill="#f6c3d2"><circle cx="50" cy="34" r="26" /><circle cx="26" cy="52" r="20" /><circle cx="74" cy="50" r="22" /></g>
        <g fill="#fbdde6"><circle cx="40" cy="26" r="14" /><circle cx="66" cy="36" r="12" /></g>
        <g fill="#ee9fb8"><circle cx="30" cy="48" r="4" /><circle cx="58" cy="22" r="4" /><circle cx="76" cy="56" r="4" /><circle cx="48" cy="46" r="3" /></g>
      </svg>
      <svg v-else-if="s.type === 'willow'" class="grow" viewBox="0 0 100 130" width="100" height="130" aria-hidden="true">
        <path d="M50 130C52 100 48 80 46 50" stroke="#7a5a48" stroke-width="5" stroke-linecap="round" fill="none" />
        <ellipse cx="50" cy="36" rx="42" ry="22" fill="#a9d4a4" />
        <g stroke="#86bd86" stroke-width="3" stroke-linecap="round" fill="none"><path v-for="(d, k) in strands" :key="k" :d="d" /></g>
      </svg>
      <svg v-else class="grow" viewBox="0 0 40 60" width="30" height="45" aria-hidden="true">
        <line x1="20" y1="20" x2="20" y2="60" stroke="#6bb07a" stroke-width="3" />
        <g transform="translate(20 18)" fill="#fff" stroke="#8fb8e8" stroke-width="1.5">
          <ellipse v-for="a in [0, 72, 144, 216, 288]" :key="a" cy="-9" rx="5" ry="9" :transform="`rotate(${a})`" />
          <circle r="4" fill="#f2d27a" stroke="none" />
        </g>
      </svg>
    </span>
  </button>
</template>

<style scoped>
.meadow{display:block;position:relative;width:100%;height:210px;margin-top:40px;padding:0;border:0;border-radius:24px;overflow:hidden;cursor:pointer;color:var(--fg);background:linear-gradient(to top,color-mix(in srgb,var(--card) 85%,#8cc58f),transparent 85%)}
.hint{position:absolute;left:16px;top:12px;color:var(--muted);font-size:14px}
.blade{position:absolute;bottom:0;width:4px;border-radius:4px 4px 0 0;transform-origin:bottom center;background:linear-gradient(to top,#8cc58f,#cfeacb);animation:sway ease-in-out infinite alternate}
@keyframes sway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
.spot{position:absolute;bottom:6px;display:block;pointer-events:none}
.spot svg{display:block;transform-origin:bottom center}
.grow{animation:pop .7s cubic-bezier(.3,1.4,.5,1) both}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
</style>
