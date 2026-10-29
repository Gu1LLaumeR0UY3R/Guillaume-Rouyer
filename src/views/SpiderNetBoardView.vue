<script setup>
/**
 * SpiderNet — tableau d'enquête interactif (Vue 3, <script setup>)
 * Port de la maquette "SpiderNet.dc.html" vers un composant Vue autonome.
 *
 * Props :
 *  - backTo : route du bouton « Retour aux projets » (défaut "/projets")
 *
 * Slot :
 *  - decor : pour ajouter tes propres illustrations (SVG) dans le tableau.
 *            Le contenu est placé dans le "monde" 3600 x 2250 px, en position absolute.
 */
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { PROJECTS } from '../data/projects.js'

defineProps({
  backTo: { type: String, default: '/projets' }
})

/* ------------------------------------------------------------------ */
/* Données                                                             */
/* ------------------------------------------------------------------ */
const repo = PROJECTS.find((p) => p.slug === 'spidernet')?.repo

const CW = 290
const CL = { concept: '#f3efe4', socle: '#e4ecf7', valo: '#f7e9e0', tech: '#e6e1f5' }

const ITEMS = [
  { k: 'head', g: 'concept', t: 'Concept', x: 1575, y: 150, w: 300, r: -1 },
  { g: 'concept', tag: 'CONCEPT', t: "L'idée", key: 1, txt: "Une appli où les citoyens signalent un incident urbain avec leur position, et où des héros le vérifient puis le traitent. Clin d'œil à l'appli de Ganke dans les jeux Spider-Man : projet de fan non officiel, sans aucun asset Marvel.", x: 1185, y: 375, r: -2 },
  { g: 'concept', tag: 'CONCEPT', t: 'Pourquoi ce projet', key: 1, txt: "Projet de cours du Bachelor (Symfony, DAO, PostgreSQL) et pièce de portfolio : une application complète et sécurisée, avec du SQL spatial et une architecture propre.", x: 1658, y: 435, r: 1.5 },
  { g: 'concept', tag: 'CONCEPT', t: 'Trois rôles', key: 1, txt: "Citoyen : signale et conteste. Héros : valide, rejette, prend en charge. Admin : tout cela, même sur son propre signalement. Héros et admin ne s'obtiennent que par commande, jamais à l'inscription.", x: 2130, y: 375, r: -1.5 },
  { k: 'head', g: 'socle', t: 'Socle', x: 180, y: 210, w: 300, r: -2 },
  { g: 'socle', tag: 'FAIT', t: 'Comptes et rôles', key: 1, txt: "Inscription, connexion, déconnexion et hiérarchie de rôles avec Symfony Security. Le formulaire d'inscription n'a aucun champ « rôle ».", x: 180, y: 450, r: -1.5 },
  { g: 'socle', tag: 'EN COURS', t: "Cycle de vie d'un incident", key: 1, txt: "Signalé, puis validé, puis résolu. Une fausse alerte clôt le dossier. Chaque changement écrit qui, quand et pourquoi dans un historique, dans la même transaction, avec un verrou de ligne.", x: 705, y: 420, r: 2 },
  { g: 'socle', tag: 'EN COURS', t: 'Alerte géolocalisée', key: 1, txt: "Latitude, longitude, altitude et précision en mètres, stockées avec PostGIS. L'altitude est nullable car les navigateurs la renvoient souvent vide. API et formulaire à venir.", x: 180, y: 855, r: 1.5 },
  { g: 'socle', tag: 'FAIT EN BASE', t: "Types d'incidents", txt: "Incendie, vol, criminalité, autre. Chaque type a sa couleur et son icône, pour ne jamais compter sur la couleur seule.", x: 705, y: 825, r: -2 },
  { g: 'socle', tag: 'À FAIRE', t: 'Carte 2D', txt: "Carte des incidents avec MapLibre GL JS. Les fausses alertes n'y figurent pas et les incidents résolus restent visibles 24 h.", x: 450, y: 1245, r: 1 },
  { k: 'head', g: 'valo', t: 'Valorisation', x: 2745, y: 195, w: 300, r: 2 },
  { g: 'valo', tag: 'EN COURS', t: 'Score de fiabilité', key: 1, txt: "Une alerte validée rapporte +2 à son auteur, une fausse alerte coûte −10, le score reste entre 0 et 100. De quoi freiner les abus.", x: 2640, y: 450, r: 2 },
  { g: 'valo', tag: 'EN COURS', t: 'Contestation communautaire', key: 1, txt: "À 3 signalements distincts, un incident non validé devient fausse alerte. Un incident déjà validé par un héros n'est jamais écrasé par la foule.", x: 3090, y: 630, r: -2 },
  { g: 'valo', tag: 'À FAIRE', t: 'Carte semi-3D', txt: "Tuiles hexagonales, colonnes translucides, panneau par zone et choix d'indicateur : volume, criminalité, incendies, taux de fausses alertes. Prévu avec Deck.gl.", x: 2970, y: 990, web: 1, r: 3 },
  { g: 'valo', tag: 'À FAIRE', t: 'Statistiques et quartiers', txt: "Carte de chaleur par tuile hexagonale et classement des quartiers sensibles grâce à des vues matérialisées.", x: 3060, y: 1365, web: 1, r: -3 },
  { g: 'valo', tag: 'À FAIRE', t: 'Temps réel', txt: "Notifications en direct avec Mercure quand un incident change de statut.", x: 3030, y: 1755, web: 1, r: 2.5 },
  { k: 'head', g: 'tech', t: 'Technique et sécurité', x: 1590, y: 1515, w: 300, r: 1 },
  { g: 'tech', tag: 'STACK', t: 'Le socle technique', key: 1, txt: "Symfony 7.4 LTS, PHP 8.3 et Twig. Accès aux données en PDO avec des DAO, sans ORM : requêtes préparées partout, SQL PostGIS écrit à la main.", x: 900, y: 1755, r: -2 },
  { g: 'tech', tag: 'STACK', t: 'Base spatiale', key: 1, txt: "PostgreSQL 16 et PostGIS 3.4 dans Docker. Position en geography(Point, 4326) avec index GiST, contraintes CHECK sur rôles, statuts et score.", x: 1395, y: 1800, r: 1.5 },
  { g: 'tech', tag: 'SÉCURITÉ', t: 'Défense en couches', key: 1, txt: "Mots de passe hachés, jetons CSRF, message de connexion unique contre l'énumération de comptes, blocage après 5 échecs par e-mail et IP, cookies HttpOnly, en-têtes de sécurité.", x: 1890, y: 1755, r: -1.5 },
  { g: 'tech', tag: 'QUALITÉ ET RGPD', t: 'Tests et données', txt: "41 tests PHPUnit dont 5 sur une vraie base PostGIS. À venir : durée de conservation et anonymisation des positions, donnée personnelle dès qu'elle est liée à un compte.", x: 2385, y: 1800, r: 2 },
  { g: 'concept', tag: 'À DÉCOUVRIR', t: 'Direction artistique', txt: "Interface sombre façon tableau de bord de surveillance. Le rouge et le cyan sont réservés aux données de la carte : incendie rouge, vol orange, fausse alerte violet, criminalité cyan, autre vert.", x: 2160, y: 810, web: 1, r: -2.5 },
  { g: 'socle', tag: 'À DÉCOUVRIR', t: 'Règles métier', txt: "10 signalements par heure au maximum. Un héros ne traite pas son propre signalement. Seul un incident validé peut être pris en charge. Ces règles vivent dans des services, pas dans les DAO ni les contrôleurs.", x: 1080, y: 1320, web: 1, r: 2.5 },
  { g: 'socle', tag: 'À DÉCOUVRIR', t: 'Pièges rencontrés', txt: "En PDO sans émulation des requêtes préparées, un même paramètre nommé ne peut pas apparaître deux fois. Et PostGIS attend la longitude avant la latitude.", x: 60, y: 1605, web: 1, r: -2 },
  { g: 'tech', tag: 'À DÉCOUVRIR', t: 'Architecture en couches', txt: "Model, Dao, Service, Security, Controller : chaque couche a son rôle. Les tests fonctionnels tournent avec de faux DAO en mémoire, les tests d'intégration contre une vraie base PostGIS.", x: 2355, y: 1425, web: 1, r: 2 },
  { tag: 'NOTE', t: 'Projet de démo', txt: 'Ne remplace pas les secours : 112.', x: 90, y: 2055, w: 240, bg: '#ffd0d0', r: 2 }
]

