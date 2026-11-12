// Moteur de la forêt pixel : dessine tout dans un petit canvas basse résolution
// (1 pixel du canvas = PX pixels à l'écran), agrandi sans lissage pour garder le style pixel art.
import {
  TREE_KINDS, TREE_COLORS, FLOWER_COLORS, FLOWER_SHAPES, makeTree, makeFlower, fromMap, flip, rng, hiveSprite, beeFrames,
  deerFrames, squirrelFrames, owlFrames, birdFrames, butterflyFrames,
} from './sprites.js'
import { skyAt, mixRgb, rgbCss, hexToRgb, hourNow } from './daylight.js'

// Réglages faciles à modifier
export const CONFIG = {
  PX_DESKTOP: 3, PX_MOBILE: 2, // taille d'un pixel à l'écran
  GROUND_TOP: 0.66, // où commence le sol (fraction de la hauteur du hero)
  BASE_MIN: 0.72, BASE_MAX: 0.97, // zone où les troncs peuvent être plantés
  TREE_H: [0.2, 0.38], // hauteur des arbres : loin -> proche (fraction de la hauteur)
  GROW_TIME: 0.75, // durée de la pousse en secondes
}
const KEY = 'er1gon359:foret:v2'

// Emplacements fixes des arbres (x = position horizontale, d = profondeur 0 loin -> 1 proche).
// Chaque emplacement a toujours le même arbre : aucune surprise, la composition est dessinée à l'avance.
const SPOTS = [
  // plan lointain
  { x: 0.05, d: 0.06, k: 'sapin' }, { x: 0.17, d: 0.14, k: 'bouleau' }, { x: 0.29, d: 0.05, k: 'chene' }, { x: 0.42, d: 0.15, k: 'cerisier' },
  { x: 0.55, d: 0.04, k: 'sapin' }, { x: 0.67, d: 0.13, k: 'chene' }, { x: 0.8, d: 0.06, k: 'bouleau' }, { x: 0.93, d: 0.15, k: 'cerisier' },
  // plan moyen
  { x: 0.1, d: 0.42, k: 'chene' }, { x: 0.24, d: 0.55, k: 'cerisier' }, { x: 0.37, d: 0.45, k: 'sapin' }, { x: 0.5, d: 0.58, k: 'bouleau' },
  { x: 0.63, d: 0.44, k: 'cerisier' }, { x: 0.77, d: 0.56, k: 'chene' }, { x: 0.9, d: 0.46, k: 'sapin' },
  // premier plan
  { x: 0.06, d: 0.9, k: 'cerisier' }, { x: 0.3, d: 0.97, k: 'chene' }, { x: 0.54, d: 0.88, k: 'sapin' }, { x: 0.76, d: 0.96, k: 'cerisier' }, { x: 0.95, d: 0.9, k: 'bouleau' },
].map((s, i) => ({ ...s, s: 1000 + i * 7919 }))
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeOutBack = (p) => (p >= 1 ? 1 : 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2)

const imgCache = new WeakMap()
function toCanvas(g) { // grille de couleurs -> petit canvas
  let c = imgCache.get(g)
  if (c) return c
  c = document.createElement('canvas')
  c.width = g.w; c.height = g.h
  const x = c.getContext('2d')
  const id = x.createImageData(g.w, g.h)
  g.d.forEach((col, i) => { if (col) id.data.set([...hexToRgb(col), 255], i * 4) })
  x.putImageData(id, 0, 0)
  imgCache.set(g, c)
  return c
}

// toutes les combinaisons forme x couleur ; un numéro = une fleur
const flowerGrids = Array.from({ length: FLOWER_COLORS.length * FLOWER_SHAPES }, (_, n) => makeFlower(FLOWER_COLORS[n % FLOWER_COLORS.length], Math.floor(n / FLOWER_COLORS.length)))
const deerL = deerFrames.map(flip), squirrelL = squirrelFrames.map(flip)
const butterflyColors = ['#f6b3d1', '#ffd36b', '#9ad1ff', '#ffffff']
const butterflies = butterflyColors.map(butterflyFrames)

