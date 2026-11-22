<script setup>
// CV : un seul fichier PDF, proposé en téléchargement sur l'accueil, À propos et le pied de page.
import { onMounted, ref } from 'vue'
import { api, upload } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const cv = ref(null)
const max = ref(1_000_000)
const loaded = ref(false)
const error = ref('')
const busy = ref(false)
const progress = ref(0)
const over = ref(false)
const input = ref(null)

async function load() {
  try { const d = await api('/api/admin/cv'); cv.value = d.cv; max.value = d.maxBytes; loaded.value = true } catch (e) { error.value = e.message }
}
onMounted(load)

const kb = (n) => (n < 1_000_000 ? `${Math.round(n / 1000)} Ko` : `${(n / 1_000_000).toFixed(1)} Mo`)
async function send(file) {
  error.value = ''
  if (!file) return
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { error.value = 'Choisis un fichier PDF.'; return }
  if (file.size > max.value) { error.value = `PDF trop lourd (${kb(file.size)}). Maximum : ${kb(max.value)}. Exporte-le en « taille minimale » ou compresse-le.`; return }
  busy.value = true; progress.value = 0
  try {
    await upload('/api/admin/cv', file, { 'X-Name': file.name }, (p) => { progress.value = p })
    toast('CV mis en ligne.', 'ok'); await load()
  } catch (e) { error.value = e.message } finally { busy.value = false; if (input.value) input.value.value = '' }
}
const onDrop = (e) => { over.value = false; send(e.dataTransfer.files?.[0]) }
async function remove() {
  if (!window.confirm('Retirer le CV du site ? Les boutons de téléchargement disparaîtront.')) return
  try { await api('/api/admin/cv', { method: 'DELETE' }); cv.value = null; toast('CV retiré.', 'ok') } catch (e) { error.value = e.message }
}
</script>

<template>
  <div class="admin wide narrow">
    <h1>CV</h1>
    <p>Dépose ton CV au format PDF. Un bouton « Télécharger mon CV » apparaît alors sur l'accueil, la page À propos et le pied de page. Pour le remplacer, dépose simplement un nouveau fichier.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <section v-if="loaded" class="card">
      <div v-if="cv" class="cur">
        <div>
          <strong>{{ cv.name }}</strong>
          <p class="meta">{{ kb(cv.size) }} · mis à jour le {{ new Date(cv.updatedAt).toLocaleDateString('fr-FR', { dateStyle: 'long' }) }}</p>
        </div>
        <div class="row">
          <a class="btn btn-ghost" href="/cv.pdf" target="_blank" rel="noopener">Voir le CV</a>
          <button class="btn btn-ghost danger" type="button" @click="remove">Retirer</button>
        </div>
      </div>
      <p v-else class="meta">Aucun CV en ligne pour le moment : le bouton de téléchargement est masqué.</p>

      <label class="drop" :class="{ over, busy }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="onDrop">
        <input ref="input" type="file" accept="application/pdf,.pdf" class="sr" :disabled="busy" @change="send($event.target.files?.[0])" />
        <span v-if="!busy">{{ cv ? 'Remplacer le CV' : 'Déposer le CV' }} : glisse un PDF ici ou clique pour le choisir <small>({{ kb(max) }} maximum)</small></span>
        <span v-else>Envoi… {{ Math.round(progress * 100) }} %</span>
      </label>
    </section>
  </div>
</template>

<style scoped>
.card{margin-top:20px;display:grid;gap:18px}
.cur{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.meta{margin:4px 0 0;color:var(--muted)}
.row{display:flex;gap:8px;flex-wrap:wrap}
.danger{color:#b3261e;border-color:currentColor}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.drop{display:grid;place-items:center;min-height:120px;padding:20px;border:2px dashed var(--line);border-radius:14px;text-align:center;cursor:pointer;font-weight:600}
.drop:hover,.drop.over,.drop:focus-within{border-color:var(--green);background:color-mix(in srgb,var(--green) 8%,transparent)}
.drop small{display:block;margin-top:4px;color:var(--muted);font-weight:400}
.drop.busy{cursor:progress;opacity:.8}
</style>
