<script setup>
// Sécurité du site : globe des visites, bannissement par pays, continent ou adresse IP, mode protégé.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { CONTINENTS, continentOf, countryName, flag } from '../../admin/geo.js'
import { toast } from '../../admin/toasts.js'
import WorldGlobe from './WorldGlobe.vue'
import './adminForm.css'

const stats = ref(null), sec = ref(null), error = ref(''), busy = ref(false)
const ip = ref(''), ipHours = ref(24), reason = ref(''), picked = ref('')

async function load() {
  try {
    ;[stats.value, sec.value] = await Promise.all([api('/api/admin/stats?days=30'), api('/api/admin/security')])
    error.value = ''
  } catch (e) { error.value = e.message }
}
onMounted(load)

const visits = computed(() => Object.fromEntries((stats.value?.countries ?? []).filter((c) => c.key !== 'XX').map((c) => [c.key, c.n])))
const bans = computed(() => sec.value?.bans ?? [])
const byKind = (k) => bans.value.filter((b) => b.kind === k)
// Pays affichés en rouge : bannis un par un, ou via leur continent
const banned = computed(() => {
  const m = {}
  const conts = new Set(byKind('continent').map((b) => b.value))
  for (const c of Object.keys(visits.value)) if (conts.has(continentOf(c))) m[c] = 'continent'
  for (const b of byKind('country')) m[b.value] = 'country'
  return m
})
const banFor = (cc) => byKind('country').find((b) => b.value === cc)
const table = computed(() => (stats.value?.countries ?? []).filter((c) => c.key !== 'XX'))
const fmtDate = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
const left = (b) => (b.expires_at ? `jusqu'au ${fmtDate(b.expires_at)}` : 'sans fin')
const label = (b) => (b.kind === 'country' ? `${flag(b.value)} ${countryName(b.value)}` : b.kind === 'continent' ? CONTINENTS[b.value] : b.value)
const KIND = { country: 'Pays', continent: 'Continent', ip: 'Adresse IP' }

