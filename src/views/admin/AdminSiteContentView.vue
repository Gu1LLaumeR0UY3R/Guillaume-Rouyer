<script setup>
// Édition des textes du site : accueil, à propos, compétences, parcours. Chaque texte existe en français et en anglais.
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { takeDraft } from '../../admin/draftResume.js'
import { defaults } from '../../content/siteDefaults.js'
import DraftBar from './DraftBar.vue'
import './adminForm.css'

const TABS = [['home', 'Accueil'], ['about', 'À propos'], ['skills', 'Compétences'], ['timeline', 'Parcours'], ['contact', 'Contact'], ['legal', 'Mentions légales'], ['privacy', 'Confidentialité'], ['now', 'Maintenant'], ['tools', 'Mes outils'], ['changelog', 'Changelog']]
const tab = ref(new URLSearchParams(location.search).get('onglet') || 'home')
if (!TABS.some(([k]) => k === tab.value)) tab.value = 'home'

const data = reactive({ home: null, about: null, skills: null, timeline: null, contact: null, legal: null, privacy: null, now: null, tools: null, changelog: null })
const saved = reactive({ home: '', about: '', skills: '', timeline: '', contact: '', legal: '', privacy: '', now: '', tools: '', changelog: '' })
const custom = reactive({ home: false, about: false, skills: false, timeline: false, contact: false, legal: false, privacy: false, now: false, tools: false, changelog: false })
const busy = ref(false), error = ref(''), loading = ref(true)

const lines = (a) => (a ?? []).map((x) => x.trim()).filter(Boolean)
// Version propre envoyée au serveur (sans lignes vides)
function clean(key) {
  const d = JSON.parse(JSON.stringify(data[key]))
  // Les lignes laissées vides sont ignorées
  if (key === 'about') { d.bios = d.bios.filter((b) => b.text_fr.trim()); d.facts = d.facts.filter((f) => f.text_fr.trim()) }
  if (key === 'skills') for (const g of d.groups) g.items = g.items.filter((it) => it.name.trim())
  if (key === 'timeline') for (const l of ['formation', 'experience']) for (const e of d[l]) { e.points_fr = lines(e.points_fr); e.points_en = lines(e.points_en) }
  return d
}
const snap = (key) => JSON.stringify(clean(key))
const dirty = (key) => !loading.value && data[key] && snap(key) !== saved[key]
const anyDirty = computed(() => TABS.some(([k]) => dirty(k)))

