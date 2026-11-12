// Générateur de pixel art : renvoie des grilles de couleurs { w, h, d }.
// Aucun canvas ici (pur JS), donc réutilisable et testable partout.

// Petit générateur aléatoire déterministe : même graine = même arbre.
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const newGrid = (w, h) => ({ w, h, d: new Array(w * h).fill(null) })
const put = (g, x, y, c) => {
  if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.d[y * g.w + x] = c
}

// Construit un sprite à partir d'un dessin ASCII ("." = vide) et d'une palette.
export function fromMap(rows, pal) {
  const h = rows.length
  const w = Math.max(...rows.map((s) => s.length))
  const g = newGrid(w, h)
  rows.forEach((s, y) => [...s].forEach((ch, x) => ch !== '.' && pal[ch] && put(g, x, y, pal[ch])))
  return g
}

// Miroir horizontal (pour les animaux qui marchent vers la gauche).
export function flip(g) {
  const o = newGrid(g.w, g.h)
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) o.d[y * g.w + x] = g.d[y * g.w + (g.w - 1 - x)]
  return o
}

/* ------------------------------ ARBRES ------------------------------ */

// Feuillage : [contour, ombre, base, clair, éclat] — Tronc : [contour, ombre, base, clair]
const PAL = {
  chene: { leaf: ['#1b4a2b', '#2e6b3a', '#48954b', '#6fba5d', '#a2e27f'], trunk: ['#2a1a14', '#4a2f22', '#6d4a35', '#8c6a50'] },
  cerisier: { leaf: ['#8c3a63', '#cf6c97', '#f19fbb', '#f9c8d9', '#fff0f5'], trunk: ['#2f1d22', '#4d3238', '#6e4a4c', '#8f6a68'] },
  sapin: { leaf: ['#10362d', '#1d5841', '#2f7a56', '#4f9d6d', '#82c493'], trunk: ['#2a1a14', '#4a2f22', '#6d4a35', '#8c6a50'] },
  bouleau: { leaf: ['#2b5a30', '#4a8944', '#7ab75a', '#a8dc79', '#d5f69c'], trunk: ['#4a4a46', '#b3b3ac', '#e6e6df', '#ffffff'] },
}
export const TREE_KINDS = Object.keys(PAL)
export const TREE_COLORS = { chene: '#6fba5d', cerisier: '#f9c8d9', sapin: '#4f9d6d', bouleau: '#a8dc79' }

function trunk(g, t, cx, y0, y1, tw, r, wiggle = 0, birch = false) {
  for (let y = y0; y <= y1; y++) {
    const off = wiggle ? Math.round(Math.sin(y * 0.33) * wiggle) : 0
    const flare = y >= y1 - 1 ? 1 : 0 // la base s'évase d'un pixel
    const x0 = Math.round(cx - tw / 2) + off - flare
    const x1 = x0 + tw - 1 + flare * 2
    for (let x = x0; x <= x1; x++) {
      let c = t[2]
      if (x === x0) c = t[3]
      else if (x === x1) c = t[1]
      else if (r() < 0.1) c = t[1]
      if (birch && x > x0 && r() < 0.09) c = t[0] // petites marques noires du bouleau
      put(g, x, y, c)
    }
  }
}

// Feuillage en « paquets » : chaque cercle est éclairé depuis le haut-gauche.
function crown(g, leaf, circles, r, blossom) {
  const { w, h } = g
  const tone = new Array(w * h).fill(-1)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = null, bd = 9
      for (const c of circles) {
        const dx = (x + 0.5 - c.x) / c.r, dy = (y + 0.5 - c.y) / (c.ry || c.r)
        const d2 = dx * dx + dy * dy
        if (d2 <= 1 && d2 < bd) { bd = d2; best = { dx, dy } }
      }
      if (!best) continue
      const s = best.dx * -0.55 + best.dy * -0.83
      let t = s > 0.62 ? 4 : s > 0.2 ? 3 : s > -0.3 ? 2 : 1
      if (t > 1 && r() < 0.035) t -= 1
      else if (t < 4 && r() < 0.03) t += 1
      tone[y * w + x] = t
    }
  }
  const has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && tone[y * w + x] >= 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let t = tone[y * w + x]
      if (t < 0) continue
      if (!has(x - 1, y) || !has(x + 1, y) || !has(x, y - 1) || !has(x, y + 1)) t = 0
      let c = leaf[t]
      if (blossom && t >= 2) {
        const q = r()
        if (q < 0.06) c = '#fff7fb'
        else if (q < 0.1) c = '#e0719b'
      }
      put(g, x, y, c)
    }
  }
}