async function run(fn, ok) {
  busy.value = true
  try { await fn(); toast(ok, 'info'); await load() } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
const ban = (kind, value, extra = {}) => run(() => api('/api/admin/security', { method: 'POST', body: { kind, value, reason: reason.value, ...extra } }), 'Bannissement enregistré')
const unban = (b) => run(() => api(`/api/admin/security?id=${b.id}`, { method: 'DELETE' }), 'Bannissement retiré')
const toggleProtect = () => run(() => api('/api/admin/settings', { method: 'PUT', body: { protectedMode: !sec.value.protectedMode } }), sec.value.protectedMode ? 'Mode protégé désactivé' : 'Mode protégé activé')
function submitIp() { ban('ip', ip.value.trim(), { hours: Number(ipHours.value) }).then(() => { ip.value = '' }) }

const BLOCK = { ip: 'adresse bannie', country: 'pays banni', continent: 'continent banni', rate: 'trop de requêtes', bot: 'robot (mode protégé)' }
const blockedList = computed(() => Object.entries(sec.value?.blocked ?? {}).map(([k, n]) => ({ k: BLOCK[k] ?? k, n })))
const pickedBan = computed(() => (picked.value ? banFor(picked.value) : null))
</script>

<template>
  <main class="admin wide">
    <h1>Sécurité du site</h1>
    <p class="hint">Bloque des visiteurs avant même l'envoi des pages. Ton accès à l'administration n'est jamais bloqué par un pays ou un continent.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <template v-if="sec && stats">
      <section class="card prot" :class="{ on: sec.protectedMode }">
        <div>
          <h2>Mode protégé : {{ sec.protectedMode ? 'activé' : 'désactivé' }}</h2>
          <p class="hint">À activer en cas d'attaque : limite 60 requêtes par minute et par adresse (au lieu de 300), robots refusés sur l'API, mesure d'audience coupée.</p>
        </div>
        <button class="btn" :class="sec.protectedMode ? 'btn-ghost' : 'btn-primary'" type="button" :disabled="busy" @click="toggleProtect">{{ sec.protectedMode ? 'Désactiver' : 'Activer' }}</button>
      </section>

      <div class="cols">
        <section class="card">
          <h2>Visites par pays (30 jours)</h2>
          <p class="hint">Glisse pour tourner, clique sur un pays pour le sélectionner. Rouge : banni.</p>
          <WorldGlobe :visits="visits" :banned="banned" @pick="picked = $event" />
          <div v-if="picked" class="pick" aria-live="polite">
            <strong>{{ flag(picked) }} {{ countryName(picked) }}</strong>
            <span class="hint">{{ visits[picked] ?? 0 }} visite(s)</span>
            <button v-if="pickedBan" class="btn btn-ghost small" type="button" :disabled="busy" @click="unban(pickedBan)">Débannir</button>
            <button v-else class="btn btn-danger small" type="button" :disabled="busy" @click="ban('country', picked)">Bannir ce pays</button>
          </div>
        </section>

        <section class="card">
          <h2>Pays visiteurs</h2>
          <div class="scroll">
            <table>
              <thead><tr><th>Pays</th><th>Visites</th><th><span class="sr">Action</span></th></tr></thead>
              <tbody>
                <tr v-for="c in table" :key="c.key">
                  <td>{{ flag(c.key) }} {{ countryName(c.key) }}</td><td>{{ c.n }}</td>
                  <td><div class="actions">
                    <button v-if="banFor(c.key)" class="btn btn-ghost small" type="button" :disabled="busy" @click="unban(banFor(c.key))">Débannir</button>
                    <button v-else class="btn btn-danger small" type="button" :disabled="busy" :aria-label="`Bannir ${countryName(c.key)}`" @click="ban('country', c.key)">Bannir</button>
                  </div></td>
                </tr>
                <tr v-if="!table.length"><td colspan="3" class="hint">Aucune visite enregistrée pour l'instant.</td></tr>
              </tbody>
            </table>
          </div>
          <h3>Continents</h3>
          <div class="chips">
            <template v-for="(name, code) in CONTINENTS" :key="code">
              <button v-if="byKind('continent').find((b) => b.value === code)" class="btn btn-ghost small" type="button" :disabled="busy" @click="unban(byKind('continent').find((b) => b.value === code))">✕ {{ name }} (banni)</button>
              <button v-else class="btn btn-danger small" type="button" :disabled="busy" @click="ban('continent', code)">Bannir {{ name }}</button>
            </template>
          </div>
        </section>
      </div>

      <section class="card">
        <h2>Bannir une adresse IP</h2>
        <p class="hint">Par respect de la vie privée, une adresse IP n'est gardée que le temps du bannissement (30 jours au maximum), uniquement pour la sécurité.</p>
        <form class="ipform" @submit.prevent="submitIp">
          <label>Adresse IP<input v-model="ip" required placeholder="203.0.113.7" autocomplete="off" inputmode="text"></label>
          <label>Durée
            <select v-model="ipHours"><option :value="1">1 heure</option><option :value="24">24 heures</option><option :value="168">7 jours</option><option :value="720">30 jours</option></select>
          </label>
          <label>Raison (facultatif)<input v-model="reason" maxlength="120"></label>
          <button class="btn btn-danger" type="submit" :disabled="busy">Bannir</button>
        </form>
      </section>

      <section class="card">
        <h2>Bannissements en cours ({{ bans.length }})</h2>
        <div class="scroll">
          <table>
            <thead><tr><th>Type</th><th>Cible</th><th>Origine</th><th>Durée</th><th><span class="sr">Action</span></th></tr></thead>
            <tbody>
              <tr v-for="b in bans" :key="b.id">
                <td>{{ KIND[b.kind] }}</td><td>{{ label(b) }}</td>
                <td>{{ b.auto ? 'Automatique' : 'Manuel' }}<span v-if="b.reason" class="hint"> · {{ b.reason }}</span></td>
                <td>{{ left(b) }}</td>
                <td><div class="actions"><button class="btn btn-ghost small" type="button" :disabled="busy" @click="unban(b)">Retirer</button></div></td>
              </tr>
              <tr v-if="!bans.length"><td colspan="5" class="hint">Aucun bannissement.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2>Accès bloqués (30 jours)</h2>
        <ul v-if="blockedList.length" class="plain"><li v-for="x in blockedList" :key="x.k"><strong>{{ x.n }}</strong> · {{ x.k }}</li></ul>
        <p v-else class="hint">Aucun accès bloqué.</p>
        <p class="hint">Vu de ton côté : pays {{ sec.you.country || 'inconnu' }}, continent {{ sec.you.continent || 'inconnu' }}. Tu ne peux pas les bannir par erreur.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.card{display:grid;gap:12px;align-content:start;margin-top:20px;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.card h2,.card h3{margin:0;font-size:22px}
.card h3{font-size:17px}
.prot{grid-template-columns:1fr auto;align-items:center;border-left:5px solid var(--line);transition:border-color .3s}
.prot.on{border-left-color:#f59e0b}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:0 20px}
.scroll{max-height:360px;overflow:auto}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.pick{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;padding:10px;border:1px dashed var(--line);border-radius:12px}
.ipform{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:12px;align-items:end;margin:0;padding:0;border:0;background:none}
.plain{display:grid;gap:4px;margin:0;padding:0;list-style:none}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:600px){.prot{grid-template-columns:1fr}}
</style>
