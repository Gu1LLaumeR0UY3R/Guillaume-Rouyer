<script setup>
// Tableau de bord : résumé, raccourcis, graphiques, santé du site, dernières alertes et connexions.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import CountUp from './CountUp.vue'
import StatChart from './StatChart.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import './adminForm.css'

const d = ref(null)
const error = ref('')
const busy = ref(false)

async function load() {
  error.value = ''
  try { d.value = await api('/api/admin/dashboard') } catch (e) { error.value = e.message }
}
onMounted(load)

const STATUS = { online: 'En ligne', wip: 'En cours', maintenance: 'En maintenance', hidden: 'Masqué' }
const LEVEL = { info: 'Info', warn: 'À surveiller', critical: 'Critique' }
const statusData = computed(() => (d.value ? Object.entries(d.value.projects.statuses).map(([k, v]) => ({ label: STATUS[k], value: v })) : []))
const activityData = computed(() => (d.value?.activity ?? []).map((a) => ({
  label: new Date(`${a.day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }), value: a.sensitive,
})))
const fmt = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

async function setMaintenance(on) {
  if (on && !window.confirm('Mettre TOUT le site en maintenance ? Les visiteurs ne verront plus que la page de maintenance (toi, connecté, continues de voir le site).')) return
  busy.value = true
  try {
    await api('/api/admin/settings', { method: 'PUT', body: { maintenanceOn: on } })
    toast(on ? 'Maintenance globale activée.' : 'Maintenance globale désactivée : le site est de nouveau public.', on ? 'warn' : 'ok')
    await load()
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <div class="admin wide dash">
    <h1>Tableau de bord</h1>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="!d" role="status">Chargement…</p>

    <template v-else>
      <p v-if="d.maintenanceOn" class="warnbox" role="status"><strong>Maintenance globale active.</strong> Le public ne voit que la page de maintenance.</p>

      <section class="tiles" aria-label="Résumé">
        <RouterLink class="tile" style="--d:0" to="/admin/projets" title="Nombre total de projets, tous statuts confondus. Clique pour les gérer.">
          <span class="n"><CountUp :value="d.projects.total" /></span><span class="l">projets</span><span class="s">{{ d.projects.statuses.online }} en ligne</span>
        </RouterLink>
        <RouterLink class="tile" style="--d:1" :class="{ hot: d.alerts.unread }" to="/admin/alertes" title="Alertes de sécurité ou d'erreur que tu n'as pas encore ouvertes. Clique pour les lire.">
          <span class="n"><CountUp :value="d.alerts.unread" /></span><span class="l">alerte{{ d.alerts.unread > 1 ? 's' : '' }} non lue{{ d.alerts.unread > 1 ? 's' : '' }}</span><span class="s">{{ d.alerts.unread ? 'À consulter' : 'Rien à signaler' }}</span>
        </RouterLink>
        <RouterLink class="tile" style="--d:2" to="/admin/journaux" title="Tentatives de connexion ratées ces 24 dernières heures (mauvais mot de passe ou code 2FA).">
          <span class="n"><CountUp :value="d.last24h.loginFailed" /></span><span class="l">échec{{ d.last24h.loginFailed > 1 ? 's' : '' }} de connexion (24 h)</span><span class="s">{{ d.last24h.loginOk }} réussie{{ d.last24h.loginOk > 1 ? 's' : '' }}</span>
        </RouterLink>
        <RouterLink class="tile" style="--d:3" :class="{ hot: d.last24h.errors }" to="/admin/journaux" title="Erreurs internes du serveur ces 24 dernières heures. Ouvre les journaux pour voir le détail.">
          <span class="n"><CountUp :value="d.last24h.errors" /></span><span class="l">erreur{{ d.last24h.errors > 1 ? 's' : '' }} serveur (24 h)</span><span class="s">{{ d.last24h.originRefused }} requête(s) refusée(s)</span>
        </RouterLink>
      </section>

      <section aria-labelledby="sc">
        <h2 id="sc">Raccourcis</h2>
        <div class="bar">
          <RouterLink class="btn btn-primary small" to="/admin/projets/nouveau" title="Créer un projet">+ Nouveau projet</RouterLink>
          <RouterLink class="btn btn-ghost small" to="/admin/alertes" title="Voir les alertes">Alertes</RouterLink>
          <RouterLink class="btn btn-ghost small" to="/admin/journaux" title="Historique des événements du site">Journaux</RouterLink>
          <RouterLink class="btn btn-ghost small" to="/admin/reglages" title="Contact, pied de page, maintenance">Réglages</RouterLink>
          <RouterLink class="btn btn-ghost small" to="/" target="_blank" title="Ouvre le site public dans un nouvel onglet">Voir le site</RouterLink>
          <span class="spacer" />
          <ToggleSwitch :model-value="d.maintenanceOn" :disabled="busy" label="Maintenance de tout le site" @update:model-value="setMaintenance" />
        </div>
      </section>

      <div class="cols">
        <StatChart title="Projets par statut" :data="statusData" initial="pie" unit="projet(s)" style="--d:4" />
        <StatChart title="Événements sensibles sur 7 jours" :data="activityData" :allow="['bar']" unit="événement(s)" single style="--d:5" />
      </div>

      <div class="cols">
        <section class="card" style="--d:6" aria-labelledby="sh">
          <h2 id="sh">Santé du site</h2>
          <ul class="health">
            <li v-for="h in d.health" :key="h.id" :title="h.ok ? 'Tout est bon' : (h.hint || 'À vérifier')">
              <span class="mark" :class="h.ok ? 'ok' : 'ko'" aria-hidden="true">{{ h.ok ? '✓' : '!' }}</span>
              <span><span class="sr">{{ h.ok ? 'Bon : ' : 'À vérifier : ' }}</span>{{ h.label }}<span v-if="!h.ok && h.hint" class="hint"><br />{{ h.hint }}</span></span>
            </li>
          </ul>
        </section>

        <section class="card" style="--d:7" aria-labelledby="sa">
          <h2 id="sa">Dernières alertes</h2>
          <p v-if="!d.alerts.latest.length" class="hint">Aucune alerte pour le moment.</p>
          <ul v-else class="alist">
            <li v-for="a in d.alerts.latest" :key="a.id" :class="{ unread: !a.is_read }">
              <strong>{{ a.title }}</strong><span v-if="a.count > 1"> ×{{ a.count }}</span>
              <span class="hint"><br />{{ LEVEL[a.level] }} · {{ fmt(a.at) }}<template v-if="a.detail"> · {{ a.detail }}</template></span>
            </li>
          </ul>
          <RouterLink class="more" to="/admin/alertes">Toutes les alertes →</RouterLink>
        </section>
      </div>

      <section class="card" style="--d:8" aria-labelledby="sl">
        <h2 id="sl">Dernières connexions</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>IP</th><th>Pays</th></tr></thead>
            <tbody>
              <tr v-for="(l, i) in d.logins" :key="i"><td>{{ fmt(l.at) }}</td><td>{{ l.ip }}</td><td>{{ l.country || '—' }}</td></tr>
            </tbody>
          </table>
        </div>
        <p v-if="d.projects.lastEdit" class="hint">Dernier projet modifié : {{ d.projects.lastEdit.name }}, {{ fmt(d.projects.lastEdit.updated_at) }}.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash{max-width:1360px}
.dash h2{margin:0 0 14px;font-size:22px}
.dash section{margin-top:28px;padding:0}
.dash section.card{padding:22px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px;margin-top:20px}
.tile,.card,.chart,.cols>*{animation:rise .55s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d, 0) * 70ms)}
.tile{display:grid;align-content:center;justify-items:center;gap:4px;min-height:140px;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);color:var(--fg);text-align:center;text-decoration:none;transition:transform .2s,border-color .2s,box-shadow .2s}
.tile:hover{border-color:var(--green);transform:translateY(-4px);box-shadow:0 16px 30px -18px var(--glow)}
.tile.hot{border-color:#b42318;animation:rise .55s cubic-bezier(.2,.8,.2,1) both,pulse 2.4s 1s ease-in-out infinite}
.n{font:600 40px/1 var(--serif);font-variant-numeric:tabular-nums}
.l{font-weight:600;line-height:1.3}
.s{color:var(--muted);font-size:14px;line-height:1.3}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:18px;margin-top:28px;align-items:stretch}
.cols>section{margin-top:0}
.card{padding:22px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:border-color .25s,box-shadow .25s}
.card:hover{border-color:var(--green);box-shadow:0 14px 30px -22px var(--glow)}
.warnbox{margin:16px 0 0;padding:12px 16px;border:1px solid #f59e0b;border-radius:12px;background:var(--card);color:var(--fg)}
.health,.alist{display:grid;gap:6px;margin:0;padding:0;list-style:none}
.health li,.alist li{padding:8px 10px;margin:0 -10px;border-radius:10px;transition:background .2s}
.health li:hover,.alist li:hover{background:var(--bg)}
.health li{display:flex;gap:12px;align-items:center}
.mark{display:inline-flex;flex:none;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font:700 14px/1 var(--font)}
.mark.ok{background:var(--green);color:var(--on-green)}
.mark.ko{background:#f59e0b;color:#1b1200}
.alist li.unread strong{color:var(--fg)}
.more{display:inline-block;margin-top:14px;color:var(--green);font-weight:600;transition:transform .2s}
.more:hover{transform:translateX(4px)}
.tablewrap{overflow-x:auto}
table{font-size:14px}
tbody tr{transition:background .2s}
tbody tr:hover{background:var(--bg)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.small{min-height:38px;padding:0 14px;font-size:14px}
@keyframes rise{from{opacity:0;transform:translateY(16px)}}
@keyframes pulse{50%{box-shadow:0 0 0 6px rgba(180,35,24,.18)}}
@media (prefers-reduced-motion:reduce){.tile,.card,.chart,.cols>*,.tile.hot{animation:none}.tile,.card,.more{transition:none}}
</style>
