<script setup>
// Assistant qualité : contrôles automatiques de l'article en cours de rédaction (titre, résumé, structure, accessibilité…).
import { computed, ref } from 'vue'
import { checkArticle, score } from '../../lib/quality.js'
const props = defineProps({ article: { type: Object, required: true } })
const open = ref(false)
const checks = computed(() => checkArticle(props.article))
const pts = computed(() => score(checks.value))
const todo = computed(() => checks.value.filter((c) => c.level !== 'ok').sort((a, b) => (a.level === 'bad' ? -1 : 1) - (b.level === 'bad' ? -1 : 1)))
const ok = computed(() => checks.value.filter((c) => c.level === 'ok'))
const tone = computed(() => (pts.value >= 80 ? 'good' : pts.value >= 55 ? 'mid' : 'low'))
const ICON = { ok: '✓', warn: '!', bad: '✕' }
</script>

<template>
  <section class="qp" aria-labelledby="qp-t">
    <button type="button" class="head" :aria-expanded="open" aria-controls="qp-body" @click="open = !open">
      <span class="score" :class="tone" aria-hidden="true">{{ pts }}</span>
      <span class="ttl"><b id="qp-t">Assistant qualité</b><small>{{ todo.length ? `${todo.length} point(s) à améliorer` : 'Tout est bon' }}</small></span>
      <svg class="chev" :class="{ open }" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
    </button>
    <div v-show="open" id="qp-body" class="body">
      <p class="hint">Conseils automatiques : ils n'empêchent jamais d'enregistrer ni de publier.</p>
      <ul v-if="todo.length" class="list">
        <li v-for="c in todo" :key="c.id" :class="c.level"><i aria-hidden="true">{{ ICON[c.level] }}</i><span><b>{{ c.label }}</b><small v-if="c.tip">{{ c.tip }}</small></span></li>
      </ul>
      <details v-if="ok.length"><summary>{{ ok.length }} contrôle(s) réussi(s)</summary>
        <ul class="list"><li v-for="c in ok" :key="c.id" class="ok"><i aria-hidden="true">✓</i><span><b>{{ c.label }}</b></span></li></ul>
      </details>
    </div>
  </section>
</template>

<style scoped>
.qp{border:1px solid var(--line);border-radius:14px;background:var(--card);overflow:hidden}
.head{display:flex;align-items:center;gap:14px;width:100%;padding:12px 16px;border:0;background:none;color:var(--fg);font:inherit;text-align:left;cursor:pointer}
.head:focus-visible{outline:3px solid var(--green);outline-offset:-3px}
.score{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;font:700 16px var(--font);color:#fff}
.score.good{background:#2f8f4e}.score.mid{background:#c58a12}.score.low{background:#c0392b}
.ttl{display:grid;flex:1}.ttl small{color:var(--muted)}
.chev{transition:transform .2s}.chev.open{transform:rotate(180deg)}
.body{padding:0 16px 14px}
.list{list-style:none;margin:10px 0;padding:0;display:grid;gap:8px}
.list li{display:flex;gap:10px;align-items:flex-start}
.list i{flex:none;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font:700 13px var(--font);font-style:normal;color:#fff}
.list .ok i{background:#2f8f4e}.list .warn i{background:#c58a12}.list .bad i{background:#c0392b}
.list span{display:grid}.list small{color:var(--muted)}
summary{cursor:pointer;font-weight:600;margin-top:6px}
</style>