const TOUR = (() => {
  const t = [{ label: 'SpiderNet', main: true, web: null, cx: 1800, cy: 1125, z: 1.0 }]
  ;['concept', 'socle', 'valo', 'tech'].forEach(g =>
    ITEMS.forEach((o, i) => {
      if (o.g === g) {
        const hd = o.k === 'head'
        t.push({
          g: o.g, label: o.t, main: hd, web: o.web ? i : null,
          cx: o.x + (o.w || CW) / 2, cy: hd ? o.y + 26 : o.y + 110, z: hd ? 0.95 : 1.3
        })
      }
    })
  )
  return t
})()

const MENU = [
  ['all', "Vue d'ensemble", 1800, 1125, 0],
  ['concept', 'Concept', 1800, 495, 1.1],
  ['socle', 'Socle', 660, 930, 1.1],
  ['valo', 'Valorisation', 3075, 1275, 1.1],
  ['tech', 'Technique', 1845, 1800, 1.1],
  ['centre', 'SpiderNet', 1800, 1125, 1.1]
]
const MENU_COLOR = { concept: '#f3efe4', socle: '#9db9e8', valo: '#f0b89c', tech: '#b7a9ec' }

// Toiles décoratives en arrière-plan : [centre x, centre y, taille, opacité]
const DECOS = [
  [1800, 1125, 1500, 0.5], [450, 300, 660, 0.2], [2850, 300, 690, 0.2], [2550, 1500, 720, 0.18],
  [900, 1575, 660, 0.17], [3225, 1050, 600, 0.16], [1800, 2070, 660, 0.15]
]

