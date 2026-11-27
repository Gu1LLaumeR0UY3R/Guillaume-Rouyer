<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { WAVES } from '../../data/bataille.js'
import { CODE } from '../../data/bataille.code.js'

const canvas = ref(null)
const amplitude = ref(2.5)
const speed = ref(1)
const paused = ref(false)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

// Mêmes ondes que le jeu : vecteur d'onde = (2π / longueur d'onde) × direction normalisée.
const vectors = WAVES.ondes.map((o) => {
  const k = (2 * Math.PI) / o.longueurOnde
  const n = Math.hypot(o.direction[0], o.direction[1])
  return { kx: (k * o.direction[0]) / n, kz: (k * o.direction[1]) / n }
})
const height = (x, z, t) => WAVES.ondes.reduce((s, o, i) => s + o.amplitude * Math.sin(vectors[i].kx * x + vectors[i].kz * z - o.pulsation * t), 0)

const COLS = 34
const ROWS = 14
const BOARD = { c0: 12, r0: 2, size: 10 } // le plateau 10 × 10 au centre de la mer
const DEEP = [11, 53, 80]
const LAGOON = [40, 166, 160]
const FOAM = [216, 246, 242]
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k))
const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`

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

  const shear = 0.45
  const tilt = 0.36
  const cell = Math.min(w / (COLS + ROWS * shear + 1), (h * 0.6) / (ROWS * tilt))
  const px = cell * 9 * amplitude.value
  const ox = (w - (COLS + ROWS * shear) * cell) / 2
  const oy = h * 0.22
  const H = []
  for (let r = 0; r <= ROWS; r++) { H[r] = []; for (let c = 0; c <= COLS; c++) H[r][c] = height(c, r, time) }
  const pt = (c, r, hh) => [ox + c * cell + r * shear * cell, oy + r * tilt * cell - hh * px]

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = pt(c, r, H[r][c]); const b = pt(c + 1, r, H[r][c + 1]); const d = pt(c + 1, r + 1, H[r + 1][c + 1]); const e = pt(c, r + 1, H[r + 1][c])
      const level = (H[r][c] + H[r][c + 1] + H[r + 1][c] + H[r + 1][c + 1]) / 4 / 0.065
      const slope = (H[r][c + 1] - H[r][c] + H[r + 1][c + 1] - H[r + 1][c]) / 0.06
      const light = Math.max(0, Math.min(1, 0.45 + level * 0.3 + slope * 0.18 + (r / ROWS) * 0.18))
      const colour = light < 0.55 ? mix(DEEP, LAGOON, light / 0.55) : mix(LAGOON, FOAM, (light - 0.55) / 0.45)
      ctx.fillStyle = css(colour)
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath(); ctx.fill()
      const inBoard = c >= BOARD.c0 && c < BOARD.c0 + BOARD.size && r >= BOARD.r0 && r < BOARD.r0 + BOARD.size
      if (inBoard) { ctx.strokeStyle = 'rgba(241,229,200,.55)'; ctx.lineWidth = 1; ctx.stroke() }
    }
  }

  // Un bateau et une bouée posés sur la surface : leur hauteur et leur inclinaison viennent de la même fonction.
  const floater = (c, r, draw1) => {
    const [x, y] = pt(c, r, height(c, r, time))
    const slope = ((height(c + 0.5, r, time) - height(c - 0.5, r, time)) * px) / cell
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan(-slope)); draw1(ctx, cell); ctx.restore()
  }
  floater(BOARD.c0 + 5, BOARD.r0 + 5, (g, s) => {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-s * 1.6, -s * 0.2); g.lineTo(s * 1.6, -s * 0.2); g.lineTo(s * 1.1, s * 0.55); g.lineTo(-s * 1.1, s * 0.55); g.closePath(); g.fill()
    g.fillStyle = '#FFBD54'; g.fillRect(-s * 0.35, -s * 0.9, s * 0.7, s * 0.7)
    g.fillStyle = '#e4572e'; g.fillRect(-s * 0.08, -s * 1.5, s * 0.16, s * 0.6)
  })
  floater(BOARD.c0 + 2.5, BOARD.r0 + 7.5, (g, s) => {
    g.fillStyle = '#e4572e'; g.beginPath(); g.arc(0, -s * 0.25, s * 0.38, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#fff'; g.fillRect(-s * 0.38, -s * 0.33, s * 0.76, s * 0.14)
  })
}

function loop(now) {
  raf = requestAnimationFrame(loop)
  if (!visible) { last = now; return }
  if (!paused.value) time += ((now - last) / 1000) * speed.value
  last = now
  draw()
}
onMounted(() => {
  if (reduceMotion) { draw(); window.addEventListener('resize', draw); return }
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
  io.observe(canvas.value)
  raf = requestAnimationFrame((now) => { last = now; loop(now) })
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); io?.disconnect(); window.removeEventListener('resize', draw) })
</script>

<template>
  <section id="eau" class="waves" v-reveal>
    <div class="container grid">
      <div class="text">
        <p class="kicker">{{ WAVES.kicker }}</p>
        <h2>{{ WAVES.title }}</h2>
        <p v-for="p in WAVES.paragraphs" :key="p">{{ p }}</p>
        <details class="params">
          <summary>Paramètres des deux ondes</summary>
          <table>
            <thead><tr><th scope="col">Onde</th><th scope="col">Amplitude</th><th scope="col">Longueur d'onde</th><th scope="col">Pulsation</th><th scope="col">Direction</th></tr></thead>
            <tbody>
              <tr v-for="o in WAVES.ondes" :key="o.name"><th scope="row">{{ o.name }}</th><td>{{ o.amplitude }}</td><td>{{ o.longueurOnde }}</td><td>{{ o.pulsation }}</td><td>({{ o.direction.join(' ; ') }})</td></tr>
            </tbody>
          </table>
        </details>
      </div>
      <figure class="code">
        <figcaption>Extrait réel de src/engine/vagues.ts</figcaption>
        <pre tabindex="0"><code>{{ CODE.waves }}</code></pre>
      </figure>
    </div>
    <div class="container">
      <div class="scope">
        <canvas ref="canvas" role="img" aria-label="Surface de la mer en perspective, avec le plateau 10 par 10, un bateau et une bouée qui suivent les vagues" />
        <div class="controls">
          <label>Amplitude <input v-model.number="amplitude" type="range" min="1" max="5" step="0.25"></label>
          <label>Vitesse <input v-model.number="speed" type="range" min="0.2" max="2.5" step="0.1"></label>
          <button type="button" @click="paused = !paused">{{ paused ? 'Reprendre' : 'Pause' }}</button>
        </div>
      </div>
      <p class="note">{{ WAVES.note }}</p>
    </div>
  </section>
</template>

<style scoped>
.waves{padding:96px 0;background:linear-gradient(180deg,#126184,#0B3550);color:#e6f3f7}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:40px;align-items:start;margin-bottom:40px}
.kicker{margin:0 0 14px;color:var(--sun);font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 16px;font:italic 500 clamp(30px,4.4vw,48px)/1.1 var(--serif);color:#fff}
.text p{margin:0 0 12px;color:#cfe6ee}
.params{margin-top:18px;max-width:100%;overflow-x:auto;font-size:13px}
.params summary{cursor:pointer;color:var(--sun);font-weight:600}
.params table{width:100%;margin-top:10px;border-collapse:collapse}
.params th,.params td{padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.14);text-align:left;font-weight:500}
.params thead th{color:#9fc3d0;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.code{margin:0;overflow:hidden;border-radius:16px;background:rgba(6,30,46,.7);border:1px solid rgba(255,255,255,.12)}
figcaption{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.12);color:#9fc3d0;font-size:12px;letter-spacing:.06em}
pre{margin:0;padding:16px 18px;overflow-x:auto;font:12.5px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.scope{padding:14px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:rgba(6,30,46,.45);box-shadow:0 40px 80px -40px rgba(0,0,0,.6)}
canvas{display:block;width:100%;height:300px;border-radius:14px;background:linear-gradient(180deg,#f3c58a 0%,#e6906a 14%,#2c8cae 34%,#0e5578 100%)}
.controls{display:flex;flex-wrap:wrap;gap:18px;align-items:center;margin-top:14px;font-size:14px}
.controls label{display:flex;gap:10px;align-items:center}
.controls button{min-height:40px;padding:0 18px;border:1px solid rgba(255,255,255,.4);border-radius:999px;background:transparent;color:#fff;font:600 14px var(--sans);cursor:pointer}
.note{margin:16px 0 0;color:#9fc3d0;font-size:13px}
.kicker::after{content:'';display:block;width:42px;height:2px;margin-top:10px;background:currentColor;opacity:.55;transform:scaleX(0);transform-origin:left;transition:transform .8s .25s ease}
.in .kicker::after{transform:scaleX(1)}
@media (prefers-reduced-motion:reduce){.kicker::after{transform:none;transition:none}}
</style>
