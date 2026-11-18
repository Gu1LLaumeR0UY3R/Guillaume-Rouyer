<script setup>
// Graphique en barres ou en anneau, sans bibliothèque (SVG et CSS). Réutilisé pour toutes les statistiques.
// data : [{ label, value, color? }]. `allow` : types proposés ; s'il y en a plusieurs, des boutons permettent de basculer.
// Survol (souris ou clavier) : l'élément visé ressort, les autres s'estompent, le détail s'affiche (nom, valeur, %).
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  title: { type: String, required: true },
  allow: { type: Array, default: () => ['bar', 'pie'] },
  initial: { type: String, default: 'bar' },
  unit: { type: String, default: '' }, // ex. « projets » : affiché après la valeur
  single: Boolean, // une seule couleur pour toutes les barres (évolution dans le temps)
})
const NAMES = { bar: 'Barres', pie: 'Camembert', line: 'Courbe' }
const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#64748b']

const mode = ref(props.allow.includes(props.initial) ? props.initial : props.allow[0])
const active = ref(-1)
const rows = computed(() => props.data.map((d, i) => ({ ...d, i, color: d.color || (props.single ? 'var(--green)' : COLORS[i % COLORS.length]) })))
const total = computed(() => rows.value.reduce((a, r) => a + r.value, 0))
const max = computed(() => Math.max(1, ...rows.value.map((r) => r.value)))
const pct = (v) => (total.value ? Math.round((v / total.value) * 100) : 0)
const detail = (r) => `${r.value}${props.unit ? ` ${props.unit}` : ''} · ${pct(r.value)} %`
const cur = computed(() => rows.value[active.value])