function makeCloud(w, r) {
  const h = Math.round(w * 0.3)
  const g = { w, h, d: new Array(w * h).fill(null) }
  const blobs = Array.from({ length: 4 }, (_, i) => ({ x: w * (0.2 + 0.2 * i) + r() * 3, y: h * 0.55, rr: h * (0.35 + r() * 0.3) }))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (y > h - 2) { if (x > 2 && x < w - 3) g.d[y * w + x] = '#dfeaf3'; continue }
    if (blobs.some((b) => (x - b.x) ** 2 + ((y - b.y) * 1.2) ** 2 <= b.rr ** 2)) g.d[y * w + x] = y > h * 0.62 ? '#e4eef6' : '#ffffff'
  }
  return g
}

export function createForest(canvas, host, hooks = {}) {
  const ctx = canvas.getContext('2d')
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  let W = 0, H = 0, PX = 3, t = 0, last = 0, raf = 0, visible = true, lastPlant = -9, skyTimer = 99, isNight = false
  let trees = [], flowers = [], wild = [], fauna = [], parts = [], clouds = [], stars = [], tufts = [], hillA = [], hillB = []
  let sky = skyAt(hourNow())
  const store = { trees: [], total: 0 }
  const rand = Math.random
  const gTop = () => Math.round(H * CONFIG.GROUND_TOP)
  const bMin = () => H * CONFIG.BASE_MIN
  const bMax = () => H * CONFIG.BASE_MAX
  const layerOf = (y) => clamp(Math.floor(((y - bMin()) / (bMax() - bMin())) * 3), 0, 2)

  /* ---------- sauvegarde dans le navigateur du visiteur ---------- */
  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null')
      if (!o || !Array.isArray(o.trees)) return
      store.total = Number.isFinite(o.total) ? Math.max(0, Math.floor(o.total)) : 0
      const seen = new Set()
      store.trees = o.trees
        .filter((r) => r && Number.isInteger(r.i) && r.i >= 0 && r.i < SPOTS.length && !seen.has(r.i) && seen.add(r.i))
        .map((r) => (r.h ? { i: r.i, h: 1 } : { i: r.i }))
    } catch { /* stockage indisponible : on joue sans sauvegarde */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* ignoré */ }
  }

  /* ---------- construction de la scène ---------- */
  function buildTree(rec, animate) {
    const spot = SPOTS[rec.i]
    const baseY = Math.round(bMin() + (bMax() - bMin()) * spot.d)
    const k = 0.85 + 0.3 * ((spot.s % 97) / 97)
    const h = Math.max(16, Math.round(H * lerp(CONFIG.TREE_H[0], CONFIG.TREE_H[1], spot.d) * k))
    const grid = makeTree(spot.k, h, spot.s)
    const e = { type: 'tree', rec, kind: spot.k, grid, img: toCanvas(grid), x: Math.round(spot.x * W), y: baseY, h, born: animate ? t : -9, leaves: !animate, phase: (spot.s % 628) / 100 }
    const r = rng(spot.s + 7)
    e.flowers = Array.from({ length: 7 }, () => ({ type: 'flower', x: e.x + Math.round((r() - 0.5) * 40), y: baseY + Math.round((r() - 0.5) * 5), img: toCanvas(flowerGrids[Math.floor(r() * flowerGrids.length)]), born: animate ? t + 0.35 : -9 }))
    e.hive = !!rec.h && spot.k !== 'sapin' // ruche suspendue à une branche
    return e
  }
  const rebuildFlowers = () => { flowers = trees.flatMap((e) => e.flowers) }

  function rebuild(cssW, cssH) {
    PX = cssW < 640 ? CONFIG.PX_MOBILE : CONFIG.PX_DESKTOP
    W = Math.max(60, Math.ceil(cssW / PX)); H = Math.max(60, Math.ceil(cssH / PX))
    canvas.width = W; canvas.height = H
    ctx.imageSmoothingEnabled = false
    const r = rng(2024)
    trees = store.trees.map((rec) => buildTree(rec, false))
    rebuildFlowers()
    wild = []
    for (let c = 0; c < Math.round(W / 24); c++) { // des touffes de 3 à 6 fleurs
      const cx = r() * W, cy = bMin() + r() * (bMax() - bMin()), n = 3 + Math.floor(r() * 4), g = Math.floor(r() * FLOWER_COLORS.length)
      for (let k = 0; k < n; k++) wild.push({ type: 'flower', x: Math.round(cx + (r() - 0.5) * 22), y: Math.round(cy + (r() - 0.5) * 6), img: toCanvas(flowerGrids[(r() < 0.7 ? g : Math.floor(r() * FLOWER_COLORS.length)) + FLOWER_COLORS.length * Math.floor(r() * FLOWER_SHAPES)]), born: -9 })
    }
    stars = Array.from({ length: Math.round(W / 5) }, () => ({ x: Math.round(r() * W), y: Math.round(r() * gTop() * 0.8), ph: r() * 6, big: r() < 0.12 }))
    clouds = Array.from({ length: 4 }, (_, i) => { const w = 22 + Math.round(r() * 16); return { img: toCanvas(makeCloud(w, r)), x: r() * W, y: 6 + i * (gTop() * 0.16) + r() * 6, v: 1.5 + r() * 2.5 } })
    tufts = Array.from({ length: Math.round(W * 0.55) }, () => { const y = gTop() + r() * (H - gTop()); return { x: Math.round(r() * W), y: Math.round(y), h: 2 + Math.floor(((y - gTop()) / (H - gTop())) * 3), ph: r() * 6, c: r() < 0.5 ? 0 : 1 } })
    hillA = Array.from({ length: W }, (_, x) => Math.round(gTop() - 6 - (Math.sin(x * 0.045 + 1) * 5 + Math.sin(x * 0.017 + 3) * 8 + 10)))
    hillB = Array.from({ length: W }, (_, x) => Math.round(gTop() - 1 - (Math.sin(x * 0.07 + 4) * 3 + Math.sin(x * 0.025) * 5 + 5)))
    fauna = []
    syncFauna()
  }

  /* ---------- animaux : la forêt prend vie quand elle grandit ---------- */
  function want() {
    const n = trees.length
    return {
      butterfly: reduced ? 0 : 1 + Math.min(4, n >> 1),
      bird: reduced ? 0 : 1 + (n >= 8) + (n >= 16),
      squirrel: reduced ? 0 : (n >= 4) + (n >= 12),
      deer: reduced ? 0 : (n >= 7) + (n >= 18),
      owl: reduced ? 0 : (n >= 5) + (n >= 14),
      firefly: reduced ? 0 : 4 + Math.min(12, n),
    }
  }
  function newAnimal(type) {
    const dir = rand() < 0.5 ? -1 : 1
    const a = { type, x: rand() * W, y: Math.round(H * (0.74 + rand() * 0.2)), dir, st: 'walk', timer: 1 + rand() * 3, ph: rand() * 6 }
    if (type === 'bird') { a.y = H * (0.1 + rand() * 0.22); a.by = a.y; a.vx = (7 + rand() * 6) * dir }
    if (type === 'butterfly') { a.c = Math.floor(rand() * butterflies.length); a.tx = rand() * W; a.ty = H * (0.7 + rand() * 0.25); a.y = a.ty }
    if (type === 'firefly') { a.y = H * (0.45 + rand() * 0.5) }
    if (type === 'owl') { a.tree = null; a.blink = 2 + rand() * 4 }
    return a
  }
  let beeSig = ''
  function pickBeeTarget(a) {
    if (a.hive && rand() < 0.45) { a.tx = a.hive.x + Math.round(a.hive.grid.w * 0.2) + (rand() - 0.5) * 22; a.ty = a.hive.y - a.hive.h * 0.45 + (rand() - 0.5) * 14; a.onFlower = false; return }
    const all = [...wild, ...flowers], f = all[Math.floor(rand() * all.length)]
    if (f) { a.tx = f.x + 1; a.ty = f.y - 5; a.onFlower = true }
  }
  function syncBees() { // 2 abeilles sauvages + 3 par ruche
    const hives = trees.filter((e) => e.hive)
    const sig = hives.map((e) => e.rec.i).join(',')
    if (sig === beeSig) return
    beeSig = sig
    fauna = fauna.filter((a) => a.type !== 'bee')
    if (reduced) return
    const owners = [null, null, ...hives.flatMap((h) => [h, h, h])]
    for (const hive of owners) {
      const a = { type: 'bee', hive, x: hive ? hive.x : rand() * W, y: hive ? hive.y - hive.h * 0.45 : H * (0.7 + rand() * 0.2), ph: rand() * 6, pause: 0 }
      pickBeeTarget(a); fauna.push(a)
    }
  }
  function syncFauna() {
    syncBees()
    const w = want()
    for (const type of Object.keys(w)) {
      const mine = fauna.filter((a) => a.type === type)
      for (let i = mine.length; i < w[type]; i++) fauna.push(newAnimal(type))
      for (let i = mine.length; i > w[type]; i--) fauna.splice(fauna.indexOf(mine[i - 1]), 1)
    }
  }

  /* ---------- particules ---------- */
  function burst(x, y, colors, n, o = {}) {
    for (let i = 0; i < n && parts.length < 260; i++) {
      const a = (o.up ? -Math.PI / 2 : rand() * Math.PI * 2) + (rand() - 0.5) * (o.spread ?? 1.6)
      const v = (o.speed ?? 30) * (0.4 + rand() * 0.8)
      parts.push({ x: x + (rand() - 0.5) * (o.w ?? 4), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g ?? 90, life: (o.life ?? 0.7) * (0.6 + rand() * 0.6), max: o.life ?? 0.7, c: colors[Math.floor(rand() * colors.length)], s: o.s ?? 1, sway: o.sway })
    }
  }

  /* ---------- planter ---------- */
  function plantAt(cssX, cssY) {
    if (t - lastPlant < 0.12) return false // anti-spam
    const taken = new Set(store.trees.map((r) => r.i))
    const free = SPOTS.map((_, i) => i).filter((i) => !taken.has(i))
    if (!free.length) return false // le bois est complet
    lastPlant = t
    // On choisit l'emplacement libre le plus proche du clic (clic sur les titres : seule la position horizontale compte)
    const bx = cssX / PX, by = cssY / PX
    const inBand = by >= bMin() - 6
    const baseOf = (i) => bMin() + (bMax() - bMin()) * SPOTS[i].d
    const score = (i) => (SPOTS[i].x * W - bx) ** 2 + (inBand ? ((baseOf(i) - by) * 2) ** 2 : 0)
    const i = free.reduce((a, b) => (score(b) < score(a) ? b : a))
    return plantSpot(i)
  }
  function plantSpot(i) {
    const rec = { i }
    if (SPOTS[i].k !== 'sapin' && rand() < 0.3) rec.h = 1 // 30 % de chance : une ruche pousse sur cet arbre
    const e = buildTree(rec, !reduced)
    trees.push(e); store.trees.push(rec); store.total++
    rebuildFlowers(); save(); syncFauna()
    if (!reduced) {
      burst(e.x, e.y, ['#6b4a32', '#8a6a4a', '#4c9a55', '#a5d6a0'], 16, { up: true, speed: 55, spread: 2 })
      burst(e.x, e.y, ['#d8c9a8', '#c4b38e'], 8, { speed: 22, spread: 0.5, g: 0, life: 0.5, w: 12 }) // poussière
      burst(e.x, e.y - 2, ['#ffffff', '#fff3a0'], 6, { up: true, speed: 40, g: -10, life: 0.9 }) // étincelles
    }
    hooks.onCount?.(trees.length, SPOTS.length); hooks.onPlant?.(store.total)
    return true
  }
  function plantRandom() {
    const taken = new Set(store.trees.map((r) => r.i))
    const free = SPOTS.map((_, i) => i).filter((i) => !taken.has(i))
    if (free.length) plantSpot(free[Math.floor(rand() * free.length)])
  }
  function clear() {
    trees.forEach((e) => burst(e.x, e.y, ['#6b4a32', '#8a6a4a', TREE_COLORS[e.kind]], 4, { up: true }))
    trees = []; store.trees = []; rebuildFlowers(); save(); syncFauna(); hooks.onCount?.(0, SPOTS.length)
  }

  /* ---------- mise à jour ---------- */
  function update(dt) {
    t += dt
    skyTimer += dt
    if (skyTimer > 0.5) {
      skyTimer = 0; sky = skyAt(hourNow())
      const n = sky.dark > 0.3
      if (n !== isNight) { isNight = n; hooks.onNight?.(n) }
    }
    for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 4) c.x = -c.img.width - 4 }
    const dayF = clamp(1 - sky.dark / 0.3, 0, 1), nightF = clamp((sky.dark - 0.3) / 0.25, 0, 1)
    for (const a of fauna) {
      if (a.type === 'deer' || a.type === 'squirrel') {
        const sp = a.type === 'deer' ? 5 : 13
        if (a.st === 'walk') a.x += a.dir * sp * dt
        a.timer -= dt
        if (a.timer < 0) { a.st = a.st === 'walk' ? 'rest' : 'walk'; a.timer = (a.type === 'deer' ? 3 : 1.2) + rand() * 4; if (a.st === 'walk') a.dir = rand() < 0.5 ? -1 : 1 }
        if (a.x < 10) a.dir = 1
        if (a.x > W - 10) a.dir = -1
      } else if (a.type === 'bird') {
        a.x += a.vx * dt; a.y = a.by + Math.sin(t * 1.5 + a.ph) * 3
        if (a.x > W + 10 || a.x < -10) { a.x = a.vx > 0 ? -8 : W + 8; a.by = H * (0.1 + rand() * 0.22) }
      } else if (a.type === 'butterfly') {
        const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy) || 1
        a.x += (dx / d) * 14 * dt + Math.sin(t * 5 + a.ph) * 0.3; a.y += (dy / d) * 14 * dt + Math.cos(t * 4 + a.ph) * 0.3
        if (d < 3) { a.tx = rand() * W; a.ty = H * (0.62 + rand() * 0.3) - rand() * 14 }
      } else if (a.type === 'firefly') {
        a.x += Math.sin(t * 0.6 + a.ph) * 4 * dt; a.y += Math.cos(t * 0.5 + a.ph * 1.3) * 3 * dt
      } else if (a.type === 'bee') {
        if (a.hive && !trees.includes(a.hive)) a.hive = null
        if (a.pause > 0) a.pause -= dt
        else {
          const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy) || 1
          a.x += (dx / d) * 24 * dt + Math.sin(t * 9 + a.ph) * 0.35; a.y += (dy / d) * 24 * dt + Math.cos(t * 8 + a.ph) * 0.35
          if (d < 2) { if (a.onFlower) a.pause = 0.6 + rand() * 1.2; pickBeeTarget(a) }
        }
      } else if (a.type === 'owl') {
        a.blink -= dt
        if (a.blink < -0.15) a.blink = 3 + rand() * 5
        if (!a.tree || !trees.includes(a.tree)) a.tree = trees.length ? trees[Math.floor(rand() * trees.length)] : null
      }
    }
    for (const e of trees) {
      if (!e.leaves && t - e.born > CONFIG.GROW_TIME * 0.6) {
        e.leaves = true
        burst(e.x, e.y - e.h * 0.6, [TREE_COLORS[e.kind], '#ffffff'], 10, { speed: 24, g: 20, life: 1.1 })
      }
      if (e.kind === 'cerisier' && !reduced && rand() < dt * 0.35) // pétales
        burst(e.x + (rand() - 0.5) * e.grid.w * 0.6, e.y - e.h * 0.55, ['#f9c8d9', '#ffffff'], 1, { speed: 4, g: 5, life: 3, sway: true })
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt + (p.sway ? Math.sin(t * 2 + p.x) * 0.15 : 0); p.y += p.vy * dt
      if (p.life <= 0) parts.splice(i, 1)
    }
    return { dayF, nightF }
  }

  /* ---------- dessin ---------- */
  const disk = (cx, cy, r, col) => { ctx.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1) } }
  function drawTree(e) {
    const p = clamp((t - e.born) / CONFIG.GROW_TIME, 0, 1)
    const ease = easeOutBack(p)
    const top = e.y - e.h + Math.round((1 - ease) * e.h) // le sprite sort du sol (avec un petit rebond)
    const sw = Math.round(e.grid.w * 0.5 * clamp(ease, 0, 1))
    ctx.fillStyle = 'rgba(14,38,26,0.22)'
    ctx.fillRect(e.x - sw, e.y, sw * 2, 1); ctx.fillRect(e.x - Math.round(sw * 0.7), e.y + 1, Math.round(sw * 1.4), 1)
    const amp = reduced || p < 1 ? 0 : e.kind === 'sapin' ? 0.9 : 1.5
    for (let by = 0; by < e.h; by += 4) { // tranches de 4 lignes : le haut de l'arbre oscille avec le vent
      const dy = top + by, vis = Math.min(4, e.h - by, e.y - dy)
      if (vis <= 0) continue
      const dx = amp ? Math.round(Math.sin(t * 1.2 + e.phase + by * 0.05) * amp * (1 - by / e.h) ** 1.5) : 0
      ctx.drawImage(e.img, 0, by, e.grid.w, vis, e.x - e.grid.ax + dx, dy, e.grid.w, vis)
    }
    if (e.hive && p >= 1) ctx.drawImage(toCanvas(hiveSprite), e.x + Math.round(e.grid.w * 0.2) - 4, Math.round(e.y - e.h * 0.45) - 4)
  }
  function drawFlower(f) {
    const ease = clamp((t - f.born) / 0.5, 0, 1)
    if (ease <= 0) return
    const h = f.img.height, vis = Math.max(1, Math.round(h * ease))
    ctx.drawImage(f.img, 0, h - vis, f.img.width, vis, f.x - 1, f.y - vis, f.img.width, vis)
  }
  function drawAnimal(a, fx) {
    const T = Math.floor(t * 3)
    if (a.type === 'deer' || a.type === 'squirrel') {
      const set = a.type === 'deer' ? (a.dir > 0 ? deerFrames : deerL) : a.dir > 0 ? squirrelFrames : squirrelL
      const g = set[a.st === 'walk' ? T % 2 : 0]
      const hop = a.type === 'squirrel' && a.st === 'walk' ? -Math.round(Math.abs(Math.sin(t * 9 + a.ph)) * 3) : 0
      ctx.drawImage(toCanvas(g), Math.round(a.x - g.w / 2), Math.round(a.y - g.h + hop))
    } else if (a.type === 'owl' && a.tree) {
      const g = owlFrames[a.blink < 0 ? 1 : 0]
      ctx.drawImage(toCanvas(g), a.tree.x - 5, Math.round(a.tree.y - a.tree.h * 0.5))
    }
  }
  function ground() {
    const gt = gTop(), top = mixRgb(sky.bot, hexToRgb('#b9e0ad'), 0.7), bot = hexToRgb('#5fa96b')
    for (let i = 0; i < 7; i++) {
      const y0 = gt + Math.round(((H - gt) * i) / 7), y1 = gt + Math.round(((H - gt) * (i + 1)) / 7)
      ctx.fillStyle = rgbCss(mixRgb(top, bot, i / 6)); ctx.fillRect(0, y0, W, y1 - y0)
    }
  }

  function draw(f) {
    const gt = gTop()
    const g = ctx.createLinearGradient(0, 0, 0, gt)
    g.addColorStop(0, rgbCss(sky.top)); g.addColorStop(1, rgbCss(sky.bot))
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gt + 1)
    // étoiles
    if (f.nightF > 0) for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${(f.nightF * (0.5 + 0.5 * Math.sin(t * 2 + s.ph))).toFixed(2)})`
      ctx.fillRect(s.x, s.y, 1, 1)
      if (s.big) { ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3) }
    }
    // soleil ou lune (cachés derrière les collines à l'horizon)
    const hr = hourNow()
    if (hr >= 6 && hr <= 18) {
      const p = (hr - 6) / 12, sx = W * (0.1 + 0.8 * p), sy = gt * 0.92 - Math.sin(Math.PI * p) * gt * 0.72
      disk(sx, sy, 11, 'rgba(255,236,160,0.2)'); disk(sx, sy, 9, 'rgba(255,236,160,0.35)'); disk(sx, sy, 6, '#fff2b8')
    } else {
      const p = ((hr - 18 + 24) % 24) / 12, mx = W * (0.1 + 0.8 * p), my = gt * 0.92 - Math.sin(Math.PI * clamp(p, 0, 1)) * gt * 0.7
      disk(mx, my, 6, '#fffbe0'); ctx.fillStyle = '#d9d5b5'
      ctx.fillRect(Math.round(mx) - 3, Math.round(my) - 1, 2, 2); ctx.fillRect(Math.round(mx) + 1, Math.round(my) + 2, 2, 1); ctx.fillRect(Math.round(mx) + 1, Math.round(my) - 3, 1, 2)
    }
    ctx.globalAlpha = 0.9 * (1 - f.nightF * 0.7)
    for (const c of clouds) ctx.drawImage(c.img, Math.round(c.x), Math.round(c.y))
    ctx.globalAlpha = 1
    // collines lointaines
    const hazeA = mixRgb(sky.bot, hexToRgb('#86bf90'), 0.4), hazeB = mixRgb(sky.bot, hexToRgb('#76b684'), 0.62)
    ctx.fillStyle = rgbCss(hazeA); for (let x = 0; x < W; x++) ctx.fillRect(x, hillA[x], 1, gt - hillA[x] + 1)
    ctx.fillStyle = rgbCss(hazeB); for (let x = 0; x < W; x++) ctx.fillRect(x, hillB[x], 1, gt - hillB[x] + 1)
    ground()
    // herbe qui bouge au vent
    for (const u of tufts) {
      const sw = Math.round(Math.sin(t * 1.6 + u.ph + u.x * 0.05))
      ctx.fillStyle = u.c ? '#4f9a5c' : '#9bd896'
      ctx.fillRect(u.x, u.y - u.h + 1, 1, u.h - 1); ctx.fillRect(u.x + (reduced ? 0 : sw), u.y - u.h, 1, 1)
      ctx.fillRect(u.x + 2, u.y - u.h + 2, 1, u.h - 2)
    }
    // décor trié par profondeur : plus c'est loin, plus c'est voilé de brume
    const ents = [...wild, ...flowers, ...trees]
    for (const a of fauna) {
      if ((a.type === 'deer' || a.type === 'squirrel') || (a.type === 'owl' && a.tree && f.nightF > 0.15)) ents.push({ type: 'animal', a, y: a.type === 'owl' ? a.tree.y + 0.5 : a.y })
    }
    ents.sort((p, q) => p.y - q.y)
    let layer = 0
    const haze = [0.28, 0.14]
    const hazeY = gt - H * 0.3
    const mist = (L) => { ctx.fillStyle = rgbCss(sky.bot, haze[L]); const yb = bMin() + ((bMax() - bMin()) * (L + 1)) / 3; ctx.fillRect(0, hazeY, W, yb - hazeY) }
    for (const e of ents) {
      const L = layerOf(e.y)
      while (layer < L) mist(layer++)
      if (e.type === 'tree') drawTree(e)
      else if (e.type === 'flower') drawFlower(e)
      else drawAnimal(e.a, f)
    }
    // oiseaux et papillons : dans le ciel, de jour
    if (f.dayF > 0.05) {
      ctx.globalAlpha = f.dayF
      for (const a of fauna) {
        if (a.type === 'bird') { const g = birdFrames[Math.floor(t * 6) % 2]; ctx.drawImage(toCanvas(g), Math.round(a.x), Math.round(a.y)) }
        if (a.type === 'bee') ctx.drawImage(toCanvas(beeFrames[Math.floor(t * 14 + a.ph) % 2]), Math.round(a.x) - 2, Math.round(a.y) - 1)
        if (a.type === 'butterfly') { const g = butterflies[a.c][Math.floor(t * 7 + a.ph) % 2]; ctx.drawImage(toCanvas(g), Math.round(a.x), Math.round(a.y)) }
      }
      ctx.globalAlpha = 1
    }
    // la nuit : tout s'assombrit
    if (sky.dark > 0) { ctx.fillStyle = `rgba(8,14,56,${(sky.dark * 0.55).toFixed(3)})`; ctx.fillRect(0, 0, W, H) }
    // lumières qui restent allumées la nuit : lucioles, yeux des hiboux
    if (f.nightF > 0.05) {
      for (const a of fauna) {
        if (a.type === 'firefly') {
          const b = 0.5 + 0.5 * Math.sin(t * 2.4 + a.ph * 3)
          ctx.fillStyle = `rgba(232,255,122,${(0.16 * f.nightF * b).toFixed(2)})`; ctx.fillRect(Math.round(a.x) - 1, Math.round(a.y) - 1, 3, 3)
          ctx.fillStyle = `rgba(240,255,150,${(f.nightF * (0.35 + 0.65 * b)).toFixed(2)})`; ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1)
        } else if (a.type === 'owl' && a.tree && a.blink >= 0 && f.nightF > 0.15) {
          ctx.fillStyle = `rgba(255,228,92,${f.nightF.toFixed(2)})`
          const ox = a.tree.x - 5, oy = Math.round(a.tree.y - a.tree.h * 0.5)
          ctx.fillRect(ox + 3, oy + 3, 1, 1); ctx.fillRect(ox + 6, oy + 3, 1, 1)
        }
      }
    }
    // particules (terre, pétales, étincelles)
    for (const p of parts) {
      ctx.globalAlpha = clamp(p.life / (p.max * 0.4), 0, 1)
      ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s)
    }
    ctx.globalAlpha = 1
  }

  /* ---------- boucle et événements ---------- */
  function tick(dt) { draw(update(dt)) }
  function loop(now) {
    raf = requestAnimationFrame(loop)
    if (!visible || document.hidden) { last = now; return }
    if (now - last < (reduced ? 200 : 33)) return
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    tick(dt)
  }
  function onClick(ev) {
    if (ev.target.closest?.('a,button,input,textarea,select,label,[data-no-plant]')) return
    if (window.getSelection?.().toString()) return // on est en train de sélectionner du texte
    const r = canvas.getBoundingClientRect()
    plantAt(ev.clientX - r.left, ev.clientY - r.top)
  }
  let ro, io
  function mount() {
    load()
    const size = () => { const r = host.getBoundingClientRect(); rebuild(r.width, r.height); hooks.onCount?.(trees.length, SPOTS.length) }
    size()
    ro = new ResizeObserver(size); ro.observe(host)
    io = new IntersectionObserver(([en]) => { visible = en.isIntersecting }); io.observe(host)
    host.addEventListener('click', onClick)
    hooks.onNight?.(sky.dark > 0.3); isNight = sky.dark > 0.3
    raf = requestAnimationFrame(loop)
  }
  function destroy() { cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect(); host.removeEventListener('click', onClick) }

  // `rebuild` et `tick` sont exposés pour pouvoir tester le rendu hors navigateur
  return { mount, destroy, plantAt, plantRandom, clear, rebuild, tick, load, get count() { return trees.length }, get size() { return [W, H, PX] } }
}
