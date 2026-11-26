<script setup>
// Démo 1 : hachage. Montre l'effet avalanche, pourquoi on sale un mot de passe, et pourquoi la lenteur est une qualité.
import { computed, onMounted, ref, watch } from 'vue'
import { bitDiff, pbkdf2, sha, toHex } from '../../lib/cyber/crypto.js'
import { COMMON } from '../../lib/cyber/password.js'

const input = ref('motdepasse')
const ALGOS = [
  { name: 'SHA-1', note: 'Cassé : des collisions ont été produites en 2017. À proscrire.', tag: 'bad', label: 'Cassé' },
  { name: 'SHA-256', note: 'Solide, mais très RAPIDE : un attaquant en teste des milliards par seconde.', tag: 'warn', label: 'Trop rapide seul' },
  { name: 'SHA-512', note: 'Même famille, même défaut pour les mots de passe : la vitesse.', tag: 'warn', label: 'Trop rapide seul' },
]
const hashes = ref({})
const flipped = ref('')
const flippedHash = ref('')
const saltA = ref(''), saltB = ref(''), saltedA = ref(''), saltedB = ref('')
const table = ref(new Map()) // « table arc-en-ciel » : hachages SHA-256 précalculés de mots de passe courants
const iterations = ref(100000)
const kdf = ref({ ms: null, hash: '' })
const busy = ref(false)

// Inverse le dernier bit du dernier caractère : un changement minuscule, pour voir l'effet avalanche
const flip = (s) => (s ? s.slice(0, -1) + String.fromCharCode(s.charCodeAt(s.length - 1) ^ 1) : 'a')
const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(8)))

async function compute() {
  const text = input.value
  const out = {}
  for (const a of ALGOS) out[a.name] = await sha(a.name, text)
  hashes.value = out
  flipped.value = flip(text)
  flippedHash.value = await sha('SHA-256', flipped.value)
  saltedA.value = await sha('SHA-256', saltA.value + text)
  saltedB.value = await sha('SHA-256', saltB.value + text)
}
let timer
watch(input, () => { clearTimeout(timer); timer = setTimeout(compute, 120) })
async function resalt() { saltA.value = newSalt(); saltB.value = newSalt(); await compute() }

// Compare caractère par caractère les deux empreintes pour surligner ce qui a changé
const diffChars = computed(() => {
  const a = hashes.value['SHA-256'] ?? '', b = flippedHash.value
  return [...b].map((c, i) => ({ c, d: c !== a[i] }))
})
const bits = computed(() => (hashes.value['SHA-256'] && flippedHash.value ? bitDiff(hashes.value['SHA-256'], flippedHash.value) : 0))
const found = computed(() => table.value.get(hashes.value['SHA-256']))
const foundSalted = computed(() => table.value.get(saltedA.value))

async function runKdf() {
  busy.value = true
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const t0 = performance.now()
  const h = await pbkdf2(input.value, salt, iterations.value)
  kdf.value = { ms: performance.now() - t0, hash: h }
  busy.value = false
}

onMounted(async () => {
  await resalt()
  const m = new Map()
  for (const w of COMMON) m.set(await sha('SHA-256', w), w)
  table.value = m
  runKdf()
})
</script>

<template>
  <div class="lab">
    <label class="lab-card">Texte à hacher (reste dans ton navigateur)
      <input v-model="input" class="lab-input" maxlength="200" spellcheck="false" autocomplete="off">
    </label>

    <div class="lab-card">
      <h3>1. Une empreinte, rien d'autre</h3>
      <p class="lab-note">Un hachage transforme n'importe quel texte en empreinte de taille fixe. Il est à sens unique : on ne « déchiffre » pas, on compare.</p>
      <div v-for="a in ALGOS" :key="a.name">
        <p><strong>{{ a.name }}</strong> <span class="lab-tag" :class="a.tag">{{ a.label }}</span> <span class="lab-note">{{ a.note }}</span></p>
        <pre class="lab-out">{{ hashes[a.name] }}</pre>
      </div>
    </div>

    <div class="lab-card">
      <h3>2. L'effet avalanche</h3>
      <p class="lab-note">Je change un seul bit du dernier caractère (« {{ input }} » → « {{ flipped }} »). Environ la moitié des bits de l'empreinte SHA-256 change.</p>
      <pre class="lab-out"><span v-for="(x, i) in diffChars" :key="i" :class="{ 'lab-diff': x.d }">{{ x.c }}</span></pre>
      <p><strong>{{ bits }} bits sur 256</strong> ont changé ({{ Math.round((bits / 256) * 100) }} %).</p>
    </div>

    <div class="lab-card">
      <h3>3. Pourquoi saler ?</h3>
      <p class="lab-note">Sans sel, deux utilisateurs avec le même mot de passe ont la même empreinte, et un attaquant peut précalculer une table (« arc-en-ciel ») des mots de passe courants. Ci-dessous, une table de {{ table.size }} mots de passe courants.</p>
      <p><strong>SHA-256 sans sel</strong></p>
      <pre class="lab-out">{{ hashes['SHA-256'] }}</pre>
      <p v-if="found" class="lab-bad" role="status">✗ Retrouvé instantanément dans la table : « {{ found }} »</p>
      <p v-else class="lab-ok" role="status">✓ Absent de la table (essaie « soleil », « azerty » ou « dragon »).</p>
      <div class="lab-grid">
        <div><p><strong>Avec le sel A</strong> <code class="lab-code">{{ saltA }}</code></p><pre class="lab-out">{{ saltedA }}</pre></div>
        <div><p><strong>Avec le sel B</strong> <code class="lab-code">{{ saltB }}</code></p><pre class="lab-out">{{ saltedB }}</pre></div>
      </div>
      <p v-if="foundSalted" class="lab-bad">✗ Retrouvé malgré le sel (le sel n'était pas assez aléatoire).</p>
      <p v-else class="lab-ok">✓ Même mot de passe, empreintes différentes : la table précalculée ne sert plus à rien.</p>
      <button class="lab-btn" type="button" @click="resalt">Tirer de nouveaux sels</button>
    </div>

    <div class="lab-card">
      <h3>4. La lenteur est une qualité (PBKDF2)</h3>
      <p class="lab-note">Pour stocker un mot de passe, on veut une fonction volontairement LENTE : l'utilisateur attend 0,2 s une fois, l'attaquant attend 0,2 s par essai.</p>
      <div class="lab-row">
        <label>Itérations
          <select v-model.number="iterations" @change="runKdf">
            <option :value="1">1</option><option :value="10000">10 000</option><option :value="100000">100 000</option><option :value="600000">600 000 (recommandation OWASP)</option>
          </select>
        </label>
        <button class="lab-btn primary" type="button" :disabled="busy" @click="runKdf">{{ busy ? 'Calcul…' : 'Mesurer' }}</button>
      </div>
      <p v-if="kdf.ms !== null" role="status"><strong>{{ kdf.ms.toFixed(1) }} ms</strong> pour une empreinte, soit environ <strong>{{ Math.max(1, Math.round(1000 / Math.max(kdf.ms, 0.01))).toLocaleString('fr-FR') }} essais par seconde</strong> et par cœur pour un attaquant.</p>
      <pre v-if="kdf.hash" class="lab-out">{{ kdf.hash }}</pre>
      <p class="lab-note">En production : Argon2id ou bcrypt, avec un sel unique par mot de passe. Le sel est stocké à côté de l'empreinte, il n'a pas besoin d'être secret.</p>
    </div>
  </div>
</template>
