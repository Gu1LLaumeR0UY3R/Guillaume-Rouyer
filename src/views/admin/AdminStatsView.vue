<script setup>
// Statistiques d'audience : vues, temps actif, pays, appareils, origine, clics de contact, arbres plantés.
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../../admin/api.js'
import CountUp from './CountUp.vue'
import StatChart from './StatChart.vue'
import './adminForm.css'

const days = ref(30)
const d = ref(null)
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  try { d.value = await api(`/api/admin/stats?days=${days.value}`); error.value = '' } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(load)
watch(days, load)

const regions = new Intl.DisplayNames(['fr'], { type: 'region' })
const flag = (cc) => (/^[A-Z]{2}$/.test(cc) && cc !== 'XX' ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : '🌐')
const country = (cc) => { try { return cc === 'XX' ? 'Inconnu' : `${flag(cc)} ${regions.of(cc)}` } catch { return cc } }
const CONT = { AF: 'Afrique', AN: 'Antarctique', AS: 'Asie', EU: 'Europe', NA: 'Amérique du Nord', OC: 'Océanie', SA: 'Amérique du Sud', '??': 'Inconnu' }
const DEVICE = { ordinateur: 'Ordinateur', mobile: 'Mobile', tablette: 'Tablette' }
const THEME = { light: 'Mode clair', dark: 'Mode sombre' }
const CLICK = { email: 'E-mail', github: 'GitHub', linkedin: 'LinkedIn' }
const PAGE = { '/': 'Accueil', '/projets': 'Projets', '/veille': 'Veille', '/a-propos': 'À propos', '/contact': 'Contact', '/mentions-legales': 'Mentions légales', '/confidentialite': 'Confidentialité', '/(autre)': 'Autre page' }
const pageName = (k) => PAGE[k] ?? k

const toData = (list, name = (k) => k) => (list ?? []).map((x) => ({ label: name(x.key), value: x.n }))
const short = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const series = (arr) => (d.value ? d.value.days.map((day, i) => ({ label: short(day), value: arr[i] })) : [])

