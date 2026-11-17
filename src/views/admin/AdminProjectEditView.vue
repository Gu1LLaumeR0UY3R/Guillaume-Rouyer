<script setup>
// Création et modification d'un projet : fiche, statut, bannière et sections de la page détaillée.
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import ProjectCard from '../../components/ProjectCard.vue'
import './adminForm.css'

const route = useRoute()
const router = useRouter()
const isNew = !route.params.slug
const error = ref('')
const busy = ref(false)
const tags = ref(['Web', 'Mobile', 'IA', 'API', '3D'])

const f = reactive({
  slug: '', name: '', tag: 'Web', status: 'online', description: '', stackText: '', repo: '', note: '', featured: false, board: '', maintenanceMessage: '',
  c1: '#0f172a', c2: '#1e3a8a', c3: '#f59e0b', angle: 135, lead: '', notice: '', sections: [],
})
let originalAccent = '', accentTouched = false

const accent = computed(() => `linear-gradient(${f.angle}deg,${f.c1},${f.c2} 55%,${f.c3})`)
const split = (s, re) => s.split(re).map((x) => x.trim()).filter(Boolean)

function fill(p) {
  Object.assign(f, {
    slug: p.slug, name: p.name, tag: p.tag, status: p.status, description: p.desc, stackText: p.stack.join(', '), repo: p.repo ?? '', note: p.note ?? '',
    featured: p.featured, board: p.board ?? '', maintenanceMessage: p.maintenanceMessage ?? '', lead: p.details?.lead ?? '', notice: p.details?.notice ?? '',
    sections: (p.details?.sections ?? []).map((s) => ({ title: s.title, paragraphsText: s.paragraphs.join('\n\n'), pointsText: s.points.join('\n') })),
  })
  originalAccent = p.accent
  const m = /linear-gradient\((\d+)deg\s*,\s*(#[0-9a-f]{6})[^,]*,\s*(#[0-9a-f]{6})[^,]*,\s*(#[0-9a-f]{6})/i.exec(p.accent)
  if (m) Object.assign(f, { angle: +m[1], c1: m[2], c2: m[3], c3: m[4] })
}

onMounted(async () => {
  try {
    const all = (await api('/api/admin/projects')).projects
    tags.value = [...new Set([...tags.value, ...all.map((p) => p.tag)])]
    if (!isNew) {
      const p = all.find((x) => x.slug === route.params.slug)
      if (!p) { error.value = 'Projet introuvable'; return }
      fill(p)
    }
  } catch (e) { error.value = e.message }
})

const preview = computed(() => ({
  slug: f.slug || 'apercu', name: f.name || 'Nom du projet', tag: f.tag, status: f.status, desc: f.description, stack: split(f.stackText, ','),
  repo: f.repo || null, note: f.note, featured: f.featured, board: null,
}))

const addSection = () => f.sections.push({ title: '', paragraphsText: '', pointsText: '' })
const moveSection = (i, d) => { const j = i + d; if (j >= 0 && j < f.sections.length) [f.sections[i], f.sections[j]] = [f.sections[j], f.sections[i]] }

function payload() {
  return {
    slug: f.slug, name: f.name, tag: f.tag, status: f.status,
    accent: !isNew && !accentTouched && originalAccent ? originalAccent : accent.value,
    description: f.description, stack: split(f.stackText, ','), repo: f.repo || null, note: f.note || null, featured: f.featured,
    board: f.board || null, maintenanceMessage: f.maintenanceMessage || null,
    details: { lead: f.lead, notice: f.notice, sections: f.sections.map((s) => ({ title: s.title, paragraphs: split(s.paragraphsText, /\n\s*\n/), points: split(s.pointsText, '\n') })) },
  }
}

async function save() {
  error.value = ''; busy.value = true
  try {
    await api(isNew ? '/api/admin/projects' : `/api/admin/projects/${f.slug}`, { method: isNew ? 'POST' : 'PUT', body: payload() })
    router.push('/admin/projets')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
async function remove() {
  if (!window.confirm(`Supprimer définitivement « ${f.name} » ? Pour seulement le cacher, passe-le en statut « Masqué ».`)) return
  try { await api(`/api/admin/projects/${f.slug}`, { method: 'DELETE' }); router.push('/admin/projets') } catch (e) { error.value = e.message }
}
</script>

<template>
  <div class="admin wide">
    <h1>{{ isNew ? 'Nouveau projet' : f.name || 'Modifier le projet' }}</h1>
    <form @submit.prevent="save">
      <fieldset>
        <legend>Fiche du projet</legend>
        <div class="grid2">
          <label>Nom<input v-model="f.name" required maxlength="80" /></label>
          <label>Identifiant dans l'adresse
            <input v-model="f.slug" required maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" :readonly="!isNew" placeholder="mon-projet" />
            <span class="hint">/projets/{{ f.slug || '…' }} {{ isNew ? '(minuscules, chiffres, tirets ; non modifiable ensuite)' : '(non modifiable)' }}</span>
          </label>
          <label>Catégorie (filtre)
            <input v-model="f.tag" list="tags" required maxlength="20" />
            <datalist id="tags"><option v-for="t in tags" :key="t" :value="t" /></datalist>
          </label>
          <label>Statut
            <select v-model="f.status">
              <option value="online">En ligne</option>
              <option value="wip">En cours (pastille « En cours »)</option>
              <option value="maintenance">En maintenance (page de maintenance + pastille)</option>
              <option value="hidden">Masqué (invisible sur le site)</option>
            </select>
          </label>
        </div>
        <label v-if="f.status === 'maintenance'">Message de la page de maintenance<input v-model="f.maintenanceMessage" maxlength="300" placeholder="Cette page revient bientôt…" /></label>
        <label>Description (carte)<textarea v-model="f.description" maxlength="600" /></label>
        <label>Technologies <span class="hint">séparées par des virgules, 12 maximum</span><input v-model="f.stackText" placeholder="Vue.js, PHP, MySQL" /></label>
        <div class="grid2">
          <label>Lien du code (https)<input v-model="f.repo" type="url" maxlength="200" placeholder="https://github.com/…" /></label>
          <label>Texte si le code est privé<input v-model="f.note" maxlength="200" placeholder="Code privé (projet de stage)." /></label>
        </div>
        <label class="check"><input v-model="f.featured" type="checkbox" /> Projet phare (sur l'accueil, avec sa page dédiée)</label>
        <label>Lien interne spécial <span class="hint">avancé : ex. /projets/spidernet/tableau, sinon laisser vide</span><input v-model="f.board" maxlength="100" /></label>
      </fieldset>

      <fieldset>
        <legend>Bannière</legend>
        <div class="colors" @input="accentTouched = true">
          <label>Couleur 1<input v-model="f.c1" type="color" /></label>
          <label>Couleur 2<input v-model="f.c2" type="color" /></label>
          <label>Couleur 3<input v-model="f.c3" type="color" /></label>
          <label>Angle ({{ f.angle }}°)<input v-model.number="f.angle" type="range" min="0" max="360" /></label>
        </div>
        <div class="banner-preview" :style="{ background: accent }" />
      </fieldset>

      <fieldset>
        <legend>Page détaillée</legend>
        <label>Introduction<textarea v-model="f.lead" maxlength="800" /></label>
        <label>Encadré (optionnel)<input v-model="f.notice" maxlength="400" /></label>
        <div v-for="(s, i) in f.sections" :key="i" class="section-box">
          <label>Titre de la section {{ i + 1 }}<input v-model="s.title" required maxlength="100" /></label>
          <label>Paragraphes <span class="hint">sépare-les par une ligne vide</span><textarea v-model="s.paragraphsText" /></label>
          <label>Liste à puces <span class="hint">un point par ligne (optionnel)</span><textarea v-model="s.pointsText" /></label>
          <div class="actions">
            <button class="btn btn-ghost small" type="button" :disabled="i === 0" @click="moveSection(i, -1)">↑ Monter</button>
            <button class="btn btn-ghost small" type="button" :disabled="i === f.sections.length - 1" @click="moveSection(i, 1)">↓ Descendre</button>
            <button class="btn btn-ghost btn-danger small" type="button" @click="f.sections.splice(i, 1)">Retirer</button>
          </div>
        </div>
        <button class="btn btn-ghost small" type="button" :disabled="f.sections.length >= 12" @click="addSection">+ Ajouter une section</button>
      </fieldset>

      <fieldset>
        <legend>Aperçu de la carte</legend>
        <div class="preview"><ProjectCard :project="preview" /></div>
      </fieldset>

      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <div class="bar">
        <button class="btn btn-primary" :disabled="busy">{{ isNew ? 'Créer le projet' : 'Enregistrer' }}</button>
        <RouterLink class="btn btn-ghost" to="/admin/projets">Annuler</RouterLink>
        <span class="spacer" />
        <button v-if="!isNew" class="btn btn-ghost btn-danger" type="button" @click="remove">Supprimer</button>
      </div>
    </form>
  </div>
</template>