/* ------------------------------------------------------------------ */
/* Générateurs de tracés (éclaboussures et toiles)                     */
/* ------------------------------------------------------------------ */
function splat(cx, cy, r, seed) {
  const n = 9
  const R = k => Math.abs(Math.sin((k + seed * 13) * 12.9898) * 43758.5453) % 1
  const f = v => v.toFixed(1)
  const a = Array.from({ length: n }, (_, k) => (k / n) * 6.283 + (R(k) - 0.5) * 0.5)
  const l = a.map((_, k) => 1 - R(k + 20) * 0.25)
  let d = ''
  a.forEach((t, k) => { d += 'M' + cx + ' ' + cy + 'L' + f(cx + Math.cos(t) * r * l[k]) + ' ' + f(cy + Math.sin(t) * r * 0.8 * l[k]) })
  ;[0.4, 0.7].forEach(q => {
    const pt = a.map((t, k) => [cx + Math.cos(t) * r * q * l[k], cy + Math.sin(t) * r * 0.8 * q * l[k]])
    pt.forEach((u, k) => {
      const o = pt[(k + 1) % n], mx = (u[0] + o[0]) / 2, my = (u[1] + o[1]) / 2
      d += (k === 0 ? 'M' + f(u[0]) + ' ' + f(u[1]) : '') + 'Q' + f(mx + (cx - mx) * 0.2) + ' ' + f(my + (cy - my) * 0.2) + ' ' + f(o[0]) + ' ' + f(o[1])
    })
  })
  return d
}

function webPath(seed) {
  const n = 14
  const rings = [0.09, 0.17, 0.27, 0.39, 0.53, 0.7, 0.9]
  const R = k => Math.abs(Math.sin((k + seed * 17) * 12.9898) * 43758.5453) % 1
  const ang = Array.from({ length: n }, (_, k) => (k / n) * Math.PI * 2 + (R(k) - 0.5) * 0.4)
  const len = ang.map((_, k) => 1 - R(k + 40) * 0.2)
  let d = ''
  ang.forEach((a, k) => { d += 'M100 100L' + (100 + Math.cos(a) * 98 * len[k]).toFixed(1) + ' ' + (100 + Math.sin(a) * 98 * len[k]).toFixed(1) })
  rings.forEach((r, ri) => {
    const pts = ang.map((a, k) => {
      const rr = r * 98 * len[k] * (1 + (R(k * 7 + ri) - 0.5) * 0.16)
      return [100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr]
    })
    pts.forEach((q, k) => {
      const o = pts[(k + 1) % n], mx = (q[0] + o[0]) / 2, my = (q[1] + o[1]) / 2
      d += (k === 0 ? 'M' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) : '') + 'Q' + (mx + (100 - mx) * 0.15).toFixed(1) + ' ' + (my + (100 - my) * 0.15).toFixed(1) + ' ' + o[0].toFixed(1) + ' ' + o[1].toFixed(1)
    })
  })
  return d
}

/* ------------------------------------------------------------------ */
/* État                                                                */
/* ------------------------------------------------------------------ */
const vp = ref(null)
const s = reactive({
  x: (1360 - 3600 * 0.38) / 2,
  y: (800 - 2250 * 0.38) / 2,
  z: 0.38,
  mode: 'free', // 'free' | 'guided'
  step: 0,
  hover: null,
  intro: true,
  anim: false,
  drag: false,
  shot: {}, // cartes « collées » au mur : { [index]: true }
  at: null // bouton du menu actif
})

// État non réactif
let dragData = null
let queue = []
let busy = false
let tStep = null
let tStart = null
let tFit = null

/* ------------------------------------------------------------------ */
/* Logique : déplacement, zoom, visite guidée                          */
/* ------------------------------------------------------------------ */
function upd(nx, ny, nz, fire = true) {
  const el = vp.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const vw = r.width
  const vh = r.height
  nz = Math.max(Math.max(vw / 3600, vh / 2250), Math.min(1.5, nz))
  const W = 3600 * nz
  const H = 2250 * nz
  const x = W <= vw ? (vw - W) / 2 : Math.min(0, Math.max(vw - W, nx))
  const y = H <= vh ? (vh - H) / 2 : Math.min(0, Math.max(vh - H, ny))

  // En exploration libre, les cartes « toile » se collent quand elles entrent à l'écran
  if (fire && !s.intro && s.mode === 'free' && nz >= 0.8) {
    ITEMS.forEach((o, i) => {
      if (o.web && !s.shot[i] && !queue.includes(i)) {
        const sx = x + (o.x + (o.w || CW) / 2) * nz
        const sy = y + (o.y + 100) * nz
        if (sx > 0 && sx < vw && sy > 0 && sy < vh) queue.push(i)
      }
    })
  }
  s.x = x
  s.y = y
  s.z = nz
  pump()
}

