<script setup>
// Santé du site : base de données, espace des médias, quota de mesure, erreurs récentes.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import './adminForm.css'

const h = ref(null), error = ref('')
async function load() { try { h.value = await api('/api/admin/health'); error.value = '' } catch (e) { error.value = e.message } }
onMounted(load)

const mo = (b) => (b / 1e6 < 10 ? (b / 1e6).toFixed(1) : Math.round(b / 1e6)) + ' Mo'
const pct = (a, b) => Math.min(100, Math.round((a / b) * 100))
const tone = (p) => (p >= 90 ? 'bad' : p >= 70 ? 'warn' : 'good')
const when = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
const rows = computed(() => {
  if (!h.value) return []
  const m = pct(h.value.media.bytes, h.value.media.max), s = pct(h.value.stats.eventsToday, h.value.stats.cap)
  return [
    { name: 'Espace des médias', value: `${mo(h.value.media.bytes)} sur ${mo(h.value.media.max)} (${h.value.media.count} fichiers)`, p: m, hint: 'Alerte à 80 %. Vide la corbeille ou compresse les images pour gagner de la place.' },
    { name: 'Mesure d\'audience du jour', value: `${h.value.stats.eventsToday} sur ${h.value.stats.cap} événements`, p: s, hint: 'Au-delà de la limite, la mesure s\'arrête jusqu\'au lendemain pour protéger le quota gratuit.' },
  ]
})
</script>

<template>
  <main class="admin wide">
    <h1>Santé du site</h1>
    <p class="hint">Ce que le site peut mesurer lui-même. Les compteurs exacts de Cloudflare (requêtes, lectures de base) se voient dans son tableau de bord.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <template v-if="h">
      <div class="kpis">
        <div class="kpi good"><span>Base de données</span><strong>{{ h.db.ok ? 'En ligne' : 'Panne' }}</strong><small>{{ h.db.latencyMs }} ms de réponse</small></div>
        <div class="kpi" :class="h.errors24h ? 'bad' : 'good'"><span>Erreurs (24 h)</span><strong>{{ h.errors24h }}</strong><small>{{ h.errors24h ? 'voir les journaux' : 'aucune' }}</small></div>
        <div class="kpi" :class="h.unreadAlerts ? 'warn' : 'good'"><span>Alertes non lues</span><strong>{{ h.unreadAlerts }}</strong><small><RouterLink to="/admin/alertes">ouvrir</RouterLink></small></div>
        <div class="kpi"><span>Bannissements actifs</span><strong>{{ h.activeBans }}</strong><small><RouterLink to="/admin/securite">gérer</RouterLink></small></div>
      </div>

      <section class="card">
        <h2>Quotas surveillés</h2>
        <div v-for="r in rows" :key="r.name" class="gauge">
          <div class="top"><strong>{{ r.name }}</strong><span>{{ r.value }}</span></div>
          <div class="bar-bg" role="progressbar" :aria-valuenow="r.p" aria-valuemin="0" aria-valuemax="100" :aria-label="r.name"><div class="fill" :class="tone(r.p)" :style="{ width: r.p + '%' }" /></div>
          <p class="hint">{{ r.p }} % · {{ r.hint }}</p>
        </div>
      </section>

      <section class="card">
        <h2>Journaux</h2>
        <p>{{ h.logs.count }} entrées<span v-if="h.logs.oldest"> depuis le {{ when(h.logs.oldest) }}</span>.</p>
        <ul v-if="h.lastErrors.length" class="plain"><li v-for="(e, i) in h.lastErrors" :key="i"><strong>{{ e.event }}</strong> · {{ when(e.at) }}</li></ul>
        <p v-else class="hint">Aucune erreur enregistrée.</p>
        <RouterLink class="btn btn-ghost small" to="/admin/journaux">Voir les journaux</RouterLink>
      </section>
    </template>
  </main>
</template>

<style scoped>
.card{display:grid;gap:14px;align-content:start;margin-top:20px;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.card h2{margin:0;font-size:22px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:14px;margin-top:20px}
.kpi{display:grid;gap:4px;padding:16px;border:1px solid var(--line);border-left:5px solid var(--line);border-radius:var(--radius);background:var(--card);transition:transform .2s}
.kpi:hover{transform:translateY(-3px)}
.kpi strong{font:600 28px var(--serif)}
.kpi span,.kpi small{color:var(--muted)}
.kpi.good{border-left-color:var(--green)}.kpi.warn{border-left-color:#f59e0b}.kpi.bad{border-left-color:#b42318}
.gauge{display:grid;gap:6px}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}
.bar-bg{height:12px;border-radius:99px;background:var(--bg);border:1px solid var(--line);overflow:hidden}
.fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.2,.8,.2,1)}
.fill.good{background:var(--green)}.fill.warn{background:#f59e0b}.fill.bad{background:#b42318}
.plain{display:grid;gap:4px;margin:0;padding:0;list-style:none}
@media (prefers-reduced-motion:reduce){.kpi,.fill{transition:none}}
</style>