// Anneau : un arc par valeur non nulle. `dx`/`dy` = direction de sortie de la part au survol.
const slices = computed(() => {
  const R = 84, r = 54, C = 100
  let a = -Math.PI / 2
  const pt = (rad, ang) => `${(C + rad * Math.cos(ang)).toFixed(2)} ${(C + rad * Math.sin(ang)).toFixed(2)}`
  return rows.value.filter((x) => x.value > 0).map((x) => {
    const frac = Math.min(x.value / total.value, 0.9999)
    const end = a + frac * Math.PI * 2, mid = (a + end) / 2, big = frac > 0.5 ? 1 : 0
    const d = `M ${pt(R, a)} A ${R} ${R} 0 ${big} 1 ${pt(R, end)} L ${pt(r, end)} A ${r} ${r} 0 ${big} 0 ${pt(r, a)} Z`
    a = end
    return { ...x, d, dx: Math.cos(mid) * 7, dy: Math.sin(mid) * 7 }
  })
})
// Courbe : points répartis sur la largeur, valeur la plus haute arrondie vers le haut pour laisser de l'air.
const W = 600, H = 220, PAD = { l: 34, r: 14, t: 14, b: 26 }
const top = computed(() => { const m = max.value; const p = 10 ** Math.floor(Math.log10(Math.max(m, 1))); return Math.max(1, Math.ceil(m / p * 2) / 2 * p) })
const pts = computed(() => rows.value.map((r, i) => ({
  ...r,
  x: PAD.l + (rows.value.length > 1 ? (i / (rows.value.length - 1)) * (W - PAD.l - PAD.r) : (W - PAD.l - PAD.r) / 2),
  y: PAD.t + (1 - r.value / top.value) * (H - PAD.t - PAD.b),
})))
const linePath = computed(() => pts.value.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '))
const areaPath = computed(() => (pts.value.length ? `${linePath.value} L ${pts.value.at(-1).x.toFixed(1)} ${H - PAD.b} L ${pts.value[0].x.toFixed(1)} ${H - PAD.b} Z` : ''))
const ticks = computed(() => [0, 0.5, 1].map((k) => ({ v: Math.round(top.value * k * 10) / 10, y: PAD.t + (1 - k) * (H - PAD.t - PAD.b) })))
const xLabels = computed(() => { const n = pts.value.length, step = Math.max(1, Math.ceil(n / 6)); return pts.value.filter((_, i) => i % step === 0 || i === n - 1) })
const tipLeft = computed(() => (cur.value ? `${(pts.value[active.value].x / W) * 100}%` : '0'))
const on = (i) => { active.value = i }
const off = () => { active.value = -1 }
</script>

<template>
  <figure class="chart">
    <figcaption>
      <strong>{{ title }}</strong>
      <span v-if="allow.length > 1" class="modes" role="group" aria-label="Type de graphique">
        <button v-for="m in allow" :key="m" type="button" class="mode" :aria-pressed="mode === m" @click="mode = m; off()">{{ NAMES[m] }}</button>
      </span>
    </figcaption>

    <p v-if="!total" class="empty">Aucune donnée pour le moment.</p>

    <div v-else-if="mode === 'line'" class="line" :class="{ dimming: active >= 0 }" @mouseleave="off">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="title">
        <g class="grid"><template v-for="t in ticks" :key="t.y"><line :x1="PAD.l" :x2="W - PAD.r" :y1="t.y" :y2="t.y" /><text :x="PAD.l - 6" :y="t.y + 4" text-anchor="end">{{ t.v }}</text></template></g>
        <path class="area" :d="areaPath" />
        <path class="ln" :d="linePath" />
        <line v-if="cur" class="guide" :x1="pts[active].x" :x2="pts[active].x" :y1="PAD.t" :y2="H - PAD.b" />
        <circle v-for="p in pts" :key="p.i" class="pt" :class="{ on: active === p.i }" :cx="p.x" :cy="p.y" :r="active === p.i ? 5.5 : 3" />
        <text v-for="p in xLabels" :key="'x' + p.i" class="xl" :x="p.x" :y="H - 6" text-anchor="middle">{{ p.label }}</text>
        <rect v-for="(p, i) in pts" :key="'h' + p.i" class="hit" :x="p.x - (W - PAD.l - PAD.r) / Math.max(pts.length - 1, 1) / 2" :y="0" :width="(W - PAD.l - PAD.r) / Math.max(pts.length - 1, 1)" :height="H" tabindex="0" @mouseenter="on(p.i)" @focus="on(p.i)" @blur="off" />
      </svg>
      <span v-if="cur" class="tip line-tip" role="tooltip" :style="{ left: `clamp(70px, ${tipLeft}, calc(100% - 70px))` }"><strong>{{ cur.label }}</strong>{{ detail(cur) }}</span>
    </div>

    <ul v-else-if="mode === 'bar'" class="bars" :class="{ dimming: active >= 0 }" @mouseleave="off">
      <li v-for="r in rows" :key="r.label" :class="{ on: active === r.i }" tabindex="0" @mouseenter="on(r.i)" @focus="on(r.i)" @blur="off">
        <span class="lbl">{{ r.label }}</span>
        <span class="bar">
          <span class="fill" :style="{ width: (r.value / max) * 100 + '%', background: r.color, '--i': r.i }" />
          <span class="tip" role="tooltip" :style="{ left: `clamp(60px, ${(r.value / max) * 100}%, calc(100% - 60px))` }"><strong>{{ r.label }}</strong>{{ detail(r) }}</span>
        </span>
        <span class="val">{{ r.value }}</span>
      </li>
    </ul>

    <div v-else class="pie" :class="{ dimming: active >= 0 }">
      <svg viewBox="0 0 200 200" aria-hidden="true" @mouseleave="off">
        <g v-for="s in slices" :key="s.label" class="slice" :class="{ on: active === s.i }" :style="{ transform: active === s.i ? `translate(${s.dx}px, ${s.dy}px)` : 'none' }" @mouseenter="on(s.i)">
          <path :d="s.d" :fill="s.color" stroke="var(--card)" stroke-width="2" :style="{ '--i': s.i }" />
        </g>
        <g class="center" text-anchor="middle" fill="currentColor">
          <template v-if="cur">
            <text x="100" y="86" class="c-label">{{ cur.label.length > 18 ? `${cur.label.slice(0, 17)}…` : cur.label }}</text>
            <text x="100" y="108" class="c-big">{{ pct(cur.value) }} %</text>
            <text x="100" y="128" class="c-small">{{ detail(cur).split(' · ')[0] }}</text>
          </template>
          <template v-else>
            <text x="100" y="98" class="c-big">{{ total }}</text>
            <text x="100" y="120" class="c-small">au total</text>
          </template>
        </g>
      </svg>
      <ul class="legend" @mouseleave="off">
        <li v-for="r in rows" :key="r.label" :class="{ on: active === r.i }" tabindex="0" @mouseenter="on(r.i)" @focus="on(r.i)" @blur="off">
          <span class="dot" :style="{ background: r.color }" />{{ r.label }} <strong>{{ r.value }}</strong> <span class="pc">({{ pct(r.value) }} %)</span>
        </li>
      </ul>
    </div>
  </figure>
</template>

<style scoped>
.chart{height:100%;margin:0;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:box-shadow .25s,border-color .25s}
.chart:hover{border-color:var(--green);box-shadow:0 14px 30px -20px var(--glow)}
figcaption{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;min-height:34px;margin-bottom:16px;color:var(--fg);font-size:17px}
.modes{display:inline-flex;gap:4px}
.mode{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);font:600 13px/1 var(--font);cursor:pointer;transition:background .2s,color .2s,border-color .2s,transform .15s}
.mode:hover{border-color:var(--green);transform:translateY(-1px)}
.mode[aria-pressed='true']{border-color:var(--green);background:var(--green);color:var(--on-green)}
.empty{margin:0;color:var(--muted)}

