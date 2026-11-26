<script setup>
// Démo 6 : analyse des en-têtes HTTP de sécurité. Ce site se teste lui-même dans le navigateur ; un autre domaine passe par l'API.
import { ref } from 'vue'
import { analyzeHeaders } from '../../lib/cyber/headers.js'

const target = ref('')
const busy = ref(false)
const error = ref('')
const report = ref(null) // { source, status, finalUrl, redirects, headers, grade, pct, checks }
const ICON = { ok: '✓', warn: '!', bad: '✗', info: 'i' }
const LABEL = { ok: 'Bon', warn: 'À améliorer', bad: 'Manquant', info: 'Info' }

function show(source, data, cookies) {
  const a = analyzeHeaders(data.headers, cookies)
  report.value = { source, status: data.status, finalUrl: data.url, redirects: data.redirects ?? [], headers: data.headers, ...a }
}

// Ce site : une requête vers soi-même est autorisée par la CSP (connect-src 'self') et les en-têtes sont lisibles
async function analyzeSelf() {
  error.value = ''; busy.value = true
  try {
    const r = await fetch('/', { cache: 'no-store' })
    const headers = {}
    r.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
    show('Ce site', { headers, status: r.status, url: location.origin + '/' }, [])
  } catch { error.value = "Impossible de lire les en-têtes de ce site." } finally { busy.value = false }
}

// Autre domaine : l'API serveur contacte le site (le navigateur ne peut pas lire ses en-têtes : CORS)
async function analyzeRemote() {
  error.value = ''; busy.value = true
  try {
    const r = await fetch(`/api/cyber/headers?url=${encodeURIComponent(target.value.trim())}`, { headers: { Accept: 'application/json' } })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Analyse impossible.')
    show(new URL(d.url).hostname, d, d.cookies)
  } catch (e) { error.value = e.message === 'Failed to fetch' ? 'Analyse impossible pour le moment.' : e.message } finally { busy.value = false }
}
</script>

<template>
  <div class="lab">
    <div class="lab-card">
      <h3>Quel site analyser ?</h3>
      <form class="lab-row" @submit.prevent="analyzeRemote">
        <label style="flex:1;min-width:220px">Nom de domaine (HTTPS)
          <input v-model="target" class="lab-input" placeholder="exemple.fr" maxlength="300" spellcheck="false" autocomplete="off" inputmode="url">
        </label>
        <button class="lab-btn primary" type="submit" :disabled="busy || !target.trim()">{{ busy ? 'Analyse…' : 'Analyser' }}</button>
        <button class="lab-btn" type="button" :disabled="busy" @click="analyzeSelf">Analyser ce site</button>
      </form>
      <p class="lab-note">N'analyse que des sites qui t'appartiennent ou que tu as le droit de tester. L'outil ne fait qu'UNE requête GET normale et ne lit que les en-têtes. Noms de domaine publics uniquement (pas d'IP, pas d'adresse interne), 8 analyses par minute.</p>
      <p v-if="error" class="lab-bad" role="alert">{{ error }}</p>
    </div>

    <template v-if="report">
      <div class="lab-card" aria-live="polite">
        <div class="lab-row">
          <strong style="font:700 44px var(--serif)" :class="report.pct >= 70 ? 'lab-ok' : report.pct >= 55 ? 'lab-warn' : 'lab-bad'">{{ report.grade }}</strong>
          <div>
            <p><strong>{{ report.source }}</strong> · {{ report.pct }} % · HTTP {{ report.status }}</p>
            <p v-if="report.redirects.length" class="lab-note">Redirections suivies : {{ report.redirects.map((r) => r.status).join(' → ') }}, adresse finale {{ report.finalUrl }}</p>
          </div>
        </div>
        <ul style="list-style:none;margin:0;padding:0;display:grid;gap:12px">
          <li v-for="c in report.checks" :key="c.id">
            <p><span class="lab-tag" :class="c.status"><span aria-hidden="true">{{ ICON[c.status] }}</span> {{ LABEL[c.status] }}</span> <strong>{{ c.label }}</strong></p>
            <p class="lab-note">{{ c.detail }}</p>
            <pre v-if="c.advice" class="lab-out">{{ c.advice }}</pre>
          </li>
        </ul>
      </div>
      <details class="lab-card">
        <summary>En-têtes bruts ({{ Object.keys(report.headers).length }})</summary>
        <div class="lab-scroll"><table class="lab-table"><tbody><tr v-for="(v, k) in report.headers" :key="k"><th scope="row">{{ k }}</th><td class="lab-code">{{ v }}</td></tr></tbody></table></div>
      </details>
    </template>
  </div>
</template>
