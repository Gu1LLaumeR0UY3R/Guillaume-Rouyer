<script setup>
// Veille technologique : liste des articles (publier, dépublier, modifier, supprimer) et gestion des sujets (nom, couleur, ordre).
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { slugify } from '../../admin/slug.js'
import './adminForm.css'

const articles = ref([])
const topics = ref([])
const error = ref('')
const loaded = ref(false)
const filter = ref('all')
const busy = ref('') // identifiant de l'article ou du sujet en cours de traitement (évite le double clic)

const FILTERS = [['all', 'Tous'], ['published', 'Publiés'], ['draft', 'Brouillons']]
const topicMap = computed(() => Object.fromEntries(topics.value.map((t) => [t.slug, t])))
const counts = computed(() => ({ all: articles.value.length, published: articles.value.filter((a) => a.status === 'published').length, draft: articles.value.filter((a) => a.status === 'draft').length }))
const shown = computed(() => (filter.value === 'all' ? articles.value : articles.value.filter((a) => a.status === filter.value)))
const fmt = (ms) => (ms ? new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

async function load() {
  try {
    const [a, t] = await Promise.all([api('/api/admin/veille/articles'), api('/api/admin/veille/topics')])
    articles.value = a.articles
    topics.value = t.topics
    error.value = ''
  } catch (e) { error.value = e.message } finally { loaded.value = true }
}
onMounted(load)

// ---------- Articles ----------
async function setStatus(a, status) {
  busy.value = a.slug; error.value = ''
  try {
    await api(`/api/admin/veille/articles/${a.slug}`, { method: 'PATCH', body: { status } })
    toast(status === 'published' ? `« ${a.title} » est publié.` : `« ${a.title} » repasse en brouillon.`, status === 'published' ? 'ok' : 'warn')
    await load()
  } catch (e) { error.value = e.message } finally { busy.value = '' }
}
async function removeArticle(a) {
  if (!window.confirm(`Supprimer définitivement « ${a.title} » ? Cette action est irréversible.`)) return
  busy.value = a.slug; error.value = ''
  try { await api(`/api/admin/veille/articles/${a.slug}`, { method: 'DELETE' }); toast(`« ${a.title} » supprimé.`, 'warn'); await load() } catch (e) { error.value = e.message } finally { busy.value = '' }
}

// ---------- Sujets ----------
const nt = reactive({ name: '', slug: '', color: '#6c8cff', slugTouched: false })
const editing = ref('')
const draft = reactive({ name: '', color: '#6c8cff' })

function onTopicName() { if (!nt.slugTouched) nt.slug = slugify(nt.name) }
async function addTopic() {
  error.value = ''; busy.value = 'new-topic'
  try {
    await api('/api/admin/veille/topics', { method: 'POST', body: { slug: nt.slug, name: nt.name, color: nt.color } })
    Object.assign(nt, { name: '', slug: '', slugTouched: false })
    await load()
  } catch (e) { error.value = e.message } finally { busy.value = '' }
}
function startEdit(t) { editing.value = t.slug; Object.assign(draft, { name: t.name, color: t.color }) }
async function saveTopic(t) {
  error.value = ''; busy.value = t.slug
  try { await api(`/api/admin/veille/topics/${t.slug}`, { method: 'PUT', body: { name: draft.name, color: draft.color } }); editing.value = ''; await load() } catch (e) { error.value = e.message } finally { busy.value = '' }
}
async function removeTopic(t) {
  const n = t.articles
  if (!window.confirm(n ? `Supprimer le sujet « ${t.name} » ? Les ${n} article(s) concerné(s) sont conservés mais perdent ce sujet.` : `Supprimer le sujet « ${t.name} » ?`)) return
  error.value = ''; busy.value = t.slug
  try { await api(`/api/admin/veille/topics/${t.slug}`, { method: 'DELETE' }); await load() } catch (e) { error.value = e.message } finally { busy.value = '' }
}
async function move(i, d) {
  const j = i + d
  if (j < 0 || j >= topics.value.length) return
  const list = [...topics.value]
  ;[list[i], list[j]] = [list[j], list[i]]
  topics.value = list
  try { await api('/api/admin/veille/topics/reorder', { method: 'POST', body: { slugs: list.map((t) => t.slug) } }) } catch (e) { error.value = e.message; await load() }
}
</script>

<template>
  <div class="admin wide veille">
    <h1>Veille technologique</h1>
    <p>Tes articles et les sujets qui les rangent. Les modifications apparaissent sur le site en moins d'une minute.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <section aria-labelledby="h-articles">
      <div class="bar">
        <h2 id="h-articles">Articles</h2>
        <span class="spacer" />
        <div class="chips" role="group" aria-label="Filtrer par statut">
          <button v-for="[v, l] in FILTERS" :key="v" type="button" class="chip" :class="{ on: filter === v }" :aria-pressed="filter === v" @click="filter = v">{{ l }} ({{ counts[v] }})</button>
        </div>
        <RouterLink class="btn btn-primary" to="/admin/veille/nouveau">+ Nouvel article</RouterLink>
      </div>

      <p v-if="loaded && !articles.length" class="hint">Aucun article pour l'instant. Crée d'abord quelques sujets ci-dessous, puis ton premier article.</p>
      <p v-else-if="loaded && !shown.length" class="hint">Aucun article dans cette catégorie.</p>
      <table v-else-if="shown.length">
        <thead><tr><th>Article</th><th>Statut</th><th>Sujets</th><th>Mis à jour</th><th /></tr></thead>
        <tbody>
          <tr v-for="a in shown" :key="a.slug">
            <td><span class="name">{{ a.title }}</span><br /><span class="hint">/{{ a.slug }} · {{ a.readingMinutes }} min de lecture</span></td>
            <td>
              <span class="state" :class="a.status">{{ a.status === 'published' ? 'Publié' : 'Brouillon' }}</span>
              <br v-if="a.publishedAt" /><span v-if="a.publishedAt" class="hint">le {{ fmt(a.publishedAt) }}</span>
            </td>
            <td>
              <span v-for="s in a.topics" :key="s" class="pill"><i :style="{ background: topicMap[s]?.color }" />{{ topicMap[s]?.name ?? s }}</span>
              <span v-if="!a.topics.length" class="hint">Aucun</span>
            </td>
            <td>{{ fmt(a.updatedAt) }}</td>
            <td>
              <div class="actions">
                <RouterLink v-if="a.status === 'published'" class="btn btn-ghost small" :to="`/veille/${a.slug}`" target="_blank" title="Ouvre la page publique dans un nouvel onglet">Voir</RouterLink>
                <button v-if="a.status === 'draft'" class="btn btn-ghost small" type="button" :disabled="busy === a.slug" @click="setStatus(a, 'published')">Publier</button>
                <button v-else class="btn btn-ghost small" type="button" :disabled="busy === a.slug" @click="setStatus(a, 'draft')">Dépublier</button>
                <RouterLink class="btn btn-primary small" :to="`/admin/veille/${a.slug}`">Modifier</RouterLink>
                <button class="btn btn-ghost btn-danger small" type="button" :disabled="busy === a.slug" :aria-label="`Supprimer ${a.title}`" @click="removeArticle(a)">Supprimer</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section aria-labelledby="h-topics" class="topics">
      <div class="bar"><h2 id="h-topics">Sujets</h2></div>
      <p class="hint">Un article peut avoir jusqu'à 8 sujets. L'ordre ci-dessous est celui des filtres sur la page /veille.</p>

      <ul class="tlist">
        <li v-for="(t, i) in topics" :key="t.slug">
          <template v-if="editing !== t.slug">
            <span class="dot" :style="{ background: t.color }" aria-hidden="true" />
            <span class="name">{{ t.name }}</span>
            <span class="hint">/{{ t.slug }} · {{ t.articles }} article(s)</span>
            <span class="spacer" />
            <button class="btn btn-ghost small" type="button" :disabled="i === 0" :aria-label="`Monter ${t.name}`" @click="move(i, -1)">↑</button>
            <button class="btn btn-ghost small" type="button" :disabled="i === topics.length - 1" :aria-label="`Descendre ${t.name}`" @click="move(i, 1)">↓</button>
            <button class="btn btn-ghost small" type="button" @click="startEdit(t)">Modifier</button>
            <button class="btn btn-ghost btn-danger small" type="button" :disabled="busy === t.slug" :aria-label="`Supprimer ${t.name}`" @click="removeTopic(t)">Supprimer</button>
          </template>
          <form v-else class="inline" @submit.prevent="saveTopic(t)">
            <input v-model="draft.color" type="color" aria-label="Couleur" />
            <input v-model="draft.name" required maxlength="40" aria-label="Nom du sujet" />
            <button class="btn btn-primary small" type="submit" :disabled="busy === t.slug">Enregistrer</button>
            <button class="btn btn-ghost small" type="button" @click="editing = ''">Annuler</button>
          </form>
        </li>
      </ul>
      <p v-if="loaded && !topics.length" class="hint">Aucun sujet pour l'instant.</p>

      <form class="inline add" @submit.prevent="addTopic">
        <input v-model="nt.color" type="color" aria-label="Couleur du nouveau sujet" />
        <input v-model="nt.name" required maxlength="40" placeholder="Nouveau sujet (ex. : Self-hosting)" aria-label="Nom du nouveau sujet" @input="onTopicName" />
        <input v-model="nt.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="identifiant" aria-label="Identifiant du nouveau sujet" @input="nt.slugTouched = true" />
        <button class="btn btn-primary small" type="submit" :disabled="busy === 'new-topic'">Ajouter</button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.veille h2{margin:0;font-size:22px}
.veille .topics{margin-top:48px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{min-height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--fg);font:600 14px var(--font);cursor:pointer}
.chip.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.state{display:inline-block;padding:3px 10px;border-radius:999px;font:700 13px/1.4 var(--font);background:var(--bg);border:1px solid var(--line)}
.state.published{background:var(--green);border-color:var(--green);color:var(--on-green)}
.pill{display:inline-flex;align-items:center;gap:6px;margin:2px 6px 2px 0;padding:3px 10px;border:1px solid var(--line);border-radius:999px;font-size:13px;font-weight:600}
.pill i,.dot{display:inline-block;width:10px;height:10px;border-radius:50%;flex:none}
.tlist{display:grid;gap:8px;margin:16px 0;padding:0;list-style:none}
.tlist li{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.spacer{flex:1}
.inline{display:flex;flex-wrap:wrap;align-items:center;gap:10px;width:100%;margin:0;padding:0;border:0;background:none}
.inline input:not([type=color]){width:auto;flex:1 1 180px}
.inline input[type=color]{width:52px;min-height:44px;padding:2px;flex:none}
.add{margin-top:16px;padding:14px;border:1px dashed var(--line);border-radius:12px}
</style>