// Sapin : tiers de triangles, plus larges vers le bas.
function pine(g, leaf, r) {
  const { w, h } = g
  const cx = Math.floor(w / 2)
  const n = h > 64 ? 5 : 4
  const th = (h * 0.9) / n * 1.55
  const tone = new Array(w * h).fill(-1)
  for (let k = 0; k < n; k++) {
    const apex = k * ((h * 0.9 - th) / (n - 1))
    const maxHW = (w / 2 - 1) * (0.5 + 0.5 * (k / (n - 1)))
    for (let y = Math.floor(apex); y < Math.min(h, Math.floor(apex + th)); y++) {
      const hw = ((y - apex) / th) * maxHW
      for (let x = Math.ceil(cx - hw - 0.5); x <= Math.floor(cx + hw + 0.5); x++) {
        const rel = (x - cx) / Math.max(1, hw)
        let t = rel < -0.25 ? 3 : rel > 0.35 ? 1 : 2
        if (y >= apex + th - 2) t = 1
        if (t > 1 && r() < 0.07) t -= 1
        if (rel < -0.6 && r() < 0.25) t = 4
        tone[y * w + x] = t
      }
    }
  }
  const has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && tone[y * w + x] >= 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let t = tone[y * w + x]
    if (t < 0) continue
    if (!has(x - 1, y) || !has(x + 1, y) || !has(x, y - 1) || !has(x, y + 1)) t = 0
    put(g, x, y, leaf[t])
  }
}

// h = hauteur en pixels du sprite, seed = graine (même graine = même arbre).
export function makeTree(kind, h, seed) {
  const r = rng(seed)
  const { leaf, trunk: tr } = PAL[kind]
  const w = kind === 'sapin' ? Math.round(h * 0.58) : kind === 'bouleau' ? Math.round(h * 0.64) : Math.round(h * 0.98)
  const g = newGrid(w, h)
  const cx = Math.floor(w / 2)
  const tw = Math.max(2, Math.round(h * (kind === 'bouleau' ? 0.055 : 0.085)))
  const R = h * 0.3
  if (kind === 'sapin') {
    trunk(g, tr, cx, Math.round(h * 0.82), h - 1, tw, r)
    pine(g, leaf, r)
  } else if (kind === 'bouleau') {
    trunk(g, tr, cx, Math.round(h * 0.3), h - 1, tw, r, 1, true)
    const rr = h * 0.2
    crown(g, leaf, [
      { x: cx, y: h * 0.2, r: rr }, { x: cx - rr * 0.7, y: h * 0.34, r: rr * 0.8 },
      { x: cx + rr * 0.7, y: h * 0.32, r: rr * 0.85 }, { x: cx, y: h * 0.42, r: rr * 0.7 },
    ], r)
  } else if (kind === 'cerisier') {
    trunk(g, tr, cx, Math.round(h * 0.5), h - 1, tw, r, 1.2)
    crown(g, leaf, [
      { x: cx, y: h * 0.34, r: R * 1.05, ry: R * 0.85 }, { x: cx - R * 1.05, y: h * 0.46, r: R * 0.8, ry: R * 0.62 },
      { x: cx + R * 1.05, y: h * 0.44, r: R * 0.85, ry: R * 0.64 }, { x: cx - R * 0.35, y: h * 0.18, r: R * 0.7, ry: R * 0.55 },
      { x: cx + R * 0.5, y: h * 0.2, r: R * 0.7, ry: R * 0.55 },
    ], r, true)
  } else {
    trunk(g, tr, cx, Math.round(h * 0.45), h - 1, tw, r, 0.8)
    crown(g, leaf, [
      { x: cx, y: h * 0.34, r: R * 1.05 }, { x: cx - R * 0.85, y: h * 0.46, r: R * 0.74 },
      { x: cx + R * 0.85, y: h * 0.44, r: R * 0.78 }, { x: cx + R * 0.1, y: h * 0.18, r: R * 0.7 },
      { x: cx, y: h * 0.54, r: R * 0.7 },
    ], r)
  }
  return { ...g, ax: cx }
}

