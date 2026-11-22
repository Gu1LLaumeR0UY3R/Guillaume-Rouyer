<script setup>
// Trois petits défis (calcul, image, curseur) avant de télécharger le CV : pas de service tiers, pas de cookie.
// Tout se fait au clavier ; le serveur vérifie les réponses et fournit un lien valable 2 minutes.
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cvGateOpen, openCv } from '../content/cvGate.js'

const dlg = ref(null)
const route = useRoute()
const router = useRouter()
const state = ref('idle') // idle | loading | ready | sending | done | error
const message = ref('')
const ch = ref(null)
const a = reactive({ calc: '', pick: '', slide: null })

const touched = reactive({ slide: false })
const done = computed(() => [a.calc.trim() !== '', a.pick !== '', touched.slide])
const ready = computed(() => done.value.every(Boolean))

async function load() {
  state.value = 'loading'; ch.value = null
  Object.assign(a, { calc: '', pick: '', slide: 0 }); touched.slide = false
  try {
    const r = await fetch('/api/cv/challenge', { credentials: 'same-origin' })
    if (!r.ok) throw new Error()
    ch.value = await r.json(); state.value = 'ready'
    await nextTick(); dlg.value?.querySelector('input')?.focus()
  } catch { state.value = 'error'; message.value = 'Impossible de préparer les défis pour le moment. Réessaie dans un instant.' }
}

async function submit() {
  if (!ready.value || state.value !== 'ready') return
  state.value = 'sending'; message.value = ''
  try {
    const r = await fetch('/api/cv/verify', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce: ch.value.nonce, iat: ch.value.iat, sig: ch.value.sig, answers: [a.calc, a.pick, String(a.slide)] }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { message.value = d.error || 'Vérification impossible.'; await load(); return }
    state.value = 'done'
    window.location.assign(d.url)
  } catch { message.value = 'Erreur réseau. Réessaie.'; await load() }
}

watch(cvGateOpen, (v) => {
  if (v) { dlg.value.showModal(); load() } else if (dlg.value.open) dlg.value.close()
})
function close() { cvGateOpen.value = false }
onMounted(() => {
  // Lien direct /cv.pdf sans défis : le serveur renvoie vers /?cv=1
  if (route.query.cv === '1') { openCv(); const { cv, ...rest } = route.query; router.replace({ query: rest }) }
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dlg" class="cv-dlg" aria-labelledby="cv-title" @close="close" @cancel="close">
      <form class="box" novalidate @submit.prevent="submit">
        <header>
          <h2 id="cv-title">Télécharger mon CV</h2>
          <button type="button" class="x" aria-label="Fermer" @click="dlg.close()">×</button>
        </header>
        <p class="hint">Trois petits défis pour vérifier que tu n'es pas un robot. Aucun cookie, aucun service extérieur.</p>

        <ol class="steps" aria-label="Progression">
          <li v-for="(d, i) in done" :key="i" :class="{ ok: d }"><span class="sr">Défi {{ i + 1 }} :</span>{{ d ? '✓' : i + 1 }}</li>
        </ol>

        <p v-if="message" class="err" role="alert">{{ message }}</p>
        <p v-if="state === 'loading'" class="hint" role="status">Préparation des défis…</p>

        <template v-if="ch && (state === 'ready' || state === 'sending')">
          <fieldset>
            <legend>Défi 1 · {{ ch.questions[0].text }}</legend>
            <label class="sr" for="cv-calc">Ta réponse (un nombre)</label>
            <input id="cv-calc" v-model="a.calc" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="Ton résultat en chiffres" />
          </fieldset>

          <fieldset>
            <legend>Défi 2 · {{ ch.questions[1].text }}</legend>
            <div class="opts" role="radiogroup" :aria-label="ch.questions[1].text">
              <label v-for="o in ch.questions[1].options" :key="o.label" :class="{ on: a.pick === o.label }">
                <input v-model="a.pick" type="radio" name="cv-pick" :value="o.label" />
                <span class="emo" aria-hidden="true">{{ o.emoji }}</span><span>{{ o.label }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Défi 3 · {{ ch.questions[2].text }}</legend>
            <label class="sr" for="cv-slide">Curseur, de {{ ch.questions[2].min }} à {{ ch.questions[2].max }}</label>
            <div class="slide">
              <input id="cv-slide" v-model.number="a.slide" type="range" :min="ch.questions[2].min" :max="ch.questions[2].max" :step="ch.questions[2].step" @input="touched.slide = true" @change="touched.slide = true" @keydown="touched.slide = true" />
              <output for="cv-slide">{{ a.slide }}</output>
            </div>
          </fieldset>

          <div class="bar">
            <button class="btn btn-primary" type="submit" :disabled="!ready || state === 'sending'">{{ state === 'sending' ? 'Vérification…' : 'Vérifier et télécharger' }}</button>
            <button class="btn btn-ghost" type="button" @click="dlg.close()">Annuler</button>
          </div>
        </template>

        <div v-if="state === 'error'" class="bar"><button class="btn btn-primary" type="button" @click="load">Réessayer</button></div>
        <p v-if="state === 'done'" role="status" class="hint">Téléchargement lancé. S'il ne démarre pas, relance la vérification.</p>
      </form>
    </dialog>
  </Teleport>
</template>

<style scoped>
.cv-dlg{width:min(480px,94vw);max-height:92vh;padding:0;border:1px solid var(--line);border-radius:18px;background:var(--bg);color:var(--fg);overflow:auto}
.cv-dlg::backdrop{background:rgba(0,0,0,.55)}
.box{display:grid;gap:14px;padding:20px 22px 22px}
header{display:flex;justify-content:space-between;align-items:center}
h2{margin:0;font-size:22px}
.x{width:40px;height:40px;border:1px solid var(--line);border-radius:50%;background:var(--card);color:var(--fg);font-size:24px;line-height:1;cursor:pointer}
.hint{margin:0;color:var(--muted);font-size:14px}
.err{margin:0;padding:10px 12px;border:1px solid #b3261e;border-radius:10px;color:#b3261e;font-weight:600}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.steps{display:flex;gap:8px;margin:0;padding:0;list-style:none}
.steps li{display:grid;place-items:center;width:32px;height:32px;border:2px solid var(--line);border-radius:50%;font-weight:700;font-size:14px}
.steps li.ok{border-color:var(--green);background:var(--green);color:var(--on-green)}
fieldset{display:grid;gap:10px;margin:0;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
legend{padding:0 6px;font-weight:700}
input[type=text]{min-height:46px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg);font:18px var(--font)}
.opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.opts label{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 12px;border:2px solid var(--line);border-radius:12px;background:var(--bg);cursor:pointer;font-weight:600}
.opts label.on{border-color:var(--green);background:color-mix(in srgb,var(--green) 12%,var(--bg))}
.opts input{position:absolute;opacity:0}
.opts label:focus-within,input[type=text]:focus-visible,.slide input:focus-visible{outline:3px solid var(--green);outline-offset:2px}
.emo{font-size:26px}
.slide{display:flex;align-items:center;gap:14px}
.slide input{flex:1;height:32px;accent-color:var(--green)}
.slide output{min-width:3ch;font:700 20px var(--font);text-align:right}
.bar{display:flex;flex-wrap:wrap;gap:10px}
</style>