const mmss = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`)
const delta = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null)
const fmtDelta = (v) => (v === null ? 'nouveau' : `${v > 0 ? '+' : ''}${v} %`)
const hasData = computed(() => d.value && (d.value.totals.views > 0 || d.value.totals.trees > 0))
const treeTotal = computed(() => d.value?.totals.trees ?? 0)
const cap = computed(() => (d.value ? Math.min(100, Math.round((d.value.capToday / 12000) * 100)) : 0))
</script>

<template>
  <div class="admin wide stats">
    <div class="head">
      <div>
        <h1>Statistiques</h1>
        <p>Visites anonymes, sans adresse IP. Un cookie d'audience n'est posé qu'avec l'accord du visiteur. Les robots et toi, connecté, ne sont pas comptés.</p>
      </div>
      <div class="seg" role="group" aria-label="Période">
        <button v-for="n in [7, 30, 90]" :key="n" type="button" :aria-pressed="days === n" :title="`Les ${n} derniers jours, aujourd'hui compris`" @click="days = n">{{ n }} jours</button>
      </div>
    </div>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="loading && !d" role="status">Chargement…</p>

    <template v-if="d">
      <p v-if="!hasData" class="empty">Pas encore de données sur cette période.</p>
      <details class="diag" :open="!hasData">
        <summary>Pourquoi je vois 0 ? Ce qui n'est pas compté</summary>
        <ul>
          <li><strong>Toi, connecté à l'admin.</strong> Tant que ta session admin est ouverte dans ce navigateur, tes visites du site ne comptent pas. Pour tester : ouvre le site dans une fenêtre de navigation privée (ou déconnecte-toi), visite 2 ou 3 pages, puis reviens ici.</li>
          <li><strong>« Do Not Track » ou « Global Privacy Control »</strong> activé (par défaut dans Brave, Firefox en mode strict, DuckDuckGo) : le site le respecte et ne compte pas.</li>
          <li><strong>Les robots</strong> et les navigateurs pilotés par un programme.</li>
          <li><strong>Ceux qui ont cliqué « Ne pas me compter »</strong> sur la page Confidentialité.</li>
          <li><strong>Les bloqueurs de pub</strong> les plus stricts peuvent bloquer l'adresse de mesure.</li>
        </ul>
        <p class="hint">Mesures reçues aujourd'hui : <strong>{{ d.capToday }}</strong>. Si ce nombre monte quand tu visites en navigation privée, la mesure fonctionne.</p>
      </details>

      <div class="tiles">
        <div class="tile" style="--d:0" title="Nombre de pages vues sur la période, comparé à la période précédente de même durée.">
          <span class="n"><CountUp :value="d.totals.views" /></span><span class="l">Pages vues</span>
          <span class="s" :class="{ up: delta(d.totals.views, d.totals.viewsBefore) > 0, down: delta(d.totals.views, d.totals.viewsBefore) < 0 }">{{ fmtDelta(delta(d.totals.views, d.totals.viewsBefore)) }} vs période précédente</span>
        </div>
        <div class="tile" style="--d:1" title="Visiteurs différents par jour, additionnés sur la période. Seuls ceux qui ont accepté le cookie d'audience sont comptés : c'est une partie des visiteurs, pas tous.">
          <span class="n"><CountUp :value="d.totals.visitors" /></span><span class="l">Visiteurs (avec cookie)</span>
          <span class="s">{{ d.totals.visitorsNew }} nouveau{{ d.totals.visitorsNew > 1 ? 'x' : '' }} · {{ d.totals.visitorsReturning }} de retour</span>
        </div>
        <div class="tile" style="--d:1" title="Temps moyen réellement passé sur une page : onglet visible et visiteur actif (souris, défilement, clavier).">
          <span class="n">{{ d.totals.avgSeconds ? mmss(d.totals.avgSeconds) : '–' }}</span><span class="l">Temps actif moyen</span><span class="s">par page consultée</span>
        </div>
        <div class="tile" style="--d:2" title="Nombre de pays différents d'où le site a été consulté.">
          <span class="n"><CountUp :value="d.totals.countries" /></span><span class="l">Pays</span><span class="s">différents</span>
        </div>
        <div class="tile" style="--d:3" title="Clics sur l'e-mail, GitHub ou LinkedIn.">
          <span class="n"><CountUp :value="d.totals.clicks" /></span><span class="l">Clics de contact</span>
          <span class="s" :class="{ up: delta(d.totals.clicks, d.totals.clicksBefore) > 0, down: delta(d.totals.clicks, d.totals.clicksBefore) < 0 }">{{ fmtDelta(delta(d.totals.clicks, d.totals.clicksBefore)) }}</span>
        </div>
        <div class="tile" style="--d:4" title="Arbres plantés par les visiteurs dans le décor de l'accueil (juste pour le plaisir).">
          <span class="n"><CountUp :value="treeTotal" /></span><span class="l">Arbres plantés 🌳</span>
          <span class="s">{{ fmtDelta(delta(d.totals.trees, d.totals.treesBefore)) }}</span>
        </div>
      </div>

      <div class="cols one"><StatChart title="Pages vues par jour" :data="series(d.views)" :allow="['line', 'bar']" initial="line" unit="vue(s)" single style="--d:5" /></div>

      <div class="cols one"><StatChart title="Visiteurs par jour (ayant accepté le cookie)" :data="series(d.visitors)" :allow="['line', 'bar']" initial="bar" unit="visiteur(s)" single style="--d:5" /></div>

      <div class="cols">
        <StatChart title="Pages les plus vues" :data="toData(d.pages, pageName)" unit="vue(s)" style="--d:6" />
        <section class="card" style="--d:7" aria-labelledby="tt">
          <h2 id="tt">Temps actif par page</h2>
          <table v-if="d.pages.length">
            <thead><tr><th>Page</th><th class="r">Vues</th><th class="r" title="Temps réellement passé sur la page">Temps moyen</th></tr></thead>
            <tbody><tr v-for="p in d.pages" :key="p.key"><td>{{ pageName(p.key) }}</td><td class="r">{{ p.n }}</td><td class="r">{{ p.avgSeconds ? mmss(p.avgSeconds) : '–' }}</td></tr></tbody>
          </table>
          <p v-else class="hint">Aucune donnée.</p>
        </section>
      </div>

      <div class="cols">
        <StatChart title="Pays" :data="toData(d.countries.slice(0, 12), country)" unit="vue(s)" style="--d:8" />
        <StatChart title="Continents" :data="toData(d.continents, (k) => CONT[k] ?? k)" initial="pie" unit="vue(s)" style="--d:9" />
        <StatChart title="Origine des visites" :data="toData(d.referrers.slice(0, 10))" unit="visite(s)" style="--d:10" />
        <StatChart title="Appareils" :data="toData(d.devices, (k) => DEVICE[k] ?? k)" initial="pie" unit="vue(s)" style="--d:11" />
        <StatChart title="Thème choisi" :data="toData(d.themes, (k) => THEME[k] ?? k)" initial="pie" unit="choix" style="--d:12" />
        <StatChart title="Clics de contact" :data="toData(d.clicks, (k) => CLICK[k] ?? k)" initial="pie" unit="clic(s)" style="--d:13" />
      </div>

      <div class="cols one"><StatChart title="Arbres plantés par jour" :data="series(d.trees)" :allow="['bar', 'line']" initial="bar" unit="arbre(s)" single style="--d:14" /></div>

      <p class="hint foot" :title="'Au-delà de 12 000 événements par jour, la mesure s\'arrête jusqu\'au lendemain pour protéger le quota gratuit de la base.'">Quota de mesure aujourd'hui : {{ cap }} % ({{ d.capToday }} / 12 000 événements).</p>
    </template>
  </div>