async function load() {
  try {
    const base = defaults()
    await Promise.all(TABS.map(async ([k]) => {
      const d = await api(`/api/admin/content/${k}`)
      custom[k] = Object.keys(d).some((x) => x !== 'updatedAt')
      const { updatedAt, ...rest } = d
      data[k] = custom[k] ? rest : base[k]
      saved[k] = snap(k)
    }))
  } catch (e) { error.value = e.message } finally { loading.value = false }
  const d = await takeDraft('content', tab.value)
  if (d) data[tab.value] = d
}
const warn = (e) => { if (anyDirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => { load(); window.addEventListener('beforeunload', warn) })
onBeforeUnmount(() => window.removeEventListener('beforeunload', warn))

function go(k) { tab.value = k; history.replaceState(null, '', `?onglet=${k}`) }

async function save(key) {
  busy.value = true
  try {
    await api(`/api/admin/content/${key}`, { method: 'PUT', body: clean(key) })
    saved[key] = snap(key); custom[key] = true
    toast("Enregistré : visible sur le site d'ici quelques secondes", 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
async function reset(key) {
  if (!confirm("Revenir aux textes d'origine ? Tes modifications enregistrées seront effacées.")) return
  busy.value = true
  try {
    await api(`/api/admin/content/${key}`, { method: 'DELETE' })
    data[key] = defaults()[key]; saved[key] = snap(key); custom[key] = false
    toast("Textes d'origine rétablis", 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}

// Listes : ajouter, supprimer, déplacer
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; ;[arr[i], arr[j]] = [arr[j], arr[i]] }
const del = (arr, i, what) => { if (confirm(`Supprimer ${what} ?`)) arr.splice(i, 1) }
const newEntry = () => ({ when_fr: '', when_en: '', title_fr: '', title_en: '', place_fr: '', place_en: '', points_fr: [], points_en: [], tech: '' })
const setLevel = (it, e) => { it.level = Math.max(0, Math.min(100, Math.round(+e.target.value) || 0)) }
const pts = (e, l) => (e[`points_${l}`] ?? []).join('\n')
const setPts = (e, l, ev) => { e[`points_${l}`] = ev.target.value.split('\n') }
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const addSection = (d) => d.sections.push({ title: 'Nouvelle section', body: '' })
const TL = [['formation', 'Formation', 'cette formation'], ['experience', 'Expériences', 'cette expérience']]
</script>

<template>
  <main class="admin wide">
    <RouterLink to="/admin/contenu" class="hint">← Tous les contenus</RouterLink>
    <h1>Modifier un texte du site</h1>
    <p class="hint">Les textes de l'accueil et de la page À propos. Chaque texte a une version française et une version anglaise : si l'anglais est vide, le français s'affiche.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <nav class="tabs" aria-label="Type de contenu">
      <button v-for="[k, n] in TABS" :key="k" type="button" :class="{ on: tab === k }" :aria-current="tab === k ? 'page' : undefined" @click="go(k)">
        {{ n }}<i v-if="dirty(k)" class="dot" title="Modifications non enregistrées" />
      </button>
    </nav>

    <template v-if="!loading && !error">
      <div v-for="[key] in TABS" v-show="tab === key" :key="key">
        <div class="bar sticky">
          <button class="btn btn-primary" type="button" :disabled="busy || !dirty(key)" @click="save(key)">{{ busy ? 'Enregistrement…' : 'Enregistrer' }}</button>
          <span v-if="dirty(key)" class="dirty">Modifications non enregistrées</span>
          <span v-else class="hint">{{ custom[key] ? 'Textes modifiés.' : "Textes d'origine (jamais modifiés)." }}</span>
          <span class="spacer" />
          <button v-if="custom[key]" class="btn btn-ghost small btn-danger" type="button" :disabled="busy" @click="reset(key)">Revenir à l'origine</button>
        </div>

        <DraftBar v-if="tab === key" kind="content" :ref-key="key" :get-data="() => clean(key)" />

        <!-- ACCUEIL -->
        <section v-if="key === 'home'" class="card">
          <h2>En-tête de la page d'accueil</h2>
          <div class="pair head"><span>Français</span><span>English</span></div>
          <div class="pair"><label>Badge<input v-model="data.home.badge_fr" maxlength="160"></label><label>Badge<input v-model="data.home.badge_en" maxlength="160"></label></div>
          <div class="pair"><label>Titre<input v-model="data.home.titleA_fr" maxlength="80"></label><label>Titre<input v-model="data.home.titleA_en" maxlength="80"></label></div>
          <div class="pair"><label>Mot en couleur (à la fin du titre)<input v-model="data.home.titleB_fr" maxlength="40"></label><label>Mot en couleur<input v-model="data.home.titleB_en" maxlength="40"></label></div>
          <div class="pair"><label>Présentation<textarea v-model="data.home.lead_fr" rows="4" maxlength="400" /></label><label>Présentation<textarea v-model="data.home.lead_en" rows="4" maxlength="400" /></label></div>
          <div class="pair"><label>Texte du bouton<input v-model="data.home.cta_fr" maxlength="40"></label><label>Texte du bouton<input v-model="data.home.cta_en" maxlength="40"></label></div>
          <div class="preview-box" aria-hidden="true">
            <p class="p-badge">{{ data.home.badge_fr }}</p>
            <p class="p-title">{{ data.home.titleA_fr }} <span>{{ data.home.titleB_fr }}</span>.</p>
            <p class="p-lead">{{ data.home.lead_fr }}</p>
            <span class="p-btn">{{ data.home.cta_fr }}</span>
          </div>
        </section>

        <!-- À PROPOS -->
        <template v-if="key === 'about'">
          <section class="card">
            <h2>Paragraphes de présentation <small>({{ data.about.bios.length }})</small></h2>
            <div v-for="(b, i) in data.about.bios" :key="i" class="item">
              <div class="pair"><label>Paragraphe {{ i + 1 }} (français)<textarea v-model="b.text_fr" rows="5" maxlength="1200" /></label><label>Paragraphe {{ i + 1 }} (anglais)<textarea v-model="b.text_en" rows="5" maxlength="1200" /></label></div>
              <div class="actions">
                <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(data.about.bios, i, -1)">↑</button>
                <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(data.about.bios, i, 1)">↓</button>
                <button class="btn btn-ghost small btn-danger" type="button" @click="del(data.about.bios, i, 'ce paragraphe')">Supprimer</button>
              </div>
            </div>
            <button class="btn btn-ghost small add" type="button" :disabled="data.about.bios.length >= 6" @click="data.about.bios.push({ text_fr: '', text_en: '' })">+ Paragraphe</button>
          </section>
          <section class="card">
            <h2>Infos rapides <small>({{ data.about.facts.length }})</small></h2>
            <p class="hint">Les petites pastilles sous le texte (ville, langues…).</p>
            <div v-for="(f, i) in data.about.facts" :key="i" class="item row">
              <div class="pair"><label>Français<input v-model="f.text_fr" maxlength="80"></label><label>English<input v-model="f.text_en" maxlength="80"></label></div>
              <div class="actions">
                <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(data.about.facts, i, -1)">↑</button>
                <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(data.about.facts, i, 1)">↓</button>
                <button class="btn btn-ghost small btn-danger" type="button" @click="del(data.about.facts, i, 'cette info')">Supprimer</button>
              </div>
            </div>
            <button class="btn btn-ghost small add" type="button" :disabled="data.about.facts.length >= 12" @click="data.about.facts.push({ text_fr: '', text_en: '' })">+ Info</button>
          </section>
        </template>

        <!-- COMPÉTENCES -->
        <template v-if="key === 'skills'">
          <p class="hint">Le niveau (0 à 100) dessine une jauge sous la compétence. À 0, aucune jauge n'est affichée.</p>
          <section v-for="(g, gi) in data.skills.groups" :key="gi" class="card">
            <div class="pair"><label>Nom du groupe (français)<input v-model="g.title_fr" maxlength="60"></label><label>Group name (English)<input v-model="g.title_en" maxlength="60"></label></div>
            <div v-for="(it, i) in g.items" :key="i" class="skill">
              <input v-model="it.name" maxlength="40" :aria-label="`Compétence ${i + 1} du groupe ${g.title_fr}`">
              <input type="range" min="0" max="100" step="5" :value="it.level" :aria-label="`Niveau de ${it.name}`" @input="setLevel(it, $event)">
              <input class="lvl" type="number" min="0" max="100" :value="it.level" :aria-label="`Niveau de ${it.name} en chiffres`" @input="setLevel(it, $event)">
              <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(g.items, i, -1)">↑</button>
              <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(g.items, i, 1)">↓</button>
              <button class="btn btn-ghost small btn-danger" type="button" :aria-label="`Supprimer ${it.name}`" @click="g.items.splice(i, 1)">✕</button>
            </div>
            <div class="actions left">
              <button class="btn btn-ghost small" type="button" :disabled="g.items.length >= 40" @click="g.items.push({ name: '', level: 0 })">+ Compétence</button>
              <span class="spacer" />
              <button class="btn btn-ghost small" type="button" aria-label="Monter le groupe" @click="move(data.skills.groups, gi, -1)">↑ Groupe</button>
              <button class="btn btn-ghost small" type="button" aria-label="Descendre le groupe" @click="move(data.skills.groups, gi, 1)">↓ Groupe</button>
              <button class="btn btn-ghost small btn-danger" type="button" @click="del(data.skills.groups, gi, `le groupe « ${g.title_fr} »`)">Supprimer le groupe</button>
            </div>
          </section>
          <button class="btn btn-ghost small add" type="button" :disabled="data.skills.groups.length >= 12" @click="data.skills.groups.push({ title_fr: 'Nouveau groupe', title_en: '', items: [] })">+ Groupe</button>
        </template>

        <!-- CONTACT -->
        <section v-if="key === 'contact'" class="card">
          <h2>Section « Contact » (bas de l'accueil)</h2>
          <p class="hint">L'adresse e-mail et les liens GitHub / LinkedIn se changent dans Réglages.</p>
          <div class="pair head"><span>Français</span><span>English</span></div>
          <div class="pair"><label>Titre<input v-model="data.contact.title_fr" maxlength="80"></label><label>Titre<input v-model="data.contact.title_en" maxlength="80"></label></div>
          <div class="pair"><label>Texte<textarea v-model="data.contact.text_fr" rows="3" maxlength="300" /></label><label>Texte<textarea v-model="data.contact.text_en" rows="3" maxlength="300" /></label></div>
        </section>

        <!-- PAGES LÉGALES -->
        <template v-if="['legal', 'privacy', 'now', 'tools', 'changelog'].includes(key)">
          <p v-if="key === 'legal' || key === 'privacy'" class="hint warn">Texte à valeur juridique : relis-le avant d'enregistrer. Pense à changer la date de mise à jour quand tu modifies le fond.</p>
          <section class="card">
            <div class="updated-row">
              <label>Dernière mise à jour (texte affiché)<input v-model="data[key].updated" maxlength="40"></label>
              <button class="btn btn-ghost small" type="button" @click="data[key].updated = today()">Mettre la date d'aujourd'hui</button>
            </div>
            <details class="help"><summary>Comment mettre en forme</summary>
              <ul>
                <li>Une <strong>ligne vide</strong> sépare deux paragraphes. Un simple retour à la ligne reste dans le même paragraphe.</li>
                <li>Des lignes qui commencent par <code>- </code> forment une liste à puces.</li>
                <li>Un lien : <code>[texte du lien](https://exemple.fr)</code>, <code>[écris-moi](mailto:adresse@exemple.fr)</code> ou <code>[page](/mentions-legales)</code>. Les autres types de liens sont refusés.</li>
                <li v-if="key === 'privacy'"><code>[[mesure]]</code> seul sur une ligne affiche le bouton « Ne pas me compter ». Garde-le dans la section sur la mesure d'audience.</li>
              </ul>
            </details>
          </section>
          <section v-for="(sec, i) in data[key].sections" :key="i" class="card">
            <label>Titre de la section<input v-model="sec.title" maxlength="100"></label>
            <label>Texte<textarea v-model="sec.body" rows="9" maxlength="6000" /><span class="hint">{{ sec.body.length }} / 6000</span></label>
            <div class="actions left">
              <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(data[key].sections, i, -1)">↑</button>
              <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(data[key].sections, i, 1)">↓</button>
              <button class="btn btn-ghost small btn-danger" type="button" @click="del(data[key].sections, i, `la section « ${sec.title} »`)">Supprimer</button>
            </div>
          </section>
          <button class="btn btn-ghost small add" type="button" :disabled="data[key].sections.length >= 30" @click="addSection(data[key])">+ Section</button>
        </template>

        <!-- PARCOURS -->
        <template v-if="key === 'timeline'">
          <section v-for="[kind, title, what] in TL" :key="kind" class="card">
            <h2>{{ title }} <small>({{ data.timeline[kind].length }})</small></h2>
            <div v-for="(e, i) in data.timeline[kind]" :key="i" class="item boxed">
              <div class="pair"><label>Période (français)<input v-model="e.when_fr" maxlength="80"></label><label>Period (English)<input v-model="e.when_en" maxlength="80"></label></div>
              <div class="pair"><label>Titre<input v-model="e.title_fr" maxlength="120"></label><label>Title<input v-model="e.title_en" maxlength="120"></label></div>
              <div class="pair"><label>Lieu<input v-model="e.place_fr" maxlength="200"></label><label>Place<input v-model="e.place_en" maxlength="200"></label></div>
              <div class="pair">
                <label>Points (un par ligne)<textarea rows="4" :value="pts(e, 'fr')" @input="setPts(e, 'fr', $event)" /></label>
                <label>Points, English (one per line)<textarea rows="4" :value="pts(e, 'en')" @input="setPts(e, 'en', $event)" /></label>
              </div>
              <label>Technologies (affichées en bleu, identiques dans les deux langues)<input v-model="e.tech" maxlength="160"></label>
              <div class="actions">
                <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(data.timeline[kind], i, -1)">↑</button>
                <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(data.timeline[kind], i, 1)">↓</button>
                <button class="btn btn-ghost small btn-danger" type="button" @click="del(data.timeline[kind], i, what)">Supprimer</button>
              </div>
            </div>
            <button class="btn btn-ghost small add" type="button" :disabled="data.timeline[kind].length >= 15" @click="data.timeline[kind].unshift(newEntry())">+ Ajouter en haut de la liste</button>
          </section>
        </template>
      </div>
    </template>
  </main>
</template>

<style scoped>
.card{display:grid;gap:14px;align-content:start;margin-top:20px;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.card h2{margin:0;font-size:22px}.card h2 small{color:var(--muted);font:400 15px var(--font)}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;padding-bottom:4px;border-bottom:1px solid var(--line)}
.tabs button,.tabs a{position:relative;display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 16px;border:1px solid var(--line);border-bottom:0;border-radius:12px 12px 0 0;background:var(--card);color:var(--fg);font:600 15px var(--font);text-decoration:none;cursor:pointer;transition:background .2s}
.tabs button:hover,.tabs a:hover{background:var(--bg)}
.tabs button.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.tabs a{color:var(--muted)}
.tabs a:first-of-type{margin-left:auto}
.dot{width:9px;height:9px;border-radius:50%;background:#f59e0b}
.sticky{position:sticky;top:0;z-index:20;padding:10px 0;background:var(--bg)}
.dirty{color:#b45309;font-weight:700}
.warn{padding:10px 14px;border:1px solid #f59e0b;border-radius:12px;margin-top:16px}
.updated-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}
.help summary{cursor:pointer;font-weight:600}.help ul{margin:8px 0 0;padding-left:20px;color:var(--muted)}
@media (max-width:600px){.updated-row{grid-template-columns:1fr}}
[data-theme=dark] .dirty{color:#fbbf24}
.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:14px}
.pair.head span{font-weight:700;color:var(--green)}
.item{display:grid;gap:10px}
.item.boxed{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}
.actions.left{justify-content:flex-start;align-items:center}
.actions .spacer{flex:1}
.add{justify-self:start;margin-top:14px}
.skill{display:grid;grid-template-columns:minmax(120px,1fr) minmax(100px,180px) 72px auto auto auto;gap:8px;align-items:center}
.skill input[type=range]{min-height:auto;padding:0;accent-color:var(--green)}
.skill .lvl{text-align:center}
@media (max-width:700px){.skill{grid-template-columns:1fr 1fr 72px}.skill .btn{grid-column:auto}}
.preview-box{display:grid;gap:8px;padding:18px;border:1px dashed var(--line);border-radius:12px;background:var(--bg)}
.preview-box p{margin:0}.p-badge{justify-self:start;padding:4px 12px;border:1px solid var(--neon);border-radius:99px;font-size:13px;color:var(--green)}
.p-title{font:600 clamp(24px,4vw,38px)/1.1 var(--serif);color:var(--fg)}.p-title span{color:var(--green)}
.p-lead{color:var(--muted)}.p-btn{justify-self:start;padding:8px 18px;border-radius:99px;background:var(--green);color:var(--on-green);font-weight:600}
</style>
