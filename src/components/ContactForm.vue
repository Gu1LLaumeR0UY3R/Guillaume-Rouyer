<script setup>
// Formulaire de contact. Le défi anti-robot se résout en arrière-plan dès qu'on commence à écrire :
// au moment d'envoyer, il est presque toujours déjà prêt. Aucun cookie, aucun service tiers.
import { computed, reactive, ref } from 'vue'
import { lang, t } from '../i18n/index.js'
import { checkField } from '../lib/contactValidation.js'
import { labelSlot } from '../lib/slotFormat.js'
import AvailabilityPicker from './AvailabilityPicker.vue'

const MOTIFS = ['alternance', 'collaboration', 'projet', 'autre']
const EMPTY = { name: '', email: '', subject: '', message: '', website: '', motif: '', slot: '' }
const form = ref({ ...EMPTY })
const touched = reactive({}) // un champ n'affiche son erreur qu'une fois quitté (ou après un envoi raté), puis elle suit la frappe
const submitted = ref(false)
const sent = ref(null) // ce qui a été envoyé, pour la confirmation personnalisée
const picker = ref(null)
const FIELDS = ['motif', 'name', 'email', 'message']
const errors = computed(() => Object.fromEntries(FIELDS.map((f) => [f, checkField(f, form.value[f])])))
const shown = (f) => (touched[f] || submitted.value) && errors.value[f] ? t(`contactForm.err.${errors.value[f]}`) : ''
const valid = (f) => touched[f] && !errors.value[f]
const touch = (f) => { touched[f] = true }
const placeholder = computed(() => t(`contactForm.ph.${form.value.motif || 'default'}`))
const left = computed(() => 4000 - form.value.message.length)
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
  submitted.value = true
  if (FIELDS.some((f) => errors.value[f])) { error.value = t('contactForm.fix'); return } // on laisse le serveur seul juge, mais pas de requête inutile
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
    if (!r.ok) { pow = null; const err = new Error(d.error || ''); err.status = r.status; throw err } // le défi ne sert qu'une fois
    pow = null
    sent.value = { name: form.value.name.trim().split(/\s+/)[0], email: form.value.email.trim(), motif: form.value.motif, slot: form.value.slot }
    state.value = 'sent'
    form.value = { ...EMPTY }
    for (const k of Object.keys(touched)) delete touched[k]
    submitted.value = false
  } catch (e) {
    if (form.value.slot && (e.status === 409 || /créneau/i.test(e.message))) { form.value.slot = ''; picker.value?.reload() } // créneau pris entre-temps : on le retire et on rafraîchit
    error.value = e.message && e.message !== 'challenge' && e.message !== 'Failed to fetch' ? e.message : t('contactForm.fail')
    state.value = 'idle'
  }
}
</script>

