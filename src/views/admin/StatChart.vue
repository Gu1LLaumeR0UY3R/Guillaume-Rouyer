<script setup>
// Graphique simple en barres ou en camembert, sans bibliothèque (SVG et CSS). Réutilisé pour toutes les statistiques.
// data : [{ label, value, color? }]. `allow` : types proposés ; s'il y en a plusieurs, des boutons permettent de basculer.
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  title: { type: String, required: true },
  allow: { type: Array, default: () => ['bar', 'pie'] },
  initial: { type: String, default: 'bar' },
})
const NAMES = { bar: 'Barres', pie: 'Camembert' }
const COLORS = ['#14532d', '#2fdc78', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6', '#64748b']

const mode = ref(props.allow.includes(props.initial) ? props.initial : props.allow[0])
const rows = computed(() => props.data.map((d, i) => ({ ...d, color: d.color || COLORS[i % COLORS.length] })))
const total = computed(() => rows.value.reduce((a, r) => a + r.value, 0))
const max = computed(() => Math.max(1, ...rows.value.map((r) => r.value)))
const pct = (v) => (total.value ? Math.round((v / total.value) * 100) : 0)

// Parts du camembert : un arc de cercle par valeur non nulle
const slices = computed(() => {
  const R = 80, C = 100
  let a = -Math.PI / 2
  const pt = (ang) => `${(C + R * Math.cos(ang)).toFixed(2)} ${(C + R * Math.sin(ang)).toFixed(2)}`
  return rows.value.filter((r) => r.value > 0).map((r) => {
    const frac = r.value / total.value
    const end = a + frac * Math.PI * 2
    const full = frac >= 0.9999
    const d = full ? '' : `M ${C} ${C} L ${pt(a)} A ${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${pt(end)} Z`
    a = end
    return { ...r, d, full }
  })
})
const summary = computed(() => `${props.title} : ${rows.value.map((r) => `${r.label} ${pct(r.value)} %`).join(', ')}`)
</script>

<template>
  <figure class="chart">
    <figcaption>
      <strong>{{ title }}</strong>
      <span v-if="allow.length > 1" class="modes" role="group" aria-label="Type de graphique">
        <button v-for="m in allow" :key="m" type="button" class="mode" :aria-pressed="mode === m" @click="mode = m">{{ NAMES[m] }}</button>
      </span>
    </figcaption>

    <p v-if="!total" class="empty">Aucune donnée pour le moment.</p>

    <ul v-else-if="mode === 'bar'" class="bars">
      <li v-for="r in rows" :key="r.label">
        <span class="lbl">{{ r.label }}</span>
        <span class="bar"><span class="fill" :style="{ width: (r.value / max) * 100 + '%', background: r.color }" /></span>
        <span class="val">{{ r.value }}</span>
      </li>
    </ul>

    <div v-else class="pie">
      <svg viewBox="0 0 200 200" role="img" :aria-label="summary">
        <template v-for="s in slices" :key="s.label">
          <circle v-if="s.full" cx="100" cy="100" r="80" :fill="s.color" />
          <path v-else :d="s.d" :fill="s.color" stroke="var(--card)" stroke-width="2" />
        </template>
      </svg>
      <ul class="legend">
        <li v-for="r in rows" :key="r.label"><span class="dot" :style="{ background: r.color }" />{{ r.label }} <strong>{{ r.value }}</strong> <span class="pc">({{ pct(r.value) }} %)</span></li>
      </ul>
    </div>
  </figure>
</template>

<style scoped>
.chart{margin:0;padding:18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
figcaption{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;margin-bottom:14px;color:var(--fg)}
.modes{display:inline-flex;gap:4px}
.mode{min-height:32px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);font:inherit;font-size:13px;cursor:pointer}
.mode[aria-pressed='true']{border-color:var(--green);background:var(--green);color:var(--on-green)}
.empty{margin:0;color:var(--muted)}
.bars{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.bars li{display:grid;grid-template-columns:minmax(70px,120px) 1fr 36px;gap:10px;align-items:center;font-size:14px}
.lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar{height:14px;border-radius:7px;background:var(--bg)}
.fill{display:block;height:100%;min-width:2px;border-radius:7px}
.val{text-align:right;font-weight:700}
.pie{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center}
.pie svg{width:150px;height:150px;flex:none}
.legend{display:grid;gap:6px;margin:0;padding:0;list-style:none;font-size:14px}
.dot{display:inline-block;width:12px;height:12px;margin-right:8px;border-radius:3px;vertical-align:-1px}
.pc{color:var(--muted)}
</style>
