<script setup>
// Édition de l'étude de cas Goodnight : textes de chaque section et images (choisies dans les médias).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { takeDraft } from '../../admin/draftResume.js'
import { goodnightDefaults } from '../../content/goodnightDefaults.js'
import ImageField from './ImageField.vue'
import StringList from './StringList.vue'
import DraftBar from './DraftBar.vue'
import './adminForm.css'

const ICONS = { search: 'Loupe', calendar: 'Calendrier', key: 'Clé' }
const g = ref(null), saved = ref(''), custom = ref(false), loading = ref(true), busy = ref(false), error = ref('')
const clean = () => JSON.parse(JSON.stringify(g.value))
const snap = () => JSON.stringify(clean())
const dirty = computed(() => !loading.value && g.value && snap() !== saved.value)

async function load() {
  try {
    const d = await api('/api/admin/content/goodnight')
    const { updatedAt, ...rest } = d
    custom.value = Object.keys(rest).length > 0
    g.value = custom.value ? rest : goodnightDefaults()
    saved.value = snap()
  } catch (e) { error.value = e.message } finally { loading.value = false }
  const dr = await takeDraft('content', 'goodnight')
  if (dr) g.value = dr
}
const warn = (e) => { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => { load(); window.addEventListener('beforeunload', warn) })
onBeforeUnmount(() => window.removeEventListener('beforeunload', warn))