/* Barres */
.bars{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.bars li{position:relative;display:grid;grid-template-columns:minmax(70px,110px) 1fr 40px;gap:12px;align-items:center;min-height:38px;padding:0 8px;margin:0 -8px;border-radius:10px;font-size:14px;outline-offset:0;transition:opacity .2s,background .2s}
.bars.dimming li:not(.on){opacity:.35}
.bars li.on{background:color-mix(in srgb, var(--green) 9%, transparent)}
.lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar{position:relative;display:block;height:16px;border-radius:8px;background:var(--bg)}
.fill{display:block;height:100%;min-width:3px;border-radius:8px;transform-origin:left;animation:grow .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 70ms);transition:filter .2s}
li.on .fill{filter:brightness(1.12) saturate(1.2)}
.val{display:flex;align-items:center;justify-content:flex-end;font-weight:700;font-variant-numeric:tabular-nums}
.tip{position:absolute;bottom:calc(100% + 10px);z-index:5;display:grid;gap:1px;min-width:max-content;padding:7px 12px;border-radius:10px;background:var(--deep);color:#f3fbf5;font-size:13px;line-height:1.35;text-align:center;white-space:nowrap;pointer-events:none;opacity:0;transform:translate(-50%,6px);transition:opacity .18s,transform .18s;box-shadow:0 10px 24px -10px rgba(0,0,0,.6)}
.tip::after{content:'';position:absolute;top:100%;left:50%;margin-left:-5px;border:5px solid transparent;border-top-color:var(--deep)}
li.on .tip{opacity:1;transform:translate(-50%,0)}

/* Anneau */
.pie{display:flex;flex-wrap:wrap;gap:16px 28px;align-items:center;justify-content:center}
.pie svg{width:190px;height:190px;flex:none;overflow:visible}
.slice{cursor:pointer;transition:opacity .2s,transform .22s cubic-bezier(.2,.8,.2,1)}
.pie.dimming .slice:not(.on){opacity:.3}
.slice path{transform-origin:100px 100px;animation:pop .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 80ms);transition:filter .2s}
.slice.on path{filter:drop-shadow(0 4px 8px rgba(0,0,0,.28))}
.center{pointer-events:none;color:var(--fg)}
.c-label{font:600 12px var(--font);fill:var(--muted)}
.c-big{font:600 26px var(--serif)}
.c-small{font:500 12px var(--font);fill:var(--muted)}
.legend{display:grid;gap:4px;margin:0;padding:0;list-style:none;font-size:14px}
.legend li{display:flex;align-items:center;gap:8px;min-height:32px;padding:0 10px;margin:0 -10px;border-radius:8px;cursor:default;outline-offset:0;transition:opacity .2s,background .2s}
.pie.dimming .legend li:not(.on){opacity:.35}
.legend li.on{background:color-mix(in srgb, var(--green) 9%, transparent)}
.dot{flex:none;width:12px;height:12px;border-radius:3px}
.pc{color:var(--muted)}

/* Courbe */
.line{position:relative}
.line svg{display:block;width:100%;height:auto;overflow:visible}
.grid line{stroke:var(--line);stroke-dasharray:3 4}
.grid text,.xl{fill:var(--muted);font:500 11px var(--font)}
.area{fill:color-mix(in srgb,var(--green) 14%,transparent);animation:fadein .8s ease both}
.ln{fill:none;stroke:var(--green);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1400;stroke-dashoffset:0;animation:draw 1.1s cubic-bezier(.2,.8,.2,1) both}
.pt{fill:var(--card);stroke:var(--green);stroke-width:2;transition:r .15s}
.pt.on{fill:var(--green)}
.guide{stroke:var(--green);stroke-opacity:.35;stroke-dasharray:3 3}
.hit{fill:transparent;outline:0}
.line-tip{top:0;bottom:auto;opacity:1;transform:translate(-50%,-4px)}
.line-tip::after{display:none}
@keyframes draw{from{stroke-dashoffset:1400}}
@keyframes fadein{from{opacity:0}}
@keyframes grow{from{transform:scaleX(0)}}
@keyframes pop{from{opacity:0;transform:scale(.6) rotate(-25deg)}}
@media (prefers-reduced-motion:reduce){.fill,.slice path,.ln,.area{animation:none}.slice,.tip,.chart,li{transition:none}}
</style>