</template>

<style scoped>
.stats{max-width:1360px}
.head{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:flex-end;justify-content:space-between}
.seg{display:inline-flex;padding:4px;border:1px solid var(--line);border-radius:999px;background:var(--card)}
.seg button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 18px;border:0;border-radius:999px;background:transparent;color:var(--fg);font:600 14px/1 var(--font);cursor:pointer;transition:background .2s,color .2s}
.seg button:hover{background:var(--bg)}
.seg button[aria-pressed='true']{background:var(--green);color:var(--on-green)}
.diag{margin:0 0 16px;padding:12px 18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.diag summary{cursor:pointer;font-weight:700}
.diag ul{margin:10px 0;padding-left:20px;display:grid;gap:6px}
.empty{padding:18px 20px;border:1px dashed var(--line);border-radius:var(--radius);background:var(--card)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:16px;margin-top:20px}
.tile{display:grid;align-content:center;justify-items:center;gap:4px;min-height:130px;padding:18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);text-align:center;transition:transform .2s,border-color .2s,box-shadow .2s}
.tile:hover{border-color:var(--green);transform:translateY(-4px);box-shadow:0 16px 30px -18px var(--glow)}
.n{font:600 34px/1.1 var(--serif);font-variant-numeric:tabular-nums}
.l{font-weight:600}
.s{color:var(--muted);font-size:13px;line-height:1.3}
.s.up{color:var(--green)}
.s.down{color:#b45309}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:18px;margin-top:18px;align-items:stretch}
.cols.one{grid-template-columns:1fr}
.tile,.card,.cols>*{animation:rise .55s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d, 0) * 60ms)}
.card{padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.card h2{margin:0 0 14px;font-size:17px;min-height:34px;display:flex;align-items:center}
.card table{font-size:14px}
.r{text-align:right!important;font-variant-numeric:tabular-nums}
.foot{margin-top:22px}
@keyframes rise{from{opacity:0;transform:translateY(16px)}}
@media (prefers-reduced-motion:reduce){.tile,.card,.cols>*{animation:none}.tile,.seg button{transition:none}}
</style>
