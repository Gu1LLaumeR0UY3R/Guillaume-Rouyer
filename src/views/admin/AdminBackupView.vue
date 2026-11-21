<script setup>
// Sauvegarde : export / import JSON du contenu, et liste des brouillons et publications programmées.
import { onMounted, ref } from 'vue'
import { api, download } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const drafts = ref([]), error = ref(''), busy = ref(false)
const file = ref(null), parsed = ref(null), preview = ref(null), importError = ref('')

const LABELS = { spidernet: 'Tableau SpiderNet', home: 'Accueil', about: 'À propos', skills: 'Compétences', timeline: 'Parcours', contact: 'Contact', legal: 'Mentions légales', privacy: 'Confidentialité', goodnight: 'Goodnight' }
const name = (d) => (d.kind === 'project' ? `Projet « ${d.ref} »` : LABELS[d.ref] ?? d.ref)
const link = (d) => (d.kind === 'project' ? `/admin/projets/${d.ref}` : d.ref === 'goodnight' ? '/admin/contenu/goodnight' : d.ref === 'spidernet' ? '/admin/contenu/spidernet' : `/admin/contenu?onglet=${d.ref}`)
const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

async function loadDrafts() { try { drafts.value = (await api('/api/admin/drafts')).drafts } catch (e) { error.value = e.message } }
onMounted(loadDrafts)

async function publish(d) {
  if (!confirm(`Publier maintenant : ${name(d)} ?`)) return
  try { await api('/api/admin/drafts/publish', { method: 'POST', body: { kind: d.kind, ref: d.ref } }); toast('Publié', 'ok'); await loadDrafts() } catch (e) { toast(e.message, 'danger') }
}
async function drop(d) {
  if (!confirm(`Supprimer le brouillon : ${name(d)} ?`)) return
  try { await api(`/api/admin/drafts?kind=${d.kind}&ref=${encodeURIComponent(d.ref)}`, { method: 'DELETE' }); await loadDrafts() } catch (e) { toast(e.message, 'danger') }
}

async function exportAll() {
  busy.value = true
  try { await download('/api/admin/backup', `sauvegarde-portfolio-${new Date().toISOString().slice(0, 10)}.json`); toast('Sauvegarde téléchargée', 'ok') } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}

async function pick(e) {
  importError.value = ''; preview.value = null; parsed.value = null
  const f = e.target.files?.[0]
  file.value = f ?? null
  if (!f) return
  if (f.size > 2_500_000) { importError.value = 'Fichier trop gros (2,5 Mo maximum).'; return }
  try { parsed.value = JSON.parse(await f.text()) } catch { importError.value = "Ce fichier n'est pas du JSON valide."; return }
  busy.value = true
  try { preview.value = (await api('/api/admin/backup/import', { method: 'POST', body: { ...parsed.value, apply: false } })).summary } catch (err) { importError.value = err.message } finally { busy.value = false }
}
async function doImport() {
  if (!confirm('Importer cette sauvegarde ? Les éléments présents dans le fichier remplacent ceux du site (les anciennes versions restent dans l\'historique). Rien n\'est supprimé.')) return
  busy.value = true
  try {
    await api('/api/admin/backup/import', { method: 'POST', body: { ...parsed.value, apply: true } })
    toast('Sauvegarde importée', 'ok'); parsed.value = null; preview.value = null; file.value = null
  } catch (err) { importError.value = err.message } finally { busy.value = false }
}
</script>

<template>
  <div class="admin wide narrow">
    <h1>Sauvegarde et publications</h1>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <section class="card">
      <h2>Publications programmées et brouillons</h2>
      <p v-if="!drafts.length" class="hint">Aucun brouillon. Dans chaque éditeur, le bloc « Versions et publication » permet de mettre une version de côté ou de la programmer.</p>
      <ul v-else class="list">
        <li v-for="d in drafts" :key="d.kind + d.ref">
          <div>
            <RouterLink :to="link(d)">{{ name(d) }}</RouterLink>
            <small>{{ d.publishAt ? `Programmé le ${fmt(d.publishAt)}` : `Brouillon du ${fmt(d.updatedAt)}` }}</small>
            <small v-if="d.error" class="err">Échec : {{ d.error }}</small>
          </div>
          <div class="row">
            <button class="btn btn-ghost small" type="button" @click="publish(d)">Publier maintenant</button>
            <button class="btn btn-ghost small btn-danger" type="button" @click="drop(d)">{{ d.publishAt ? 'Annuler' : 'Supprimer' }}</button>
          </div>
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>Exporter</h2>
      <p>Télécharge un fichier JSON avec tous les textes, les projets et les réglages du site. Les images, le compte admin, les journaux et les messages de contact n'y sont pas.</p>
      <button class="btn btn-primary" type="button" :disabled="busy" @click="exportAll">Télécharger la sauvegarde</button>
    </section>

    <section class="card">
      <h2>Importer</h2>
      <p>Choisis un fichier de sauvegarde. Il est d'abord vérifié en entier : au moindre défaut, rien n'est modifié.</p>
      <input type="file" accept="application/json,.json" @change="pick">
      <p v-if="importError" class="err" role="alert">{{ importError }}</p>
      <div v-if="preview" class="prev">
        <p><strong>Ce fichier va :</strong></p>
        <ul>
          <li>Textes : {{ preview.content.replaced }} remplacé(s), {{ preview.content.created }} créé(s)</li>
          <li>Projets : {{ preview.projects.replaced }} remplacé(s), {{ preview.projects.created }} créé(s)</li>
          <li>Réglages : {{ preview.settings }} valeur(s)</li>
        </ul>
        <button class="btn btn-primary" type="button" :disabled="busy" @click="doImport">Importer maintenant</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.list li{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 12px;border:1px solid var(--line);border-radius:8px}
.list li>div:first-child{display:grid;gap:2px}
small{color:var(--muted)}
.row{display:flex;gap:8px;flex-wrap:wrap}
.err{color:#b42318}
[data-theme=dark] .err{color:#ff9a90}
.prev{margin-top:12px}
.prev ul{margin:6px 0 12px;padding-left:18px}
</style>
