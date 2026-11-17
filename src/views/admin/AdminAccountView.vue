<script setup>
// Compte et sécurité : sessions ouvertes, changement de mot de passe, régénération du 2FA.
import { computed, onMounted, reactive, ref } from 'vue'
import qrcode from 'qrcode-generator'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

/* ---------- Sessions ---------- */
const sessions = ref([])
const sessionsError = ref('')
async function loadSessions() {
  sessionsError.value = ''
  try { sessions.value = (await api('/api/admin/account/sessions')).sessions } catch (e) { sessionsError.value = e.message }
}
onMounted(loadSessions)

async function sessionAction(body, okText) {
  sessionsError.value = ''
  try { await api('/api/admin/account/sessions', { method: 'POST', body }); toast(okText, 'ok'); await loadSessions() } catch (e) { sessionsError.value = e.message }
}
const revoke = (id) => sessionAction({ action: 'revoke', id }, 'Session fermée.')
const revokeOthers = () => window.confirm('Fermer toutes les autres sessions ?') && sessionAction({ action: 'revokeOthers' }, 'Les autres sessions sont fermées.')

// Appareil lisible à partir du User-Agent (approximatif, sert seulement à te repérer)
function device(ua = '') {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navigateur inconnu'
  const o = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return o ? `${b} sur ${o}` : b
}
const fmt = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

/* ---------- Mot de passe ---------- */
const pw = reactive({ current: '', next: '', again: '', code: '' })
const pwError = ref('')
const pwBusy = ref(false)
async function changePassword() {
  pwError.value = ''
  if (pw.next !== pw.again) { pwError.value = 'Les deux nouveaux mots de passe sont différents.'; return }
  pwBusy.value = true
  try {
    await api('/api/admin/account/password', { method: 'POST', body: { current: pw.current, next: pw.next, code: pw.code } })
    Object.assign(pw, { current: '', next: '', again: '', code: '' })
    toast('Mot de passe modifié. Les autres sessions ont été fermées.', 'ok')
    await loadSessions()
  } catch (e) { pwError.value = e.message; pw.code = '' } finally { pwBusy.value = false }
}

/* ---------- 2FA ---------- */
const tf = reactive({ password: '', code: '', newCode: '', secret: '', uri: '' })
const tfError = ref('')
const tfBusy = ref(false)
const qrSvg = computed(() => {
  if (!tf.uri) return ''
  const qr = qrcode(0, 'M')
  qr.addData(tf.uri); qr.make()
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) // généré localement, rien n'est envoyé à un tiers
})
async function startTotp() {
  tfError.value = ''; tfBusy.value = true
  try {
    const r = await api('/api/admin/account/totp', { method: 'POST', body: { phase: 'start', password: tf.password, code: tf.code } })
    Object.assign(tf, { secret: r.secret, uri: r.uri, password: '', code: '' })
  } catch (e) { tfError.value = e.message; tf.code = '' } finally { tfBusy.value = false }
}
async function confirmTotp() {
  tfError.value = ''; tfBusy.value = true
  try {
    await api('/api/admin/account/totp', { method: 'POST', body: { phase: 'confirm', code: tf.newCode } })
    Object.assign(tf, { newCode: '', secret: '', uri: '' })
    toast('Double authentification régénérée. Les autres sessions ont été fermées.', 'ok')
    await loadSessions()
  } catch (e) { tfError.value = e.message; tf.newCode = '' } finally { tfBusy.value = false }
}
</script>

<template>
  <div class="admin wide narrow">
    <h1>Compte et sécurité</h1>

    <section class="block" aria-labelledby="s-sess">
      <h2 id="s-sess">Sessions ouvertes</h2>
      <p>Les sessions durent 8 h au maximum et se ferment après 1 h d'inactivité. Si une ligne ne te dit rien, ferme-la.</p>
      <p v-if="sessionsError" class="err" role="alert">{{ sessionsError }}</p>
      <div class="tablewrap">
        <table>
          <thead><tr><th>Appareil</th><th>IP</th><th>Pays</th><th>Dernière activité</th><th /></tr></thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id">
              <td :title="s.ua">{{ device(s.ua) }}<span v-if="s.current" class="here"> · cette session</span></td>
              <td>{{ s.ip || '—' }}</td>
              <td>{{ s.country || '—' }}</td>
              <td>{{ fmt(s.lastSeen) }}</td>
              <td class="actions"><button v-if="!s.current" class="btn btn-ghost btn-danger small" type="button" @click="revoke(s.id)">Fermer</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bar"><button class="btn btn-ghost small" type="button" :disabled="sessions.length < 2" @click="revokeOthers">Fermer toutes les autres sessions</button></div>
    </section>

    <section class="block" aria-labelledby="s-pw">
      <h2 id="s-pw">Changer le mot de passe</h2>
      <form @submit.prevent="changePassword">
        <label>Mot de passe actuel<input v-model="pw.current" type="password" autocomplete="current-password" required maxlength="128" /></label>
        <label>Nouveau mot de passe <span class="hint">14 caractères minimum, avec au moins 3 types (minuscule, majuscule, chiffre, symbole)</span><input v-model="pw.next" type="password" autocomplete="new-password" required minlength="14" maxlength="128" /></label>
        <label>Répète le nouveau mot de passe<input v-model="pw.again" type="password" autocomplete="new-password" required minlength="14" maxlength="128" /></label>
        <label>Code à 6 chiffres <span class="hint">si tu viens de te connecter, attends le code suivant (30 s)</span><input v-model="pw.code" inputmode="numeric" pattern="\d{6}" autocomplete="one-time-code" required maxlength="6" /></label>
        <p v-if="pwError" class="err" role="alert">{{ pwError }}</p>
        <div class="bar"><button class="btn btn-primary" :disabled="pwBusy">Changer le mot de passe</button></div>
      </form>
    </section>

    <section class="block" aria-labelledby="s-2fa">
      <h2 id="s-2fa">Régénérer la double authentification</h2>
      <p>À utiliser pour un nouveau téléphone ou une nouvelle application. L'ancien code reste valable jusqu'à la validation du nouveau.</p>

      <form v-if="!tf.secret" @submit.prevent="startTotp">
        <label>Mot de passe<input v-model="tf.password" type="password" autocomplete="current-password" required maxlength="128" /></label>
        <label>Code actuel à 6 chiffres<input v-model="tf.code" inputmode="numeric" pattern="\d{6}" autocomplete="one-time-code" required maxlength="6" /></label>
        <p v-if="tfError" class="err" role="alert">{{ tfError }}</p>
        <div class="bar"><button class="btn btn-primary" :disabled="tfBusy">Générer un nouveau code QR</button></div>
      </form>

      <form v-else @submit.prevent="confirmTotp">
        <p>Scanne ce QR code avec ta nouvelle application, ou saisis la clé à la main.</p>
        <div class="qr" v-html="qrSvg" />
        <p>Clé : <code>{{ tf.secret }}</code></p>
        <label>Premier code de la nouvelle application<input v-model="tf.newCode" inputmode="numeric" pattern="\d{6}" autocomplete="one-time-code" required maxlength="6" /></label>
        <p v-if="tfError" class="err" role="alert">{{ tfError }}</p>
        <div class="bar"><button class="btn btn-primary" :disabled="tfBusy">Valider et remplacer</button></div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.block{padding:0;margin-top:36px}
.block h2{margin:0 0 8px;font-size:24px}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius)}
table{font-size:14px}
td,th{white-space:nowrap}
.here{color:var(--green);font-weight:600}
.small{min-height:36px;padding:0 14px;font-size:14px}
</style>