function pump() {
  if (busy || !queue.length) return
  const i = queue.shift()
  if (s.shot[i]) { pump(); return }
  busy = true
  s.shot[i] = true
  setTimeout(() => { busy = false; pump() }, ITEMS[i].web ? 1300 : 400)
}

function goStep(k) {
  const el = vp.value
  if (!el) return
  k = Math.max(0, Math.min(TOUR.length - 1, k))
  const t = TOUR[k]
  const r = el.getBoundingClientRect()
  s.anim = true
  s.step = k
  s.hover = null
  nextTick(() => {
    upd(r.width / 2 - t.cx * t.z, r.height / 2 - t.cy * t.z, t.z, false)
    clearTimeout(tStep)
    tStep = setTimeout(() => {
      s.anim = false
      if (t.g) {
        ITEMS.forEach((o, i) => {
          if (o.g === t.g && o.key && !s.shot[i] && !queue.includes(i)) queue.push(i)
        })
      }
      if (t.web != null) queue.push(t.web)
      pump()
    }, 950)
  })
}

function start() {
  s.intro = false
  s.mode = 'free'
  s.anim = true
  nextTick(() => {
    upd(s.x, s.y, s.z, false)
    clearTimeout(tStart)
    tStart = setTimeout(() => { s.anim = false }, 1000)
  })
}

function startGuided() {
  s.intro = false
  s.mode = 'guided'
  nextTick(() => goStep(0))
}

function toGuided() {
  s.intro = false // le bouton du menu doit aussi fermer l'écran d'accueil
  s.mode = 'guided'
  nextTick(() => goStep(s.step))
}

function toFree() {
  s.mode = 'free'
  s.at = null
}

function goMenu([k, , cx, cy, zz]) {
  const el = vp.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const q = zz || 0.01
  s.intro = false
  s.mode = 'free'
  s.anim = true
  s.at = k
  nextTick(() => {
    upd(r.width / 2 - cx * q, r.height / 2 - cy * q, q, false)
    clearTimeout(tStep)
    tStep = setTimeout(() => {
      s.anim = false
      nextTick(() => upd(s.x, s.y, s.z, true))
    }, 1050)
  })
}

/* Glisser pour se déplacer (souris, doigt, stylet) */
function down(e) {
  if (s.intro || s.mode !== 'free') return
  if (e.target.closest && e.target.closest('button, a, nav')) return
  dragData = { sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y }
  s.drag = true
  s.at = null
}
function move(e) {
  if (dragData) upd(dragData.ox + e.clientX - dragData.sx, dragData.oy + e.clientY - dragData.sy, s.z)
}
function up() {
  if (dragData) { dragData = null; s.drag = false }
}

function fit() {
  upd(s.x, s.y, s.intro ? 0.01 : s.z, false)
}

onMounted(() => {
  tFit = setTimeout(fit, 80)
  window.addEventListener('resize', fit)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', fit)
  clearTimeout(tStep)
  clearTimeout(tStart)
  clearTimeout(tFit)
})

/* ------------------------------------------------------------------ */
/* Valeurs calculées pour le rendu                                     */
/* ------------------------------------------------------------------ */
const vpStyle = computed(() =>
  'position:relative;height:100vh;height:100dvh;min-height:620px;overflow:hidden;background:#07080f;user-select:none;touch-action:none;cursor:' +
  (s.intro || s.mode !== 'free' ? 'default' : s.drag ? 'grabbing' : 'grab')
)

const worldStyle = computed(() =>
  'position:absolute;left:0;top:0;width:3600px;height:2250px;transform-origin:0 0;transform:translate(' + s.x + 'px,' + s.y + 'px) scale(' + s.z + ');' +
  'transition:' + (s.anim ? 'transform .9s cubic-bezier(.2,.8,.2,1)' : 'none') + ';' +
  'background:radial-gradient(rgba(255,255,255,.06) 1.5px,transparent 2px) 0 0/36px 36px,radial-gradient(circle at 50% 50%,#1b2036,#0b0d16 70%)'
)

const decos = DECOS.map((q, j) => ({
  d: webPath(j + 1),
  style: 'position:absolute;left:' + (q[0] - q[2] / 2) + 'px;top:' + (q[1] - q[2] / 2) + 'px;width:' + q[2] + 'px;height:' + q[2] + 'px;opacity:' + q[3] + ';pointer-events:none'
}))

