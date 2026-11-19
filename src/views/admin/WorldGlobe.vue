<script setup>
// Globe terrestre en SVG : on le fait tourner à la souris ou au doigt, les pays sont colorés selon les visites.
// Au clavier, la liste des pays (à côté du globe) remplace le globe : rien ne dépend de la souris.
import { geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { alpha2, countryName, flag } from '../../admin/geo.js'

const props = defineProps({
  visits: { type: Object, default: () => ({}) }, // { FR: 120, ... }
  banned: { type: Object, default: () => ({}) }, // { FR: 'country' | 'continent' }
})
const emit = defineEmits(['pick'])

const SIZE = 520
const countries = feature(world, world.objects.countries).features.map((f) => ({ f, cc: alpha2(f.id), name: f.properties.name }))
const rot = ref([-10, -20, 0])
const proj = computed(() => geoOrthographic().scale(SIZE / 2 - 6).translate([SIZE / 2, SIZE / 2]).rotate(rot.value).clipAngle(90))
const path = computed(() => geoPath(proj.value))
const sphere = computed(() => path.value({ type: 'Sphere' }))
const grat = computed(() => path.value(geoGraticule10()))
const shapes = computed(() => countries.map((c) => ({ ...c, d: path.value(c.f) })).filter((c) => c.d))

const max = computed(() => Math.max(1, ...Object.values(props.visits)))
function fill(cc) {
  if (props.banned[cc]) return '#b42318'
  const n = props.visits[cc] ?? 0
  if (!n) return 'var(--globe-land)'
  const t = Math.min(1, Math.log(1 + n) / Math.log(1 + max.value))
  return `color-mix(in srgb, var(--green) ${Math.round(30 + t * 70)}%, var(--globe-land))`
}

const tip = ref(null)
function over(c, e) {
  const box = e.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect()
  tip.value = { x: e.clientX - box.left, y: e.clientY - box.top, name: c.cc ? `${flag(c.cc)} ${countryName(c.cc)}` : c.name, n: props.visits[c.cc] ?? 0, banned: props.banned[c.cc] }
}

// Rotation : glisser pour tourner, rotation lente automatique tant qu'on ne touche pas (sauf si l'animation est réduite).
let drag = null, raf = 0, moved = false
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const auto = ref(!still)
function down(e) { drag = { x: e.clientX, y: e.clientY, r: [...rot.value] }; moved = false; auto.value = false }
function move(e) {
  if (!drag) return
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y
  if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
  rot.value = [drag.r[0] + dx * 0.4, Math.max(-80, Math.min(80, drag.r[1] - dy * 0.4)), 0]
}
const up = () => { drag = null }
function click(c) { if (!moved && c.cc) emit('pick', c.cc) }
function tick() {
  if (auto.value && !drag) rot.value = [rot.value[0] + 0.15, rot.value[1], 0]
  raf = requestAnimationFrame(tick)
}
onMounted(() => { raf = requestAnimationFrame(tick); window.addEventListener('pointerup', up) })
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener('pointerup', up) })
</script>

<template>
  <div class="globe" @pointerleave="tip = null">
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" aria-label="Globe : pays colorés selon le nombre de visites, les pays bannis en rouge. La liste des pays est disponible à côté." @pointerdown="down" @pointermove="move">
      <defs>
        <radialGradient id="sea" cx="35%" cy="30%"><stop offset="0" style="stop-color:var(--globe-sea2)" /><stop offset="1" style="stop-color:var(--globe-sea)" /></radialGradient>
      </defs>
      <path :d="sphere" fill="url(#sea)" stroke="var(--line)" />
      <path :d="grat" fill="none" stroke="var(--line)" stroke-width=".4" opacity=".6" />
      <path v-for="c in shapes" :key="c.f.id" :d="c.d" :fill="fill(c.cc)" stroke="var(--bg)" stroke-width=".4" class="land" @pointerenter="over(c, $event)" @pointermove="over(c, $event)" @click="click(c)" />
    </svg>
    <div v-if="tip" class="tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
      <strong>{{ tip.name }}</strong><br>{{ tip.n }} visite{{ tip.n > 1 ? 's' : '' }}<span v-if="tip.banned"> · banni</span>
    </div>
    <button class="btn btn-ghost small spin" type="button" :aria-pressed="auto" @click="auto = !auto">{{ auto ? 'Arrêter la rotation' : 'Faire tourner' }}</button>
  </div>
</template>

<style scoped>
.globe{--globe-land:#d7dcd6;--globe-sea:#c9d8e8;--globe-sea2:#eef5fc;position:relative;display:grid;justify-items:center;gap:10px}
svg{width:min(100%,520px);height:auto;cursor:grab;touch-action:pan-y;user-select:none}
svg:active{cursor:grabbing}
.land{cursor:pointer;transition:opacity .15s}
.land:hover{opacity:.75;stroke:var(--fg);stroke-width:.8}
.tip{position:absolute;z-index:5;transform:translate(12px,-110%);padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg);font-size:13px;line-height:1.4;pointer-events:none;white-space:nowrap;box-shadow:0 10px 24px -14px rgba(0,0,0,.5)}
</style>
