<script setup>
// Démo 3 : le JWT. On le fabrique, on le décode, puis on l'attaque (modification du contenu, « alg: none »).
import { computed, onMounted, ref, watch } from 'vue'
import { b64urlText } from '../../lib/cyber/crypto.js'
import { decodeJwt, forgeNone, signHs256, verifyNaive, verifyStrict } from '../../lib/cyber/jwt.js'

const secret = ref('secret-de-demo')
const payloadText = ref(JSON.stringify({ sub: 'alice', role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 }, null, 2))
const token = ref('')
const payloadError = ref('')
const strict = ref(null)
const naive = ref(null)

// Fabrication : le serveur signe en-tête + contenu avec son secret
async function build() {
  try {
    token.value = await signHs256({ alg: 'HS256', typ: 'JWT' }, JSON.parse(payloadText.value), secret.value)
    payloadError.value = ''
  } catch { payloadError.value = 'Le contenu doit être du JSON valide.' }
}
watch([payloadText, secret], build)

const decoded = computed(() => { try { return { ...decodeJwt(token.value), error: '' } } catch (e) { return { error: e.message } } })
const pretty = (o) => JSON.stringify(o, null, 2)
const parts = computed(() => String(token.value).split('.'))
const expInfo = computed(() => {
  const exp = decoded.value.payload?.exp
  return typeof exp === 'number' ? `${new Date(exp * 1000).toLocaleString('fr-FR')} ${exp * 1000 < Date.now() ? '(expiré)' : '(valide)'}` : ''
})

// À chaque modification du jeton : on le fait vérifier par les deux serveurs
watch(token, async (t) => { strict.value = await verifyStrict(t, secret.value); naive.value = await verifyNaive(t, secret.value) }, { immediate: true })

// Attaque 1 : l'attaquant change le rôle en « admin » mais ne connaît pas le secret : il garde l'ancienne signature
function tamper() {
  const d = decodeJwt(token.value)
  token.value = `${d.parts[0]}.${b64urlText(JSON.stringify({ ...d.payload, role: 'admin' }))}.${d.parts[2]}`
}
// Attaque 2 : « alg: none », sans signature du tout
function noneAttack() {
  const d = decodeJwt(token.value)
  token.value = forgeNone({ ...d.payload, role: 'admin' })
}
onMounted(build)
</script>

<template>
  <div class="lab">
    <div class="lab-card">
      <h3>1. Fabriquer un jeton (côté serveur)</h3>
      <div class="lab-grid">
        <label>Contenu (payload, JSON)<textarea v-model="payloadText" rows="6" spellcheck="false" /></label>
        <label>Secret du serveur<input v-model="secret" class="lab-input" spellcheck="false" autocomplete="off"></label>
      </div>
      <p v-if="payloadError" class="lab-bad" role="alert">{{ payloadError }}</p>
      <p class="lab-note">L'en-tête <code>{"alg":"HS256","typ":"JWT"}</code> est ajouté, puis tout est signé avec HMAC-SHA256.</p>
    </div>

    <div class="lab-card">
      <h3>2. Le jeton (ce que le navigateur stocke et renvoie)</h3>
      <textarea v-model="token" rows="5" spellcheck="false" aria-label="Jeton JWT" />
      <pre class="lab-out lab-jwt" aria-hidden="true"><span>{{ parts[0] }}</span>.<span>{{ parts[1] }}</span>.<span>{{ parts[2] }}</span></pre>
      <p class="lab-note">Rose : en-tête · violet : contenu · bleu : signature. Les deux premiers morceaux sont juste encodés en base64url : <strong>n'importe qui peut les lire</strong>. Ne mets jamais de secret dedans.</p>
      <div v-if="decoded.error" class="lab-bad" role="alert">{{ decoded.error }}</div>
      <div v-else class="lab-grid">
        <div><p><strong>En-tête décodé</strong></p><pre class="lab-out">{{ pretty(decoded.header) }}</pre></div>
        <div><p><strong>Contenu décodé</strong></p><pre class="lab-out">{{ pretty(decoded.payload) }}</pre><p v-if="expInfo" class="lab-note">exp : {{ expInfo }}</p></div>
      </div>
    </div>

    <div class="lab-card">
      <h3>3. Attaquer le jeton</h3>
      <div class="lab-row">
        <button class="lab-btn danger" type="button" @click="tamper">Passer role en « admin » (sans le secret)</button>
        <button class="lab-btn danger" type="button" @click="noneAttack">Attaque « alg: none »</button>
        <button class="lab-btn" type="button" @click="build">Rétablir le jeton légitime</button>
      </div>
      <div class="lab-grid">
        <div>
          <p><strong>Serveur strict</strong> <span class="lab-note">(algorithme imposé côté serveur)</span></p>
          <p v-if="strict" :class="strict.ok ? 'lab-ok' : 'lab-bad'" role="status">{{ strict.ok ? '✓' : '✗' }} {{ strict.why }}</p>
        </div>
        <div>
          <p><strong>Serveur naïf</strong> <span class="lab-note">(fait confiance au champ alg du jeton)</span></p>
          <p v-if="naive" :class="naive.ok ? 'lab-ok' : 'lab-bad'" role="status">{{ naive.ok ? '✓' : '✗' }} {{ naive.why }}</p>
        </div>
      </div>
      <p v-if="naive?.ok && !strict?.ok" class="lab-bad"><strong>Faille démontrée :</strong> le serveur naïf accepte un faux jeton « admin ». Le serveur strict le refuse.</p>
    </div>
  </div>
</template>