const items = computed(() =>
  ITEMS.map((o, i) => {
    const web = !!o.web
    const head = o.k === 'head'
    const on = !(web || o.key) || (o.key && s.mode === 'free') || !!s.shot[i]
    const hidden =
      'perspective(900px) translateZ(650px) rotateX(' + (50 + (i % 3) * 8) + 'deg) rotateY(' + ((i % 2 ? -1 : 1) * (28 + (i % 4) * 6)) + 'deg) rotateZ(' + ((i % 2 ? 1 : -1) * 16) + 'deg)'
    const shown = 'perspective(900px) translateZ(0) rotateX(0) rotateY(0) rotateZ(' + (o.r || 0) + 'deg)'
    return {
      title: o.t,
      tag: o.tag || '',
      text: o.txt || '',
      web,
      head,
      style:
        'position:absolute;left:' + o.x + 'px;top:' + o.y + 'px;width:' + (o.w || CW) + 'px;box-sizing:border-box;padding:' + (head ? '12px 16px' : '22px 16px 14px') +
        ';background:' + (head ? '#f2c230' : (o.bg || CL[o.g])) + ';color:#1b1b1f;' +
        (head ? 'text-align:center;border-top:4px solid #14161c;border-bottom:4px solid #14161c;' : 'border-radius:4px;') +
        'box-shadow:0 12px 24px rgba(0,0,0,.55);opacity:' + (on ? 1 : 0) + ';transform-style:preserve-3d;transform:' + (on ? shown : hidden) +
        ';transition:transform .42s cubic-bezier(.2,1.5,.4,1),opacity .1s',
      fd: head ? 'display:none' : 'opacity:1',
      splat: web ? splat(145, 34, 42, i) + splat(14, 32, 20, i + 3) + splat(276, 32, 20, i + 5) + 'M14 32Q80 66 145 34Q210 66 276 32' : '',
      blob: 'M137 34a8 7 0 1 0 16 0a8 7 0 1 0-16 0M8 32a6 5 0 1 0 12 0a6 5 0 1 0-12 0M270 32a6 5 0 1 0 12 0a6 5 0 1 0-12 0',
      sp:
        'position:absolute;left:0;top:-34px;width:100%;height:80px;overflow:visible;pointer-events:none;transform-origin:50% 34px;transform:scale(' + (on ? 1 : 0) +
        ');transition:transform .16s .32s cubic-bezier(.3,1.8,.5,1);filter:drop-shadow(0 0 4px #9fb4ff)',
      knob:
        head || web
          ? 'display:none'
          : 'position:absolute;top:-8px;left:50%;margin-left:-8px;width:16px;height:16px;border-radius:50%;background:#e23636;box-shadow:0 2px 4px rgba(0,0,0,.5);transform:translateZ(3px) scale(' +
            (on ? 1 : 0) + ');transition:transform .12s .3s cubic-bezier(.3,1.8,.5,1)'
    }
  })
)

const anchor = o => (o.k === 'head' ? [o.x + (o.w || CW) / 2, o.y + 26] : [o.x + (o.w || CW) / 2, o.y])

function mk(a, b, silk, on, dl) {
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1])
  const cx = (a[0] + b[0]) / 2
  const cy = (a[1] + b[1]) / 2 + dist * 0.14 + 24
  const pad = 24
  const x0 = Math.min(a[0], b[0], cx) - pad
  const y0 = Math.min(a[1], b[1], cy) - pad
  const x1 = Math.max(a[0], b[0], cx) + pad
  const y1 = Math.max(a[1], b[1], cy) + pad
  const f = v => v.toFixed(0)
  const B = 'fill:none;stroke-linecap:round;'
  return {
    w: Math.round(x1 - x0),
    h: Math.round(y1 - y0),
    d: 'M' + f(a[0] - x0) + ' ' + f(a[1] - y0) + 'Q' + f(cx - x0) + ' ' + f(cy - y0) + ' ' + f(b[0] - x0) + ' ' + f(b[1] - y0),
    box:
      'position:absolute;left:' + f(x0) + 'px;top:' + f(y0) + 'px;overflow:visible;pointer-events:none;opacity:' + (on ? 1 : 0) + ';transition:opacity .3s ' + dl +
      ';filter:' + (silk ? 'drop-shadow(0 0 5px #9fb4ff)' : 'drop-shadow(0 3px 3px rgba(0,0,0,.5))'),
    p1: B + (silk ? 'stroke:#c3c7d6;stroke-width:14' : 'stroke:#4a1010;stroke-width:9'),
    p2: B + (silk ? 'stroke:#fff;stroke-width:9' : 'stroke:#b3262b;stroke-width:6'),
    p3: B + (silk ? 'stroke:#8d93ab;stroke-width:1.8;stroke-dasharray:2 9' : 'stroke:#ff9a8a;stroke-width:2;stroke-dasharray:5 6'),
    p4: B + (silk ? 'stroke:#e8ecff;stroke-width:1.5;stroke-dasharray:2 9;stroke-dashoffset:5' : 'stroke:#6e1414;stroke-width:2;stroke-dasharray:5 6;stroke-dashoffset:5')
  }
}

