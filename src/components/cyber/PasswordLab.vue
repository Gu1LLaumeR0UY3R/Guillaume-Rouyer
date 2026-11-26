<script setup>
// Démo 2 : robustesse d'un mot de passe, calculée localement (rien n'est envoyé). Plus un générateur sûr.
import { computed, ref } from 'vue'
import { estimate, generate, humanTime } from '../../lib/cyber/password.js'

const pw = ref('')
const show = ref(false)
const est = computed(() => estimate(pw.value))
const COLORS = ['#c0392b', '#d35400', '#b7791f', '#2e8b57', '#1f7a3d']

const len = ref(20)
const opts = ref({ lower: true, upper: true, digits: true, symbols: true })
const generated = ref(generate(20))
const genEst = computed(() => estimate(generated.value))
const copied = ref(false)
const regen = () => { generated.value = generate(len.value, opts.value); copied.value = false }
async function copy() {
  try { await navigator.clipboard.writeText(generated.value); copied.value = true } catch { copied.value = false }
}
</script>

<template>
  <div class="lab">
    <div class="lab-card">
      <label>Tape un mot de passe à tester
        <input v-model="pw" :type="show ? 'text' : 'password'" class="lab-input" autocomplete="off" spellcheck="false" maxlength="128">
      </label>
      <div class="lab-row">
        <label><input v-model="show" type="checkbox"> Afficher</label>
        <span class="lab-note">🔒 Calcul 100 % local. Ouvre l'onglet « Réseau » des outils de développement : aucune requête ne part.</span>
      </div>
      <div v-if="est" :style="{ color: COLORS[est.score] }">
        <div class="lab-meter" role="img" :aria-label="`Robustesse : ${est.label}`"><i v-for="n in 5" :key="n" :class="{ on: n <= est.score + 1 }" /></div>
        <p role="status"><strong>{{ est.label }}</strong> · environ {{ Math.round(est.bits) }} bits d'entropie · alphabet de {{ est.pool }} caractères</p>
      </div>
      <p v-else class="lab-note">Commence à taper pour voir l'analyse.</p>
    </div>

    <div v-if="est" class="lab-card">
      <h3>Temps moyen pour le casser</h3>
      <table class="lab-table">
        <tbody><tr v-for="s in est.speeds" :key="s.id"><td>{{ s.label }}</td><td><strong>{{ humanTime(s.seconds) }}</strong></td></tr></tbody>
      </table>
      <p class="lab-note">Estimation prudente. La même clé peut tomber en une seconde ou tenir mille ans selon la façon dont le site stocke les mots de passe (voir l'onglet Hachage).</p>
      <template v-if="est.patterns.length">
        <h3>Points faibles détectés</h3>
        <ul><li v-for="p in est.patterns" :key="p.id" class="lab-warn">⚠ {{ p.text }}</li></ul>
      </template>
      <p v-else class="lab-ok">✓ Aucun motif prévisible détecté.</p>
    </div>

    <div class="lab-card">
      <h3>Générateur sûr</h3>
      <p class="lab-note">Utilise l'aléa cryptographique du navigateur (<code>crypto.getRandomValues</code>), pas <code>Math.random()</code>, qui est prévisible.</p>
      <div class="lab-row">
        <label>Longueur : {{ len }} <input v-model.number="len" type="range" min="8" max="64" @input="regen"></label>
        <label><input v-model="opts.lower" type="checkbox" @change="regen"> a-z</label>
        <label><input v-model="opts.upper" type="checkbox" @change="regen"> A-Z</label>
        <label><input v-model="opts.digits" type="checkbox" @change="regen"> 0-9</label>
        <label><input v-model="opts.symbols" type="checkbox" @change="regen"> !@#</label>
      </div>
      <pre class="lab-out" style="font-size:16px">{{ generated || 'Choisis au moins une famille de caractères' }}</pre>
      <div class="lab-row">
        <button class="lab-btn primary" type="button" @click="regen">Régénérer</button>
        <button class="lab-btn" type="button" :disabled="!generated" @click="copy">{{ copied ? 'Copié ✓' : 'Copier' }}</button>
        <span v-if="genEst" class="lab-note">≈ {{ Math.round(genEst.bits) }} bits · {{ genEst.label }}</span>
      </div>
    </div>
  </div>
</template>
