<script setup>
// SEO : note chaque page publique sur 100 et liste ce qu'il faut corriger, par ordre d'intérêt.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { CHECKS, LABELS, grade, inspect, loadSitemap, score } from '../../lib/seoAudit.js'
import './adminForm.css'

const STATIC = [
  ['/', 'Accueil'], ['/projets', 'Projets'], ['/veille', 'Veille'], ['/a-propos', 'À propos'], ['/contact', 'Contact'],
  ['/maintenant', 'Maintenant'], ['/outils', 'Outils'], ['/changelog', 'Changelog'], ['/projets/bataille-navale', 'Bataille Navale'],
  ['/projets/goodnight', 'Goodnight'], ['/mentions-legales', 'Mentions légales'], ['/confidentialite', 'Confidentialité'],
]
const rows = ref([]), running = ref(false), done = ref(0), total = ref(0), error = ref(''), openPath = ref(null), at = ref(null)

const average = computed(() => rows.value.length ? Math.round(rows.value.reduce((a, r) => a + (r.result?.score ?? 0), 0) / rows.value.length) : null)
const worst = computed(() => {
  const m = new Map()
  for (const r of rows.value) for (const t of r.result?.tips ?? []) m.set(t.id, (m.get(t.id) ?? 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, 5)
})

async function pageList() {
  const list = [...STATIC]
  const known = new Set(list.map((p) => p[0]))
  try {
    const d = await fetch('/api/projects').then((r) => r.json())
    for (const p of d.projects ?? []) { const u = `/projets/${p.slug}`; if (p.slug !== 'spidernet' && !known.has(u)) { list.push([u, p.name]); known.add(u) } }
  } catch { /* liste partielle */ }
  try {
    const d = await fetch('/api/veille').then((r) => r.json())
    for (const a of (d.articles ?? []).slice(0, 15)) list.push([`/veille/${a.slug}`, a.title])
  } catch { /* idem */ }
  return list
}

async function run() {
  running.value = true; error.value = ''; openPath.value = null
  try {
    const list = await pageList()
    const sitemap = await loadSitemap()
    total.value = list.length; done.value = 0
    rows.value = list.map(([path, name]) => ({ path, name, page: null, result: null }))
    for (const r of rows.value) { r.page = await inspect(r.path); done.value++ }
    // les critères « unique » se calculent une fois toutes les pages lues
    const count = (k) => { const m = new Map(); for (const r of rows.value) if (r.page[k]) m.set(r.page[k], (m.get(r.page[k]) ?? 0) + 1); return m }
    const ctx = { titles: count('title'), descs: count('description'), sitemap }
    for (const r of rows.value) r.result = r.page.error ? { score: 0, results: [], tips: [{ id: 'error', gain: 0, text: r.page.error }] } : score(r.page, ctx)
    rows.value = [...rows.value].sort((a, b) => a.result.score - b.result.score)
    at.value = new Date()
  } catch (e) { error.value = e.message } finally { running.value = false }
}
onMounted(run)
</script>

<template>
  <div class="page">
    <h1>SEO</h1>
    <p>Chaque page publique est ouverte comme le ferait un moteur de recherche, puis notée sur 100 selon {{ CHECKS.length }} critères (titre, description, titres H1, images, liens, données structurées, vitesse…). Les pages les moins bien notées sont en premier.</p>
    <p class="note">La note est un guide de bonnes pratiques, pas le classement réel dans Google.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <div class="top">
      <div v-if="average !== null && !running" class="avg" :class="grade(average)"><strong>{{ average }}</strong><span>/100 en moyenne</span></div>
      <button class="btn btn-primary" type="button" :disabled="running" @click="run">{{ running ? `Analyse… ${done}/${total}` : 'Relancer l\'analyse' }}</button>
      <span v-if="at" class="muted">Analysé à {{ at.toLocaleTimeString('fr-FR', { timeStyle: 'short' }) }}</span>
    </div>
    <progress v-if="running" :value="done" :max="total || 1" aria-label="Progression de l'analyse"></progress>

    <section v-if="worst.length && !running" class="card">
      <h2>Points à corriger en priorité</h2>
      <ul><li v-for="[id, n] in worst" :key="id">{{ LABELS[id] ?? id }} : {{ n }} page(s) concernée(s)</li></ul>
    </section>

    <ul class="list">
      <li v-for="r in rows" :key="r.path" class="card">
        <button type="button" class="head" :aria-expanded="openPath === r.path" @click="openPath = openPath === r.path ? null : r.path">
          <span class="badge" :class="r.result ? grade(r.result.score) : ''">{{ r.result ? r.result.score : '…' }}</span>
          <span class="nm"><strong>{{ r.name }}</strong><small>{{ r.path }}</small></span>
          <span class="muted">{{ r.result ? (r.result.tips.length ? `${r.result.tips.length} à améliorer` : 'Rien à signaler') : 'Analyse…' }}</span>
        </button>
        <div v-if="openPath === r.path && r.result" class="body">
          <ol v-if="r.result.tips.length" class="tips">
            <li v-for="t in r.result.tips" :key="t.id"><strong v-if="t.gain">+{{ t.gain }} pts</strong> <span class="lbl">{{ LABELS[t.id] ?? 'Erreur' }}</span> {{ t.text }}</li>
          </ol>
          <p v-else>Tous les critères sont validés.</p>
          <details v-if="r.page && !r.page.error">
            <summary>Détail des mesures</summary>
            <p class="meta">Titre : « {{ r.page.title }} » ({{ r.page.title.length }})<br>Description : {{ r.page.description || '—' }} ({{ r.page.description.length }})<br>
              H1 : {{ r.page.h1 }} · mots : {{ r.page.words }} · images : {{ r.page.imgs }} · liens internes : {{ r.page.internal }} · affichage : {{ (r.page.ms / 1000).toFixed(1) }} s</p>
          </details>
          <router-link :to="r.path" class="btn" target="_blank">Ouvrir la page</router-link>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.note,.muted,small{opacity:.7}
.top{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;margin:14px 0}
.avg{display:flex;align-items:baseline;gap:6px}.avg strong{font-size:40px;line-height:1}
.good{color:#1a7f37}.mid{color:#9a6700}.bad{color:#b42318}
progress{width:100%;margin-bottom:12px}
.list{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:10px}
.head{all:unset;box-sizing:border-box;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;width:100%;cursor:pointer}
.head:focus-visible{outline:2px solid currentColor;outline-offset:3px}
.badge{display:grid;place-items:center;min-width:52px;height:52px;border-radius:50%;border:3px solid currentColor;font:700 18px var(--font,inherit)}
.nm{display:grid;flex:1;min-width:160px}
.body{margin-top:12px;border-top:1px solid #8884;padding-top:10px}
.tips{padding-left:20px;display:grid;gap:6px}.lbl{font-weight:600}
.meta{font-size:.9rem;word-break:break-word}
</style>
