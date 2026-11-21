<script setup>
// Création et modification d'un article de veille : identité, résumé, sujets, couverture, contenu (Markdown).
// « Enregistrer » garde l'état (brouillon ou publié) ; « Publier » enregistre puis met en ligne.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { slugify } from '../../admin/slug.js'
import './adminForm.css'

const route = useRoute()
const router = useRouter()
const isNew = computed(() => !route.params.slug)
const loaded = ref(false)
const busy = ref(false)
const error = ref('')
const dirty = ref(false)
const topics = ref([])
const status = ref('draft')
const publishedAt = ref(null)
const slugTouched = ref(false)
const MAX_TOPICS = 8

const f = reactive({ slug: '', title: '', excerpt: '', body: '', coverUrl: '', coverAlt: '', coverCaption: '', topics: [] })
const words = computed(() => (f.body.match(/\S+/g) ?? []).length)
const minutes = computed(() => Math.max(1, Math.ceil(words.value / 200)))
const coverOk = computed(() => /^https:\/\//i.test(f.coverUrl.trim()))
const fmt = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

watch(() => f.title, (t) => { if (isNew.value && !slugTouched.value) f.slug = slugify(t) })
watch(f, () => { if (loaded.value) dirty.value = true }, { deep: true })
onBeforeRouteLeave(() => (dirty.value && !busy.value ? window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?') : true))

function reset() {
  Object.assign(f, { slug: '', title: '', excerpt: '', body: '', coverUrl: '', coverAlt: '', coverCaption: '', topics: [] })
  status.value = 'draft'; publishedAt.value = null; slugTouched.value = false
}
async function loadArticle() {
  loaded.value = false; error.value = ''
  try {
    topics.value = (await api('/api/admin/veille/topics')).topics
    if (isNew.value) reset()
    else {
      const a = (await api(`/api/admin/veille/articles/${route.params.slug}`)).article
      Object.assign(f, { slug: a.slug, title: a.title, excerpt: a.excerpt, body: a.body, coverUrl: a.cover?.url ?? '', coverAlt: a.cover?.alt ?? '', coverCaption: a.cover?.caption ?? '', topics: [...a.topics] })
      status.value = a.status; publishedAt.value = a.publishedAt
    }
  } catch (e) { error.value = e.message } finally { loaded.value = true; setTimeout(() => { dirty.value = false }, 0) }
}
onMounted(loadArticle)
watch(() => route.params.slug, (n, o) => { if (n !== o) loadArticle() })

function toggleTopic(slug) {
  const i = f.topics.indexOf(slug)
  if (i >= 0) f.topics.splice(i, 1)
  else if (f.topics.length < MAX_TOPICS) f.topics.push(slug)
}

const payload = () => ({
  slug: f.slug, title: f.title, excerpt: f.excerpt, body: f.body, topics: f.topics,
  coverUrl: f.coverUrl.trim() || undefined, coverAlt: f.coverAlt.trim() || undefined, coverCaption: f.coverCaption.trim() || undefined,
})

// Enregistre le contenu. Renvoie true si tout s'est bien passé.
async function save() {
  error.value = ''; busy.value = true
  try {
    if (isNew.value) {
      await api('/api/admin/veille/articles', { method: 'POST', body: payload() })
      dirty.value = false
      toast('Brouillon créé.', 'ok')
      await router.replace(`/admin/veille/${f.slug}`)
    } else {
      await api(`/api/admin/veille/articles/${f.slug}`, { method: 'PUT', body: payload() })
      dirty.value = false
      toast('Article enregistré.', 'ok', 3000)
    }
    return true
  } catch (e) { error.value = e.message; return false } finally { busy.value = false }
}
async function setStatus(next) {
  if (dirty.value || isNew.value) { if (!(await save())) return }
  busy.value = true; error.value = ''
  try {
    await api(`/api/admin/veille/articles/${f.slug}`, { method: 'PATCH', body: { status: next } })
    status.value = next
    if (next === 'published' && !publishedAt.value) publishedAt.value = Date.now()
    toast(next === 'published' ? 'Article publié.' : 'Article repassé en brouillon.', next === 'published' ? 'ok' : 'warn')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <div class="admin wide ae">
    <RouterLink class="back" to="/admin/veille">← Toute la veille</RouterLink>
    <h1>{{ isNew ? 'Nouvel article' : f.title || 'Modifier l\'article' }}</h1>
    <p v-if="!isNew" class="hint">
      <span class="state" :class="status">{{ status === 'published' ? 'Publié' : 'Brouillon' }}</span>
      <span v-if="publishedAt"> · en ligne depuis le {{ fmt(publishedAt) }}</span>
    </p>

    <p v-if="error && !loaded" class="err" role="alert">{{ error }}</p>
    <form v-else novalidate @submit.prevent="save">
      <div class="grid2">
        <label>Titre
          <input v-model="f.title" required maxlength="150" placeholder="Ex. : Pourquoi je me suis mis à Proxmox" />
        </label>
        <label>Identifiant dans l'adresse
          <input v-model="f.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" :readonly="!isNew" :class="{ locked: !isNew }" placeholder="mon-article" @input="slugTouched = true" />
          <span class="hint">/veille/{{ f.slug || '…' }} · {{ isNew ? 'minuscules, chiffres, tirets ; non modifiable ensuite' : 'non modifiable' }}</span>
        </label>
      </div>

      <label>Résumé
        <textarea v-model="f.excerpt" maxlength="300" rows="3" placeholder="Une ou deux phrases : elles apparaissent dans la liste et dans les résultats de recherche." />
        <span class="hint">{{ f.excerpt.length }} / 300 · obligatoire pour publier</span>
      </label>

      <fieldset>
        <legend>Sujets <span class="hint">{{ f.topics.length }} / {{ MAX_TOPICS }}</span></legend>
        <p v-if="!topics.length" class="hint">Aucun sujet pour l'instant. <RouterLink to="/admin/veille">Crée-en dans la page Veille.</RouterLink></p>
        <div class="chips">
          <button v-for="t in topics" :key="t.slug" type="button" class="chip" :class="{ on: f.topics.includes(t.slug) }" :aria-pressed="f.topics.includes(t.slug)" @click="toggleTopic(t.slug)">
            <i :style="{ background: t.color }" />{{ t.name }}
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Image de couverture <span class="hint">facultative · lien externe en https</span></legend>
        <label>Lien de l'image<input v-model="f.coverUrl" type="url" placeholder="https://…" /></label>
        <div class="grid2">
          <label>Texte alternatif<input v-model="f.coverAlt" maxlength="200" placeholder="Décris l'image pour les lecteurs d'écran et le SEO" /><span class="hint">obligatoire si une couverture est ajoutée</span></label>
          <label>Légende<input v-model="f.coverCaption" maxlength="200" placeholder="Ex. : Mon serveur dans son rack (photo : …)" /></label>
        </div>
        <figure v-if="coverOk" class="cover">
          <img :src="f.coverUrl.trim()" :alt="f.coverAlt" referrerpolicy="no-referrer" loading="lazy" />
          <figcaption v-if="f.coverCaption">{{ f.coverCaption }}</figcaption>
        </figure>
      </fieldset>

      <label>Contenu (Markdown)
        <textarea v-model="f.body" class="body" maxlength="60000" rows="22" spellcheck="true" placeholder="# Mon titre&#10;&#10;Écris ton article ici…" />
        <span class="hint">{{ words }} mot(s) · environ {{ minutes }} min de lecture</span>
      </label>

      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <div class="bar">
        <button class="btn btn-primary" type="submit" :disabled="busy">Enregistrer{{ isNew ? ' le brouillon' : '' }}</button>
        <button v-if="status !== 'published'" class="btn btn-ghost" type="button" :disabled="busy" @click="setStatus('published')">Enregistrer et publier</button>
        <button v-else class="btn btn-ghost" type="button" :disabled="busy" @click="setStatus('draft')">Repasser en brouillon</button>
        <span class="spacer" />
        <span v-if="dirty" class="hint">Modifications non enregistrées</span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.back{display:inline-block;margin-bottom:12px;color:var(--muted);font-weight:600;text-decoration:none}
.back:hover{color:var(--fg)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--fg);font:600 14px var(--font);cursor:pointer}
.chip i{width:10px;height:10px;border-radius:50%}
.chip.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.state{display:inline-block;padding:3px 10px;border-radius:999px;font:700 13px/1.4 var(--font);background:var(--bg);border:1px solid var(--line)}
.state.published{background:var(--green);border-color:var(--green);color:var(--on-green)}
.locked{opacity:.65;cursor:not-allowed}
.body{min-height:420px;font:15px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;tab-size:2}
.cover{margin:0;max-width:420px}
.cover img{display:block;width:100%;height:auto;border-radius:12px}
.cover figcaption{margin-top:6px;color:var(--muted);font-size:14px}
</style>
