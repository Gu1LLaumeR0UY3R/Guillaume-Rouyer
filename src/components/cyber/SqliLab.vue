<script setup>
// Démo 4 : injection SQL. Une page de connexion simulée (table fictive en mémoire, aucune vraie base).
import { computed, ref } from 'vue'
import { USERS, preparedLogin, runSql, SqlError, vulnerableQuery } from '../../lib/cyber/sqlSim.js'

const user = ref('alice')
const pass = ref('azerty123')
const mode = ref('vuln') // vuln = requête construite par concaténation · safe = requête préparée

const PRESETS = [
  { label: 'Connexion normale', u: 'alice', p: 'azerty123' },
  { label: "Toujours vrai (OR '1'='1')", u: "' OR '1'='1", p: "' OR '1'='1" },
  { label: "Commentaire (admin'--)", u: "admin'--", p: 'nimporte' },
  { label: 'UNION : voler la table', u: "x' UNION SELECT id, username, password FROM users --", p: 'x' },
  { label: 'Erreur de syntaxe', u: "o'brien", p: 'x' },
  { label: 'Requête empilée (DROP)', u: "x'; DROP TABLE users; --", p: 'x' },
]
const use = (x) => { user.value = x.u; pass.value = x.p }

// Requête effectivement envoyée à la base, découpée pour surligner la part contrôlée par le visiteur
const query = computed(() => vulnerableQuery(user.value, pass.value))
const pieces = computed(() => [
  { t: "SELECT id, username, role FROM users WHERE username = '" }, { t: user.value, mark: true },
  { t: "' AND password = '" }, { t: pass.value, mark: true }, { t: "'" },
])

const result = computed(() => {
  if (mode.value === 'safe') return { kind: 'ok', ...preparedLogin(user.value, pass.value) }
  try { return { kind: 'ok', ...runSql(query.value) } } catch (e) {
    if (e instanceof SqlError) return { kind: 'error', message: e.message }
    throw e
  }
})
const leaked = computed(() => result.value.kind === 'ok' && result.value.rows.length > 1)
</script>

<template>
  <div class="lab">
    <div class="lab-card">
      <h3>Page de connexion simulée</h3>
      <p class="lab-note">Table fictive <code>users</code> (3 comptes). Les mots de passe y sont en clair : c'est volontaire, pour que la fuite se voie.</p>
      <div class="lab-chips" role="group" aria-label="Exemples d'attaques">
        <button v-for="x in PRESETS" :key="x.label" class="lab-chip" type="button" @click="use(x)">{{ x.label }}</button>
      </div>
      <div class="lab-grid">
        <label>Nom d'utilisateur<input v-model="user" class="lab-input" maxlength="150" spellcheck="false" autocomplete="off"></label>
        <label>Mot de passe<input v-model="pass" class="lab-input" maxlength="150" spellcheck="false" autocomplete="off"></label>
      </div>
      <div class="lab-row" role="radiogroup" aria-label="Mode du serveur">
        <label><input v-model="mode" type="radio" value="vuln"> Code vulnérable (concaténation)</label>
        <label><input v-model="mode" type="radio" value="safe"> Code sécurisé (requête préparée)</label>
      </div>
    </div>

    <div class="lab-card">
      <h3>Ce que la base reçoit</h3>
      <pre v-if="mode === 'vuln'" class="lab-out"><template v-for="(x, i) in pieces" :key="i"><mark v-if="x.mark" class="lab-diff">{{ x.t }}</mark><template v-else>{{ x.t }}</template></template></pre>
      <template v-else>
        <pre class="lab-out">SELECT id, username, role FROM users WHERE username = ? AND password = ?</pre>
        <pre class="lab-out">paramètres : [{{ JSON.stringify(user) }}, {{ JSON.stringify(pass) }}]</pre>
        <p class="lab-note">La structure de la requête est fixée AVANT les valeurs. Les saisies sont des données, jamais du code : une apostrophe n'est qu'une apostrophe.</p>
      </template>
      <p v-if="mode === 'vuln'" class="lab-note">Surligné : ce que le visiteur contrôle. Une simple apostrophe suffit à sortir du texte et à écrire du SQL.</p>
    </div>

    <div class="lab-card" aria-live="polite">
      <h3>Résultat</h3>
      <p v-if="result.kind === 'error'" class="lab-bad">✗ Erreur SQL : {{ result.message }}</p>
      <p v-else-if="!result.rows.length" class="lab-warn">Identifiants incorrects (aucune ligne).</p>
      <template v-else>
        <p :class="leaked ? 'lab-bad' : 'lab-ok'">{{ leaked ? '✗ Plusieurs lignes renvoyées : le contrôle du mot de passe est contourné ou les données fuient.' : `✓ Connecté en tant que « ${result.rows[0][1]} »` }}</p>
        <div class="lab-scroll"><table class="lab-table">
          <thead><tr><th v-for="c in result.cols" :key="c">{{ c }}</th></tr></thead>
          <tbody><tr v-for="(r, i) in result.rows" :key="i"><td v-for="(c, j) in r" :key="j">{{ c }}</td></tr></tbody>
        </table></div>
      </template>
      <p v-if="mode === 'vuln' && user.includes('DROP')" class="lab-note">Une 2e requête après « ; » est refusée par beaucoup de pilotes, mais pas tous : ne compte jamais là-dessus.</p>
      <p class="lab-note">Comptes de la table : {{ USERS.map((u) => u.username).join(', ') }}.</p>
    </div>
  </div>
</template>
