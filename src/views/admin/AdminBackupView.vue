<script setup>
// Sauvegarde : export / import JSON du contenu.
import { ref } from 'vue'
import { api, download } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const error = ref(''), busy = ref(false)
const file = ref(null), parsed = ref(null), preview = ref(null), importError = ref('')

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
    <h1>Sauvegarde</h1>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

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
.err{color:#b42318}
[data-theme=dark] .err{color:#ff9a90}
.prev{margin-top:12px}
.prev ul{margin:6px 0 12px;padding-left:18px}
</style>
