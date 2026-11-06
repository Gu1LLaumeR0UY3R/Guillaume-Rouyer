<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { AI } from '../../data/bataille.js'
import { CODE } from '../../data/bataille.code.js'
import { createGame, mulberry32, placeFleet } from '../../lib/navalDemo.js'

const level = ref('hard')
const seed = ref(7)
const running = ref(false)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

const boards = reactive({ easy: [], medium: [], hard: [] })
const stats = reactive({ easy: { shots: 0, done: false }, medium: { shots: 0, done: false }, hard: { shots: 0, done: false } })
const shipCells = ref(new Set())
let games = {}
let timer

function sync() {
  for (const key of Object.keys(games)) {
    boards[key] = [...games[key].cells]
    stats[key].shots = games[key].shots
    stats[key].done = games[key].done
  }
}
function stop() {
  clearInterval(timer)
  running.value = false
}
function setup() {
  stop()
  const ships = placeFleet(mulberry32(seed.value))
  shipCells.value = new Set(ships.flatMap((s) => s.cells))
  games = { easy: createGame('easy', ships, seed.value + 1), medium: createGame('medium', ships, seed.value + 2), hard: createGame('hard', ships, seed.value + 3) }
  sync()
}
function tick() {
  let moved = false
  for (const g of Object.values(games)) if (g.step()) moved = true
  sync()
  if (!moved) stop()
}
function start() {
  if (running.value) return
  if (Object.values(games).every((g) => g.done)) setup()
  running.value = true
  if (reduceMotion) {
    while (running.value) tick()
  } else {
    timer = setInterval(tick, 130)
  }
}
function again() {
  seed.value += 1
  setup()
}
setup()
onBeforeUnmount(stop)

const current = computed(() => AI.levels.find((l) => l.id === level.value))
const summary = computed(() => AI.levels.map((l) => `${l.name} : ${stats[l.id].done ? `flotte coulée en ${stats[l.id].shots} tirs` : `${stats[l.id].shots} tirs`}`).join(' · '))
const cellClass = (key, i) => boards[key][i] || (shipCells.value.has(i) ? 'ship' : '')
</script>

<template>
  <section id="ia" class="ai">
    <div class="container">
      <p class="kicker">{{ AI.kicker }}</p>
      <h2>{{ AI.title }}</h2>
      <p class="intro">{{ AI.text }}</p>

      <div class="tabs" role="tablist" aria-label="Niveau d'IA">
        <button v-for="l in AI.levels" :key="l.id" role="tab" type="button" :aria-selected="level === l.id" :class="{ on: level === l.id }" @click="level = l.id">{{ l.name }}</button>
      </div>
      <div class="detail">
        <div>
          <h3>{{ current.title }}</h3>
          <p>{{ current.principle }}</p>
        </div>
        <figure class="code">
          <figcaption>Extrait réel de src/game/ai.ts</figcaption>
          <pre><code>{{ CODE[level] }}</code></pre>
        </figure>
      </div>

      <div class="demo">
        <div class="controls">
          <button class="go" type="button" @click="start">{{ running ? 'En cours…' : 'Lancer la comparaison' }}</button>
          <button class="ghost" type="button" @click="stop">Pause</button>
          <button class="ghost" type="button" @click="again">Nouvelle grille</button>
        </div>
        <div class="grids">
          <figure v-for="l in AI.levels" :key="l.id">
            <div class="grid" aria-hidden="true"><i v-for="(_, i) in 100" :key="i" :class="cellClass(l.id, i)" /></div>
            <figcaption><strong>{{ l.name }}</strong> <span>{{ stats[l.id].shots }} tirs{{ stats[l.id].done ? ' · terminé' : '' }}</span></figcaption>
          </figure>
        </div>
        <p class="sr" aria-live="polite">{{ summary }}</p>
        <p class="note">{{ AI.note }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ai{padding:96px 0;background:linear-gradient(180deg,#e4f1f1,#f4f1e6)}
.kicker{margin:0 0 14px;color:#1d7a74;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 14px;font:500 clamp(30px,4vw,44px)/1.12 var(--serif);color:var(--deep)}
.intro{max-width:44rem;margin:0 0 32px;color:var(--muted)}
.tabs{display:flex;gap:10px;margin-bottom:24px}
.tabs button{min-height:44px;padding:0 22px;border:1px solid #b9d3d3;border-radius:999px;background:#fff;color:var(--deep);font:600 15px var(--sans);cursor:pointer;transition:background .25s,color .25s,transform .25s}
.tabs button:hover{transform:translateY(-2px)}
.tabs button.on{background:var(--deep);border-color:var(--deep);color:#fff}
.detail{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;align-items:start}
h3{margin:0 0 10px;font:600 24px var(--serif);color:var(--deep)}
.detail p{margin:0;color:var(--muted)}
.code{margin:0;overflow:hidden;border-radius:16px;background:#0B3550;color:#e6f3f7}
figcaption{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.12);color:#9fc3d0;font-size:12px;letter-spacing:.06em}
pre{margin:0;padding:16px 18px;overflow-x:auto;font:12.5px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.demo{margin-top:48px;padding:28px;border:1px solid #cfe0e0;border-radius:22px;background:rgba(255,255,255,.75)}
.controls{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:22px}
.controls button{min-height:44px;padding:0 20px;border-radius:999px;font:600 15px var(--sans);cursor:pointer;transition:transform .25s}
.controls button:hover{transform:translateY(-2px)}
.go{border:0;background:var(--sun);color:#10293a}
.ghost{border:1px solid #b9d3d3;background:#fff;color:var(--deep)}
.grids{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.grids figure{margin:0}
.grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;padding:6px;border-radius:12px;background:#0f6a90}
.grid i{aspect-ratio:1;border-radius:3px;background:rgba(255,255,255,.14);transition:background .2s}
.grid i.ship{background:rgba(241,229,200,.3)}
.grid i.miss{background:rgba(255,255,255,.55);transform:scale(.55);border-radius:50%}
.grid i.hit{background:var(--sun)}
.grid i.sunk{background:#e4572e}
.grids figcaption{display:flex;justify-content:space-between;gap:8px;padding:10px 2px 0;border:0;color:var(--deep);font-size:14px}
.grids figcaption span{color:var(--muted)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.note{margin:18px 0 0;color:var(--muted);font-size:13px}
</style>