/* ----------------------------- FLEURS ------------------------------ */

export const FLOWER_COLORS = ['#ffffff', '#ff8fb1', '#ffd54a', '#9ec5ff', '#c9a0ff']
export function makeFlower(color) {
  return fromMap(
    ['.p.', 'pyp', '.p.', '.g.', 'gg.', '.g.'],
    { p: color, y: color === '#ffd54a' ? '#ff9f1c' : '#ffd54a', g: '#4c9a55' },
  )
}

/* ----------------------------- ANIMAUX ----------------------------- */

const DEER = { o: '#4a2e1c', b: '#9a6234', l: '#c28a50', w: '#f0e0c8', a: '#e3d3a8', k: '#101010', n: '#2a1a12' }
export const deerFrames = [
  fromMap([
    '............a.a.', '............aaa.', '...........bbbb.', '...........bbkbn', '...........bbbb.',
    '..........bbb...', '..bbbbbbbbbb....', '.wbbbbbbbbbbl...', '..bllbbbbblb....', '..bwwwwwwwb.....',
    '..b.b....b.b....', '..b.b....b.b....', '..o.o....o.o....',
  ], DEER),
  fromMap([
    '............a.a.', '............aaa.', '...........bbbb.', '...........bbkbn', '...........bbbb.',
    '..........bbb...', '..bbbbbbbbbb....', '.wbbbbbbbbbbl...', '..bllbbbbblb....', '..bwwwwwwwb.....',
    '...bb...bb.b....', '...b.b..b..b....', '...o.o..o..o....',
  ], DEER),
]

const SQ = { o: '#3b2314', b: '#b5622e', l: '#da8d4c', w: '#f3dcc0', k: '#101010', n: '#2a1a12' }
export const squirrelFrames = [
  fromMap([
    '.bb.........', 'blllb.......', 'bllb....bb..', 'bllb...bbbb.', '.blb..bbbkn.',
    '..bbbbbbbbb.', '..bbbbbbww..', '...bbbbbbw..', '...bb..bb...', '...o....o...',
  ], SQ),
  fromMap([
    '.bb.........', 'blllb.......', 'bllb....bb..', 'bllb...bbbb.', '.blb..bbbkn.',
    '..bbbbbbbbb.', '..bbbbbbww..', '...bbbbbbw..', '..bb....bb..', '..o......o..',
  ], SQ),
]

const OWL = { o: '#3a2a1e', b: '#8a6a4a', l: '#a98763', w: '#ecdfc0', y: '#f2c230', k: '#101010', e: '#d98b2b' }
export const owlFrames = [
  fromMap([
    '.oo....oo.', '.obbbbbbo.', 'obwwbbwwbo', 'obwkwwkwbo', 'obwwweewbo', '.obbbbbbo.',
    'oblbbbblbo', 'oblbbbblbo', '.obbbbbbo.', '..oeeeeo..',
  ], OWL), // yeux ouverts
  fromMap([
    '.oo....oo.', '.obbbbbbo.', 'obwwbbwwbo', 'obwoowwoo.'.replace('.', 'o'), 'obwwweewbo', '.obbbbbbo.',
    'oblbbbblbo', 'oblbbbblbo', '.obbbbbbo.', '..oeeeeo..',
  ], OWL), // clin d'œil
]

const BIRD = { o: '#34415f' }
export const birdFrames = [
  fromMap(['o.....o', '.o...o.', '..ooo..'], BIRD),
  fromMap(['..ooo..', '.o...o.', 'o.....o'], BIRD),
]

export function butterflyFrames(c) {
  const p = { b: c, k: '#2a2a3a' }
  return [fromMap(['bb.bb', 'bbkbb', '.b.b.'], p), fromMap(['..k..', '.bkb.', '..k..'], p)]
}