const links = computed(() => {
  const out = []
  ITEMS.forEach((o, i) => {
    if (o.k === 'head') {
      out.push(mk([1800, 1125], anchor(o), true, true, '0s'))
    } else if (o.g) {
      const h = ITEMS.find(q => q.k === 'head' && q.g === o.g)
      const on = (!o.web && !o.key) || (o.key && s.mode === 'free') || !!s.shot[i]
      out.push(mk(anchor(h), anchor(o), false, on, o.web || o.key ? '.4s' : '0s'))
    }
  })
  return out
})

const menu = computed(() =>
  MENU.map(m => ({
    key: m[0],
    label: m[1],
    style:
      'font:600 13px var(--font);min-height:40px;padding:0 14px;border-radius:8px;cursor:pointer;color:#f3efe4;border:1px solid ' + (s.at === m[0] ? '#e23636' : '#3a4062') +
      ';border-left:4px solid ' + (MENU_COLOR[m[0]] || '#e23636') + ';background:' + (s.at === m[0] ? '#e23636' : 'rgba(14,16,28,.88)'),
    go: () => goMenu(m)
  }))
)

const bars = computed(() =>
  TOUR.map((t, k) => {
    const on = k === s.step
    const seen = k < s.step
    const h = s.hover === k
    const bh = (t.main ? 30 : 14) + (h ? 8 : 0)
    return {
      key: k,
      name: t.label,
      go: () => goStep(k),
      enter: () => { s.hover = k },
      leave: () => { s.hover = null },
      style: 'position:relative;width:12px;height:48px;padding:0;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer',
      bar: 'display:block;width:' + (h ? 6 : t.main ? 4 : 3) + 'px;height:' + bh + 'px;border-radius:3px;transition:all .15s;background:' + (on ? '#e23636' : seen ? '#c9cbe0' : '#4a5075'),
      pin: 'position:absolute;left:50%;margin-left:-3px;bottom:' + (bh + 4) + 'px;width:6px;height:6px;border-radius:50%;transition:all .15s;transform:scale(' + (h ? 2.2 : 1) + ');background:' + (on || h ? '#e23636' : '#9aa3cf'),
      tip: 'position:absolute;left:50%;bottom:' + (bh + 20) + 'px;transform:translateX(-50%) translateY(' + (h ? 0 : 4) + 'px);white-space:nowrap;font:600 12px var(--font);color:#fff;background:#e23636;padding:3px 8px;border-radius:6px;pointer-events:none;transition:all .15s;opacity:' + (h ? 1 : 0)
    }
  })
)

const stepText = computed(() => 'Étape ' + (s.step + 1) + ' sur ' + TOUR.length + ' · ' + TOUR[s.step].label)
const hint = computed(() => (s.z < 0.8 ? 'Choisis une zone dans le menu pour zoomer dessus' : 'Glisse pour te déplacer'))
</script>

