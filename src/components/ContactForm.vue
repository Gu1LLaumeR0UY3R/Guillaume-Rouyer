<script setup>
// Formulaire de contact. Le défi anti-robot se résout en arrière-plan dès qu'on commence à écrire :
// au moment d'envoyer, il est presque toujours déjà prêt. Aucun cookie, aucun service tiers.
import { ref } from 'vue'
import { t } from '../i18n/index.js'

const form = ref({ name: '', email: '', subject: '', message: '', website: '' })
const state = ref('idle') // idle | sending | sent
const error = ref('')
let pow = null // promesse de la solution en cours de calcul

const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function solve() {
  const t0 = Date.now()
  const r = await fetch('/api/contact/challenge', { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'challenge')
  const c = await r.json()
  for (let n = 0; n <= c.maxnumber; n++) {
    if (hex(await crypto.subtle.digest('SHA-256', enc.encode(c.salt + n))) === c.challenge) {
      // Le serveur refuse un défi rendu en moins de 2 s : on attend si le calcul a été très rapide
      const rest = 2600 - (Date.now() - t0)
      if (rest > 0) await new Promise((res) => setTimeout(res, rest))
      return { at: Date.now(), payload: btoa(JSON.stringify({ salt: c.salt, number: n, challenge: c.challenge, signature: c.signature })) }
    }
    if (n % 1500 === 0) await new Promise((res) => setTimeout(res)) // laisse la page respirer
  }
  throw new Error('challenge')
}
function warmUp() {
  if (pow) return
  pow = solve()
  pow.catch(() => { pow = null })
}

async function submit() {
  error.value = ''
  state.value = 'sending'
  try {
    warmUp()
    let sol = await pow
    if (Date.now() - sol.at > 8 * 60_000) { pow = null; warmUp(); sol = await pow } // défi trop ancien : on en refait un
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...form.value, pow: sol.payload }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { pow = null; throw new Error(d.error || '') } // le défi ne sert qu'une fois
    pow = null
    state.value = 'sent'
    form.value = { name: '', email: '', subject: '', message: '', website: '' }
  } catch (e) {
    error.value = e.message && e.message !== 'challenge' && e.message !== 'Failed to fetch' ? e.message : t('contactForm.fail')
    state.value = 'idle'
  }
}
</script>

<template>
  <div class="cf">
    <div v-if="state === 'sent'" class="done" role="status">
      <h3>{{ t('contactForm.sentTitle') }}</h3>
      <p>{{ t('contactForm.sentText') }}</p>
      <button class="btn outline" type="button" @click="state = 'idle'">{{ t('contactForm.again') }}</button>
    </div>
    <form v-else novalidate @submit.prevent="submit" @focusin="warmUp">
      <h3>{{ t('contactForm.title') }}</h3>
      <div class="two">
        <label>{{ t('contactForm.name') }}<input v-model="form.name" required minlength="2" maxlength="80" autocomplete="name"></label>
        <label>{{ t('contactForm.email') }}<input v-model="form.email" type="email" required maxlength="254" autocomplete="email" inputmode="email"></label>
      </div>
      <label>{{ t('contactForm.subject') }}<input v-model="form.subject" maxlength="120"></label>
      <label>{{ t('contactForm.message') }}<textarea v-model="form.message" required minlength="10" maxlength="4000" rows="6" /></label>
      <!-- Piège à robots : caché aux humains, ne pas remplir -->
      <div class="trap" aria-hidden="true"><label>Website<input v-model="form.website" tabindex="-1" autocomplete="off"></label></div>
      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <div class="foot">
        <button class="btn light" type="submit" :disabled="state === 'sending'">{{ state === 'sending' ? t('contactForm.sending') : t('contactForm.send') }}</button>
        <p class="note">{{ t('contactForm.privacy') }} <RouterLink to="/confidentialite">{{ t('contactForm.privacyLink') }}</RouterLink></p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.cf{max-width:640px;margin:48px auto 0;text-align:left}
form,.done{display:grid;gap:16px;padding:28px;border:1px solid rgba(184,216,194,.35);border-radius:var(--radius);background:rgba(255,255,255,.06)}
.done{text-align:center;justify-items:center}
h3{margin:0;font:600 22px var(--serif);color:#f3fbf5}
.cf p{margin:0}
label{display:grid;gap:6px;color:#f3fbf5;font-weight:600}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:16px}
input,textarea{width:100%;min-width:0;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(184,216,194,.5);border-radius:12px;background:#f3fbf5;color:#0b1f14;font:inherit;font-weight:400}
input{min-height:46px}
textarea{resize:vertical;min-height:140px}
input:focus,textarea:focus{outline:3px solid #39ff88;outline-offset:1px}
.trap{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.err{color:#ffb4a9;font-weight:600}
.foot{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center}
.note{color:#b8d8c2;font-size:14px}
.note a{color:#39ff88}
.light{background:#39ff88;border-color:#39ff88;color:#052e16}
.light:disabled{opacity:.7;cursor:progress}
.outline{background:transparent;border-color:#b8d8c2;color:#f3fbf5}
</style>