<template>
  <div class="cf">
    <div v-if="state === 'sent' && sent" class="done" role="status">
      <h2>{{ t('contactForm.sentTitle') }}</h2>
      <p>{{ t(`contactForm.done.${sent.motif || 'autre'}`).replace('{name}', sent.name) }}</p>
      <p v-if="sent.slot" class="slotline">{{ t('contactForm.doneSlot') }} <strong>{{ labelSlot(sent.slot, lang) }}</strong> ({{ t('contactForm.slotTz') }}).<br><span>{{ t('contactForm.doneSlotNote') }}</span></p>
      <p class="note">{{ t('contactForm.doneTo') }} {{ sent.email }}</p>
      <button class="btn outline" type="button" @click="state = 'idle'">{{ t('contactForm.again') }}</button>
    </div>
    <form v-else novalidate @submit.prevent="submit" @focusin="warmUp">
      <h2>{{ t('contactForm.title') }}</h2>

      <fieldset class="motifs" :aria-describedby="shown('motif') ? 'err-motif' : null">
        <legend>{{ t('contactForm.motif') }}</legend>
        <div class="chips">
          <label v-for="m in MOTIFS" :key="m" class="chip" :class="{ on: form.motif === m }">
            <input v-model="form.motif" type="radio" name="motif" :value="m" @change="touch('motif')">{{ t(`contactForm.motif.${m}`) }}
          </label>
        </div>
        <p v-if="shown('motif')" id="err-motif" class="fe">{{ shown('motif') }}</p>
      </fieldset>

      <div class="two">
        <label>{{ t('contactForm.name') }}
          <input v-model="form.name" required maxlength="80" autocomplete="name" :aria-invalid="!!shown('name')" :aria-describedby="shown('name') ? 'err-name' : null" @blur="touch('name')">
          <span v-if="shown('name')" id="err-name" class="fe">{{ shown('name') }}</span><span v-else-if="valid('name')" class="fo">✓ {{ t('contactForm.ok') }}</span>
        </label>
        <label>{{ t('contactForm.email') }}
          <input v-model="form.email" type="email" required maxlength="254" autocomplete="email" inputmode="email" :aria-invalid="!!shown('email')" :aria-describedby="shown('email') ? 'err-email' : null" @blur="touch('email')">
          <span v-if="shown('email')" id="err-email" class="fe">{{ shown('email') }}</span><span v-else-if="valid('email')" class="fo">✓ {{ t('contactForm.ok') }}</span>
        </label>
      </div>
      <label>{{ t('contactForm.subject') }}<input v-model="form.subject" maxlength="120"></label>
      <label>{{ t('contactForm.message') }}
        <textarea v-model="form.message" required maxlength="4000" rows="6" :placeholder="placeholder" :aria-invalid="!!shown('message')" :aria-describedby="shown('message') ? 'err-message' : null" @blur="touch('message')" />
        <span class="meta">
          <span v-if="shown('message')" id="err-message" class="fe">{{ shown('message') }}</span><span v-else-if="valid('message')" class="fo">✓ {{ t('contactForm.ok') }}</span><span v-else />
          <span class="count" :class="{ warn: left < 200 }">{{ form.message.length }} / 4000 {{ t('contactForm.chars') }}</span>
        </span>
      </label>

      <AvailabilityPicker ref="picker" v-model="form.slot" />

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
h2{margin:0;font:600 22px var(--serif);color:#f3fbf5}
.cf p{margin:0}
label{display:grid;gap:6px;color:#f3fbf5;font-weight:600}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:16px}
input,textarea{width:100%;min-width:0;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(184,216,194,.5);border-radius:12px;background:#f3fbf5;color:#0b1f14;font:inherit;font-weight:400}
input{min-height:46px}
textarea{resize:vertical;min-height:140px}
input:focus,textarea:focus{outline:3px solid #39ff88;outline-offset:1px}
.motifs{margin:0;padding:0;border:0;display:grid;gap:8px;min-width:0}
.motifs legend{padding:0;margin-bottom:8px;color:#f3fbf5;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid rgba(184,216,194,.5);border-radius:999px;color:#f3fbf5;font-weight:600;cursor:pointer;position:relative}
.chip input{position:absolute;opacity:0;inset:0;min-height:0;cursor:pointer}
.chip.on{background:#39ff88;border-color:#39ff88;color:#052e16}
.chip:focus-within{outline:3px solid #39ff88;outline-offset:2px}
.fe{color:#ffb4a9;font-weight:600;font-size:14px}
.fo{color:#8ff0b4;font-weight:500;font-size:14px}
.meta{display:flex;justify-content:space-between;gap:12px;font-size:14px}
.count{color:#b8d8c2;font-weight:400}.count.warn{color:#ffd37a}
input[aria-invalid=true],textarea[aria-invalid=true]{border-color:#ff8a7a;outline:2px solid #ff8a7a}
.slotline{color:#f3fbf5}.slotline span{color:#b8d8c2;font-size:14px}
.trap{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.err{color:#ffb4a9;font-weight:600}
.foot{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center}
.note{color:#b8d8c2;font-size:14px}
.note a{color:#39ff88}
.light{background:#39ff88;border-color:#39ff88;color:#052e16}
.light:disabled{opacity:.7;cursor:progress}
.outline{background:transparent;border-color:#b8d8c2;color:#f3fbf5}
</style>
