<script setup>
// Démo 7 : le code à 6 chiffres des applis d'authentification (TOTP, RFC 6238), comme la double authentification de l'admin de ce site.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import qrcode from 'qrcode-generator'
import { toHex } from '../../lib/cyber/crypto.js'
import { base32Decode, newSecret, totpSteps, verifyTotp } from '../../lib/cyber/totp.js'

const secret = ref(newSecret())
const steps = ref(null)
const left = ref(30)
const guess = ref('')
const verdict = ref(null)
let timer

const uri = computed(() => `otpauth://totp/Labo:visiteur?secret=${secret.value}&issuer=Labo`)
// QR généré localement : le secret ne quitte jamais la page
const qr = computed(() => { const q = qrcode(0, 'M'); q.addData(uri.value); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) })

async function tick() {
  const now = Date.now()
  left.value = 30 - (Math.floor(now / 1000) % 30)
  steps.value = await totpSteps(base32Decode(secret.value), now)
}
async function check() { verdict.value = await verifyTotp(base32Decode(secret.value), guess.value.trim()) }
function renew() { secret.value = newSecret(); verdict.value = null; tick() }
onMounted(() => { tick(); timer = setInterval(tick, 1000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="lab">
    <div class="lab-card">
      <h3>Un secret partagé</h3>
      <p class="lab-note">Au moment d'activer la double authentification, le serveur et ton téléphone reçoivent le même secret (souvent via un QR code). Ensuite, plus rien ne circule : chacun calcule le code de son côté. Scanne ce QR avec ton appli d'authentification : tu verras les mêmes codes qu'ici. Secret jetable, propre à cette page.</p>
      <div class="lab-row">
        <div style="width:150px;height:150px;background:#fff;border-radius:8px;padding:4px" v-html="qr" />
        <div style="flex:1;min-width:220px">
          <p><strong>Secret (base32)</strong></p>
          <pre class="lab-out">{{ secret }}</pre>
          <button class="lab-btn" type="button" @click="renew">Nouveau secret</button>
        </div>
      </div>
    </div>

    <div v-if="steps" class="lab-card" aria-live="off">
      <h3>Le code du moment</h3>
      <p style="font:700 40px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.15em;margin:0">{{ steps.code }}</p>
      <div class="lab-bar" aria-hidden="true"><i :style="{ width: `${(left / 30) * 100}%` }" /></div>
      <p class="lab-note">Change dans {{ left }} s.</p>
      <h3>Comment il est calculé</h3>
      <ol class="lab-note" style="margin:0;padding-left:20px;display:grid;gap:6px">
        <li>Le temps est découpé en tranches de 30 s : compteur = <code>{{ steps.counter }}</code>.</li>
        <li>HMAC-SHA1(secret, compteur) = <code class="lab-code" style="overflow-wrap:anywhere">{{ toHex(steps.mac) }}</code></li>
        <li>Le dernier demi-octet donne la position de lecture : <code>{{ steps.offset }}</code>. On lit 4 octets à partir de là (bit de poids fort retiré) : <code>{{ steps.bin }}</code>.</li>
        <li>On garde les 6 derniers chiffres de ce nombre : <strong>{{ steps.code }}</strong>.</li>
      </ol>
    </div>

    <form class="lab-card" @submit.prevent="check">
      <h3>Vérifier un code</h3>
      <div class="lab-row">
        <label style="flex:1;min-width:160px">Code à 6 chiffres<input v-model="guess" class="lab-input" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"></label>
        <button class="lab-btn primary" type="submit" :disabled="guess.length !== 6">Vérifier</button>
      </div>
      <p v-if="verdict !== null" :class="verdict ? 'lab-ok' : 'lab-bad'" role="status">{{ verdict ? '✓ Code valide' : '✗ Code invalide ou expiré' }}</p>
      <p class="lab-note">Le serveur accepte aussi la tranche précédente et la suivante, car les horloges ne sont jamais parfaitement synchronisées. Un code ne protège que si le secret reste secret : c'est pourquoi on limite les essais (6 chiffres = 1 million de possibilités).</p>
    </form>
  </div>
</template>
