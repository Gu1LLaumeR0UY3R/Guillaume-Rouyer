<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { WAVES } from '../../data/bataille.js'
import { CODE } from '../../data/bataille.code.js'

const canvas = ref(null)
const active = ref([true, true])
const speed = ref(1)
const paused = ref(false)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

// Mêmes ondes que le jeu : vecteur d'onde = (2π / longueur d'onde) × direction normalisée.
const vectors = WAVES.ondes.map((o) => {
  const k = (2 * Math.PI) / o.longueurOnde
  const n = Math.hypot(o.direction[0], o.direction[1])
  return { kx: (k * o.direction[0]) / n, kz: (k * o.direction[1]) / n }
})
const heightOf = (i, x, t) => WAVES.ondes[i].amplitude * Math.sin(vectors[i].kx * x - WAVES.ondes[i].pulsation * t)
const total = (x, t) => WAVES.ondes.reduce((s, _, i) => s + (active.value[i] ? heightOf(i, x, t) : 0), 0)
const slopeAt = (x, t) => (total(x + 0.05, t) - total(x - 0.05, t)) / 0.1

let raf = 0
let time = 0
let last = 0
let visible = true
let io

function draw() {
  const el = canvas.value
  if (!el) return
  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth
  const h = el.clientHeight
  if (el.width !== Math.round(w * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(h * dpr) }
  const ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const span = 20
  const mid = h * 0.52
  const scale = (h * 0.34) / 0.065
  const line = (fn, color, width) => {
    ctx.beginPath()
    for (let px = 0; px <= w; px += 3) {
      const x = (px / w) * span
      const y = mid - fn(x) * scale
      if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
  }
  WAVES.ondes.forEach((_, i) => { if (active.value[i]) line((x) => heightOf(i, x, time), i ? 'rgba(122,214,208,.8)' : 'rgba(160,210,240,.8)', 1.5) })
  line((x) => total(x, time), '#FFBD54', 3.5)
  // Un bateau posé sur la surface : sa hauteur et son inclinaison viennent de la même fonction.
  const bx = span * 0.5
  const px = (bx / span) * w
  const py = mid - total(bx, time) * scale
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(Math.atan(-slopeAt(bx, time) * scale / (w / span)))
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.moveTo(-26, -4); ctx.lineTo(26, -4); ctx.lineTo(18, 9); ctx.lineTo(-18, 9); ctx.closePath()
  ctx.fill()
  ctx.fillRect(-4, -20, 8, 16)
  ctx.restore()
}

function loop(now) {
  raf = requestAnimationFrame(loop)
  if (!visible) { last = now; return }
  if (!paused.value) time += ((now - last) / 1000) * speed.value
  last = now
  draw()
}
onMounted(() => {
  if (reduceMotion) { draw(); return }
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
  io.observe(canvas.value)
  raf = requestAnimationFrame((now) => { last = now; loop(now) })
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); io?.disconnect() })
</script>

<template>
  <section id="eau" class="waves">
    <div class="container grid">
      <div class="text">
        <p class="kicker">{{ WAVES.kicker }}</p>
        <h2>{{ WAVES.title }}</h2>
        <p v-for="p in WAVES.paragraphs" :key="p">{{ p }}</p>
        <table class="params">
          <thead><tr><th scope="col">Onde</th><th scope="col">Amplitude</th><th scope="col">Longueur d'onde</th><th scope="col">Pulsation</th><th scope="col">Direction</th></tr></thead>
          <tbody>
            <tr v-for="o in WAVES.ondes" :key="o.name"><th scope="row">{{ o.name }}</th><td>{{ o.amplitude }}</td><td>{{ o.longueurOnde }}</td><td>{{ o.pulsation }}</td><td>({{ o.direction.join(' ; ') }})</td></tr>
          </tbody>
        </table>
      </div>
      <figure class="code">
        <figcaption>Extrait réel de src/engine/vagues.ts</figcaption>
        <pre><code>{{ CODE.waves }}</code></pre>
      </figure>
    </div>
    <div class="container">
      <div class="scope">
        <canvas ref="canvas" role="img" aria-label="Surface de l'eau en coupe : deux ondes et leur somme, avec un bateau qui suit la surface" />
        <div class="controls">
          <label v-for="(o, i) in WAVES.ondes" :key="o.name"><input v-model="active[i]" type="checkbox"> {{ o.name }}</label>
          <label>Vitesse <input v-model.number="speed" type="range" min="0.2" max="2" step="0.1"></label>
          <button type="button" @click="paused = !paused">{{ paused ? 'Reprendre' : 'Pause' }}</button>
        </div>
      </div>
      <p class="note">{{ WAVES.note }}</p>
    </div>
  </section>
</template>

<style scoped>
.waves{padding:96px 0;background:linear-gradient(180deg,#126184,#0B3550);color:#e6f3f7}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:40px;align-items:start;margin-bottom:40px}
.kicker{margin:0 0 14px;color:var(--sun);font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 16px;font:italic 500 clamp(30px,4.4vw,48px)/1.1 var(--serif);color:#fff}
.text p{margin:0 0 12px;color:#cfe6ee}
.params{width:100%;margin-top:18px;border-collapse:collapse;font-size:13px}
.params th,.params td{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.14);text-align:left;font-weight:500}
.params thead th{color:#9fc3d0;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.code{margin:0;overflow:hidden;border-radius:16px;background:rgba(6,30,46,.7);border:1px solid rgba(255,255,255,.12)}
figcaption{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.12);color:#9fc3d0;font-size:12px;letter-spacing:.06em}
pre{margin:0;padding:16px 18px;overflow-x:auto;font:12.5px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.scope{padding:16px;border:1px solid rgba(255,255,255,.16);border-radius:20px;background:rgba(6,30,46,.45)}
canvas{display:block;width:100%;height:240px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,0))}
.controls{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:14px;font-size:14px}
.controls label{display:flex;gap:8px;align-items:center}
.controls button{min-height:40px;padding:0 18px;border:1px solid rgba(255,255,255,.4);border-radius:999px;background:transparent;color:#fff;font:600 14px var(--sans);cursor:pointer}
.note{margin:16px 0 0;color:#9fc3d0;font-size:13px}
</style>
