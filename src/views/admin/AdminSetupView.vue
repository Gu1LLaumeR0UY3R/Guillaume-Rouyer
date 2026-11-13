<script setup>
// Page d'installation : sert une seule fois, pour créer le compte admin (mot de passe + 2FA).
import { computed, ref } from 'vue'
import qrcode from 'qrcode-generator'
import { api } from '../../admin/api.js'
import './adminForm.css'

const token = ref('')
const password = ref('')
const code = ref('')
const secret = ref('')
const uri = ref('')
const done = ref(false)
const error = ref('')
const busy = ref(false)

const qrSvg = computed(() => {
  if (!uri.value) return ''
  const qr = qrcode(0, 'M')
  qr.addData(uri.value); qr.make()
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) // SVG généré localement, aucune donnée envoyée à un tiers
})

async function run(body, after) {
  error.value = ''; busy.value = true
  try { after(await api('/api/admin/setup', { method: 'POST', body })) } catch (e) { error.value = e.message } finally { busy.value = false }
}
const start = () => run({ phase: 'start', token: token.value, password: password.value }, (r) => { secret.value = r.secret; uri.value = r.uri; password.value = '' })
const confirm = () => run({ phase: 'confirm', token: token.value, code: code.value }, () => { done.value = true; token.value = '' })
</script>

<template>
  <div class="admin">
    <h1>Installation</h1>
    <template v-if="done">
      <p class="ok">Compte créé. Attends le prochain code (30 s) puis connecte-toi.</p>
      <RouterLink class="btn btn-primary" to="/admin">Aller à la connexion</RouterLink>
    </template>
    <form v-else-if="!secret" @submit.prevent="start">
      <label>Jeton d'installation<input v-model="token" type="password" autocomplete="off" required /></label>
      <label>Mot de passe (14 caractères minimum)<input v-model="password" type="password" autocomplete="new-password" required minlength="14" maxlength="128" /></label>
      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <button class="btn btn-primary" :disabled="busy">Continuer</button>
    </form>
    <form v-else @submit.prevent="confirm">
      <p>Scanne ce QR code avec ton application d'authentification, ou saisis la clé à la main.</p>
      <div class="qr" v-html="qrSvg" />
      <p>Clé : <code>{{ secret }}</code></p>
      <label>Code à 6 chiffres<input v-model="code" inputmode="numeric" pattern="\d{6}" autocomplete="one-time-code" required maxlength="6" /></label>
      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <button class="btn btn-primary" :disabled="busy">Valider</button>
    </form>
  </div>
</template>