<template>
  <div
    ref="vp"
    class="sn-root"
    :style="vpStyle"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointerleave="up"
    @pointercancel="up"
  >
    <div class="sn-top">
      <RouterLink :to="backTo" class="sn-pillink">← Retour aux projets</RouterLink>
      <a v-if="repo" :href="repo" class="sn-pillink" target="_blank" rel="noopener">Code GitHub ↗</a>
    </div>

    <!-- Exploration libre : menu de zones -->
    <div v-if="s.mode === 'free' && !s.intro" class="sn-dock">
      <div class="sn-pill">{{ hint }}</div>
      <nav class="sn-nav" aria-label="Aller directement à">
        <span class="sn-stripe"></span>
        <button v-for="m in menu" :key="m.key" :style="m.style" @click="m.go">{{ m.label }}</button>
        <button class="sn-guided-btn" @click="toGuided">Visite guidée</button>
      </nav>
    </div>

    <!-- Visite guidée -->
    <template v-if="s.mode === 'guided'">
      <button class="sn-arrow sn-prev" aria-label="Étape précédente" @click="goStep(s.step - 1)">‹</button>
      <button class="sn-arrow sn-next" aria-label="Étape suivante" @click="goStep(s.step + 1)">›</button>
      <div class="sn-guide">
        <div class="sn-pill">{{ stepText }}</div>
        <div class="sn-bars">
          <button
            v-for="b in bars"
            :key="b.key"
            :aria-label="b.name"
            :style="b.style"
            @click="b.go"
            @mouseenter="b.enter"
            @mouseleave="b.leave"
          >
            <span :style="b.tip">{{ b.name }}</span>
            <span :style="b.pin"></span>
            <span :style="b.bar"></span>
          </button>
        </div>
        <button class="sn-free-btn" @click="toFree">Passer en exploration libre</button>
      </div>
    </template>

    <!-- Le « mur » du tableau d'enquête -->
    <div :style="worldStyle">
      <!-- Ton propre décor (illustrations SVG, etc.) : <template #decor> -->
      <slot name="decor" />

      <svg
        v-for="(d, j) in decos"
        :key="'deco' + j"
        viewBox="0 0 200 200"
        aria-hidden="true"
        :style="d.style"
      >
        <g stroke="#9fb4ff" stroke-width="0.9" fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path :d="d.d"></path>
        </g>
      </svg>

      <svg
        v-for="(w, j) in links"
        :key="'link' + j"
        :width="w.w"
        :height="w.h"
        aria-hidden="true"
        :style="w.box"
      >
        <path :d="w.d" :style="w.p1"></path>
        <path :d="w.d" :style="w.p2"></path>
        <path :d="w.d" :style="w.p3"></path>
        <path :d="w.d" :style="w.p4"></path>
      </svg>

      <div class="sn-core">
        <div class="sn-core-title">SpiderNet</div>
        <div class="sn-core-sub">signalement d'incidents pour Spider-Man</div>
      </div>

      <div v-for="(it, idx) in items" :key="'it' + idx" :style="it.style">
        <span class="f3 fb" :style="it.fd"></span>
        <span class="f3 fl" :style="it.fd"></span>
        <span class="f3 fr" :style="it.fd"></span>
        <span class="f3 ft" :style="it.fd"></span>
        <span class="f3 fm" :style="it.fd"></span>
        <span :style="it.knob"></span>
        <svg v-if="it.web" viewBox="0 0 290 80" preserveAspectRatio="none" aria-hidden="true" :style="it.sp">
          <path :d="it.splat" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"></path>
          <path :d="it.blob" fill="#fff"></path>
        </svg>
        <div class="sn-tag">{{ it.tag }}</div>
        <div class="sn-title">{{ it.title }}</div>
        <div class="sn-text">{{ it.text }}</div>
      </div>

      <div class="sn-frame"></div>
      <div class="sn-zone">ZONE SÉCURISÉE · SPIDERNET · NE PAS FRANCHIR</div>
    </div>

    <!-- Écran d'introduction -->
    <div v-if="s.intro" class="sn-intro">
      <div class="sn-radar">
        <span class="ring"></span>
        <span class="ring" style="animation-delay: 0.7s"></span>
        <span class="ring" style="animation-delay: 1.4s"></span>
        <span class="sn-radar-dot"></span>
      </div>
      <div class="sn-intro-btns">
        <button class="sn-btn-main" @click="startGuided">Visite guidée</button>
        <button class="sn-btn-alt" @click="start">Explorer librement</button>
      </div>
      <p class="sn-intro-text">
        Le tableau est plus grand que l'écran. Deux façons de le parcourir : une visite guidée (clique à droite ou à gauche de l'écran pour avancer ou reculer) ou une exploration libre. Certaines infos sont cachées : les toiles les collent au mur, une par une.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Police auto-hébergée (fichier dans src/assets/fonts) : aucun appel à Google Fonts */
@font-face {
  font-family: 'Special Elite';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../assets/fonts/special-elite-latin-400.woff2') format('woff2');
}

.sn-root { margin: 0; }

.sn-top { position: absolute; left: 16px; top: 14px; z-index: 10; display: flex; gap: 8px; flex-wrap: wrap; }
.sn-pillink {
  color: #9fb4ff; text-decoration: none; font: 600 15px var(--font);
  background: rgba(10, 12, 22, 0.88); padding: 6px 14px; border-radius: 999px;
}
.sn-pillink:hover { text-decoration: underline; }