function payload() {
  const body = clean()
  // Lignes vides ignorées
  for (const [o, k] of [[body.hero, 'meta'], [body.intro, 'paragraphs'], [body.intro, 'stack'], [body.tech, 'challenge'], [body.tech, 'stack']]) o[k] = o[k].map((x) => x.trim()).filter(Boolean)
  return body
}
async function save() {
  busy.value = true
  const body = payload()
  try {
    await api('/api/admin/content/goodnight', { method: 'PUT', body })
    g.value = body; saved.value = snap(); custom.value = true
    toast("Enregistré : visible sur le site d'ici quelques secondes", 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
async function reset() {
  if (!confirm("Revenir au contenu d'origine ? Tes modifications enregistrées seront effacées.")) return
  busy.value = true
  try {
    await api('/api/admin/content/goodnight', { method: 'DELETE' })
    g.value = goodnightDefaults(); saved.value = snap(); custom.value = false
    toast("Contenu d'origine rétabli", 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}

const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; ;[arr[i], arr[j]] = [arr[j], arr[i]] }
const del = (arr, i, what) => { if (confirm(`Supprimer ${what} ?`)) arr.splice(i, 1) }
</script>

<template>
  <main class="admin wide">
    <RouterLink to="/admin/contenu" class="hint">← Tous les contenus</RouterLink>
    <h1>Étude de cas Goodnight</h1>
    <p class="hint">Textes et images de la page Goodnight, section par section (dans l'ordre de la page).
      <strong>{{ custom ? 'Contenu modifié.' : "Contenu d'origine (jamais modifié)." }}</strong>
      Sans image choisie, la page utilise les images déposées dans le dossier du site.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <template v-if="g">
      <div class="bar sticky">
        <button class="btn btn-primary" type="button" :disabled="busy || !dirty" @click="save">{{ busy ? 'Enregistrement…' : 'Enregistrer' }}</button>
        <span v-if="dirty" class="dirty">Modifications non enregistrées</span>
        <span class="spacer" />
        <button v-if="custom" class="btn btn-ghost small btn-danger" type="button" :disabled="busy" @click="reset">Revenir à l'origine</button>
      </div>
      <DraftBar kind="content" ref-key="goodnight" :get-data="payload" />

      <section class="card">
        <h2>1. Bandeau d'en-tête</h2>
        <div class="grid2">
          <label>Étiquette au-dessus du titre<input v-model="g.hero.kicker" maxlength="60"></label>
          <label>Titre<input v-model="g.hero.title" maxlength="60"></label>
        </div>
        <label>Accroche<input v-model="g.hero.tagline" maxlength="160"></label>
        <label>Texte<textarea v-model="g.hero.text" rows="3" maxlength="400" /></label>
        <StringList v-model="g.hero.meta" label="Infos sous le texte" :max="5" :max-length="30" />
        <fieldset>
          <legend>Images du diaporama <small>({{ g.hero.images.length }}/8)</small></legend>
          <p class="hint">Elles défilent toutes les 6 secondes. Vide : les images du dossier du site.</p>
          <div class="thumbs">
            <div v-for="(u, i) in g.hero.images" :key="u + i" class="thumb">
              <ImageField :model-value="u" :label="`Image ${i + 1}`" @update:model-value="(v) => (v ? (g.hero.images[i] = v) : g.hero.images.splice(i, 1))" />
              <div class="btns">
                <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(g.hero.images, i, -1)">↑</button>
                <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(g.hero.images, i, 1)">↓</button>
              </div>
            </div>
            <ImageField v-if="g.hero.images.length < 8" model-value="" label="Ajouter une image" fallback="Aucune" @update:model-value="(v) => v && g.hero.images.push(v)" />
          </div>
        </fieldset>
      </section>

      <section class="card">
        <h2>2. Aperçu du projet</h2>
        <div class="grid2">
          <label>Étiquette<input v-model="g.intro.kicker" maxlength="60"></label>
          <label>Titre<input v-model="g.intro.title" maxlength="120"></label>
        </div>
        <StringList v-model="g.intro.paragraphs" label="Paragraphes" multiline :max="5" :max-length="800" />
        <StringList v-model="g.intro.stack" label="Technologies (pastilles)" :max="12" :max-length="30" />
        <div class="grid2">
          <ImageField v-model="g.intro.desktopImage" label="Capture « ordinateur »" />
          <ImageField v-model="g.intro.mobileImage" label="Capture « mobile »" />
        </div>
      </section>

      <section class="card">
        <h2>3. Le parcours (étapes)</h2>
        <div v-for="(s, i) in g.steps" :key="i" class="entry">
          <div class="grid2">
            <label>Titre de l'étape {{ i + 1 }}<input v-model="s.title" maxlength="40"></label>
            <label>Icône<select v-model="s.icon"><option v-for="(n, k) in ICONS" :key="k" :value="k">{{ n }}</option></select></label>
          </div>
          <label>Texte<textarea v-model="s.text" rows="2" maxlength="240" /></label>
          <div class="actions left">
            <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(g.steps, i, -1)">↑</button>
            <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(g.steps, i, 1)">↓</button>
            <button class="btn btn-ghost small btn-danger" type="button" @click="del(g.steps, i, 'cette étape')">Supprimer</button>
          </div>
        </div>
        <button class="btn btn-ghost small add" type="button" :disabled="g.steps.length >= 6" @click="g.steps.push({ icon: 'search', title: 'Nouvelle étape', text: '' })">+ Étape</button>
      </section>

      <section class="card">
        <h2>4. Les écrans qui comptent</h2>
        <div class="grid2">
          <label>Étiquette<input v-model="g.focus.kicker" maxlength="60"></label>
          <label>Titre<input v-model="g.focus.title" maxlength="120"></label>
        </div>
        <label>Texte d'introduction<textarea v-model="g.focus.text" rows="2" maxlength="300" /></label>
        <div v-for="(it, i) in g.focus.items" :key="i" class="entry">
          <div class="grid2">
            <label>Titre de l'écran<input v-model="it.title" maxlength="60"></label>
            <label>Espace concerné<input v-model="it.role" maxlength="40" placeholder="Propriétaire, Administrateur…"></label>
          </div>
          <label>Détail (affiché au survol)<textarea v-model="it.more" rows="2" maxlength="300" /></label>
          <label>Description de l'image (pour les lecteurs d'écran)<input v-model="it.alt" maxlength="160"></label>
          <ImageField v-model="it.image" label="Image de l'écran" />
          <div class="actions left">
            <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(g.focus.items, i, -1)">↑</button>
            <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(g.focus.items, i, 1)">↓</button>
            <button class="btn btn-ghost small btn-danger" type="button" @click="del(g.focus.items, i, 'cet écran')">Supprimer</button>
          </div>
        </div>
        <button class="btn btn-ghost small add" type="button" :disabled="g.focus.items.length >= 8" @click="g.focus.items.push({ slot: '', role: '', title: 'Nouvel écran', alt: '', more: '', image: '' })">+ Écran</button>
      </section>

      <section class="card">
        <h2>5. Réalisation technique</h2>
        <div class="grid2">
          <label>Étiquette<input v-model="g.tech.kicker" maxlength="60"></label>
          <label>Titre<input v-model="g.tech.title" maxlength="120"></label>
        </div>
        <StringList v-model="g.tech.challenge" label="Paragraphes" multiline :max="4" :max-length="900" />
        <StringList v-model="g.tech.stack" label="Technologies (pastilles)" :max="12" :max-length="30" />
        <label>Titre de l'extrait de code<input v-model="g.tech.codeTitle" maxlength="100"></label>
        <label>Code (affiché tel quel)<textarea v-model="g.tech.code" class="code" rows="12" maxlength="3000" spellcheck="false" /><span class="hint">{{ g.tech.code.length }} / 3000</span></label>
        <label>Note sous le code<textarea v-model="g.tech.note" rows="2" maxlength="300" /></label>
      </section>

      <section class="card">
        <h2>6. Fin de page</h2>
        <label>Titre<input v-model="g.cta.title" maxlength="100"></label>
        <label>Texte<textarea v-model="g.cta.text" rows="3" maxlength="400" /></label>
      </section>
    </template>
  </main>
</template>

<style scoped>
.card{display:grid;gap:14px;align-content:start;margin-top:20px;padding:20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
.card h2{margin:0;font-size:22px}
.sticky{position:sticky;top:0;z-index:20;padding:10px 0;background:var(--bg)}
.dirty{color:#b45309;font-weight:700}
[data-theme=dark] .dirty{color:#fbbf24}
.thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.thumb{display:grid;gap:6px}
.btns{display:flex;gap:6px;flex-wrap:wrap}
.entry{display:grid;gap:12px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}
.actions.left{justify-content:flex-start}
.add{justify-self:start}
.code{font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
</style>