/* Barres de navigation */
.sn-dock, .sn-guide {
  position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%);
  z-index: 6; max-width: 94%;
  display: flex; flex-direction: column; align-items: center;
}
.sn-dock { gap: 6px; pointer-events: none; }
.sn-guide { gap: 8px; }
.sn-pill {
  font: 13px var(--font); color: #9aa3cf;
  background: rgba(10, 12, 22, 0.85); padding: 4px 12px; border-radius: 999px;
}
.sn-nav {
  pointer-events: auto; position: relative; display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
  padding: 12px 10px 8px; background: rgba(10, 12, 22, 0.92);
  border: 1px solid #2a3050; border-radius: 14px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
}
.sn-stripe {
  position: absolute; left: 10px; right: 10px; top: -1px; height: 4px;
  background: repeating-linear-gradient(135deg, #e23636 0 8px, #12141c 8px 16px);
}
.sn-guided-btn {
  font: 600 13px var(--font); min-height: 40px; padding: 0 14px; border-radius: 8px;
  cursor: pointer; color: #fff; background: #e23636; border: 0;
}
.sn-bars {
  display: flex; align-items: flex-end; gap: 4px; padding: 34px 14px 8px;
  background: rgba(10, 12, 22, 0.82); border: 1px solid #2a3050; border-radius: 14px;
}
.sn-free-btn {
  font: 600 12px var(--font); color: #9aa3cf; background: none; border: 0;
  cursor: pointer; text-decoration: underline; min-height: 32px;
}

/* Flèches de la visite guidée */
.sn-arrow {
  position: absolute; top: 56px; bottom: 130px; width: 16%; z-index: 4;
  border: 0; cursor: pointer; color: #f3efe4; font: 300 64px var(--font);
  opacity: 0.55; transition: opacity 0.2s;
}
.sn-arrow:hover { opacity: 1; }
.sn-prev { left: 0; background: linear-gradient(90deg, rgba(226, 54, 54, 0.16), transparent); text-align: left; padding-left: 24px; }
.sn-next { right: 0; background: linear-gradient(270deg, rgba(226, 54, 54, 0.16), transparent); text-align: right; padding-right: 24px; }

/* Titre central */
.sn-core {
  position: absolute; left: 1620px; top: 1047px; width: 360px; box-sizing: border-box;
  padding: 18px 16px; text-align: center; color: #f3efe4; pointer-events: none;
  background: rgba(8, 9, 16, 0.94); border: 2px solid #e23636; border-radius: 20px;
  box-shadow: 0 0 0 6px rgba(226, 54, 54, 0.15), 0 0 40px rgba(226, 54, 54, 0.35);
}
.sn-core-title { font-family: 'Special Elite', serif; font-size: 60px; color: #e23636; line-height: 1; }
.sn-core-sub { font: 15px var(--font); color: #c9cbe0; margin-top: 6px; }

/* Cartes */
.sn-tag { font-family: 'Special Elite', serif; font-size: 12px; color: #b02a2a; letter-spacing: 0.08em; }
.sn-title { font-family: 'Special Elite', serif; font-size: 21px; margin: 4px 0 6px; }
.sn-text { font: 14px/1.5 var(--font); }

/* Épaisseur 3D des cartes */
.f3 { position: absolute; pointer-events: none; background: inherit; filter: brightness(0.7); }
.fb { left: 0; top: 0; width: 100%; height: 100%; transform: translateZ(-7px); filter: brightness(0.55); }
.fl { left: 0; top: 0; width: 7px; height: 100%; transform-origin: left center; transform: rotateY(90deg); }
.fr { left: 100%; top: 0; width: 7px; height: 100%; transform-origin: left center; transform: rotateY(90deg); }
.ft { left: 0; top: 0; width: 100%; height: 7px; transform-origin: center top; transform: rotateX(-90deg); }
.fm { left: 0; top: 100%; width: 100%; height: 7px; transform-origin: center top; transform: rotateX(-90deg); }

/* Cadre et bandeau */
.sn-frame {
  position: absolute; inset: 0; border: 18px solid transparent;
  border-image: repeating-linear-gradient(45deg, #e23636 0 16px, #12141c 16px 32px) 18;
  pointer-events: none;
}
.sn-zone {
  position: absolute; top: 30px; left: 0; right: 0; text-align: center; color: #e23636;
  font: 600 13px var(--font); letter-spacing: 0.5em; pointer-events: none;
}

/* Introduction */
.sn-intro {
  position: absolute; inset: 0; z-index: 5; display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 20px; background: rgba(7, 8, 15, 0.9); text-align: center;
  color: #f3efe4; padding: 24px;
}
.sn-radar { position: relative; width: 150px; height: 150px; }
.sn-radar-dot { position: absolute; left: 62px; top: 62px; width: 26px; height: 26px; border-radius: 50%; background: #e23636; }
.ring { position: absolute; inset: 0; border: 2px solid #e23636; border-radius: 50%; animation: sn-ping 2.2s ease-out infinite; }
@keyframes sn-ping { from { transform: scale(0.2); opacity: 1; } to { transform: scale(1.5); opacity: 0; } }
.sn-intro-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.sn-btn-main {
  font: 600 22px 'Special Elite', serif; background: #e23636; color: #fff; border: 0;
  border-radius: 12px; padding: 0 32px; min-height: 56px; cursor: pointer;
}
.sn-btn-alt {
  font: 600 18px var(--font); background: transparent; color: #f3efe4;
  border: 2px solid #e23636; border-radius: 12px; padding: 0 24px; min-height: 56px; cursor: pointer;
}
.sn-intro-text { max-width: 460px; margin: 0; line-height: 1.6; color: #c9cbe0; font: 16px/1.6 var(--font); }

@media (prefers-reduced-motion: reduce) {
  .ring { animation: none; }
}
</style>
