<script setup>
// Sauvegarde : export / import JSON du contenu.
import { computed, onMounted, ref } from 'vue'
import { compact, diffLines, flatten } from '../../lib/diff.js'
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

// ---- Sauvegardes automatiques ----
const runs = ref([]), info = ref({ everyDays: 7, keepDays: 180 }), openId = ref(null), detail = ref(null), cmp = ref(null), autoErr = ref('')
const fmt = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
const label = (k) => k === 'settings' ? 'Réglages' : ({ content: 'Texte', project: 'Projet', article: 'Article de veille', topic: 'Sujet de veille' }[k.split(':')[0]] ?? '') + ' : ' + k.split(':').slice(1).join(':')
const STATUS = { new: 'nouveau', changed: 'modifié', removed: 'supprimé' }
async function loadRuns() {
  try { const d = await api('/api/admin/autobackup'); runs.value = d.runs; info.value = d } catch (e) { autoErr.value = e.message }
}
async function runNow() {
  busy.value = true
  try { const d = await api('/api/admin/autobackup', { method: 'POST' }); toast(`Sauvegarde faite : ${d.run.changed} modifié(s), ${d.run.removed} supprimé(s)`, 'ok'); await loadRuns() } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
async function toggle(r) {
  cmp.value = null
  if (openId.value === r.id) { openId.value = null; return }
  openId.value = r.id; detail.value = null
  try { detail.value = await api(`/api/admin/autobackup/${r.id}`) } catch (e) { autoErr.value = e.message }
}
async function compare(it) {
  try {
    const d = await api(`/api/admin/autobackup/${openId.value}?key=${encodeURIComponent(it.key)}`)
    const a = d.then == null ? [] : flatten(d.then), b = d.now == null ? [] : flatten(d.now)
    cmp.value = { key: it.key, gone: d.then == null, missing: d.now == null, lines: compact(diffLines(b, a)) }
  } catch (e) { toast(e.message, 'danger') }
}
const same = computed(() => cmp.value && !cmp.value.lines.some((l) => l.t !== 'same' && l.t !== 'gap'))
async function restoreOne(it) {
  if (!confirm('Remettre « ' + label(it.key) + ' » dans l\'état de cette sauvegarde ? Sa version actuelle sera remplacée.')) return
  try { await api(`/api/admin/autobackup/${openId.value}`, { method: 'POST', body: { key: it.key } }); toast('Élément restauré', 'ok'); cmp.value = null } catch (e) { toast(e.message, 'danger') }
}
async function dl(r) {
  try { await download(`/api/admin/autobackup/${r.id}?download=1`, `sauvegarde-auto-${new Date(r.at).toISOString().slice(0, 10)}.json`) } catch (e) { toast(e.message, 'danger') }
}
onMounted(loadRuns)
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

    <section class="card">
      <h2>Sauvegardes automatiques</h2>
      <p>Le site se sauvegarde seul environ une fois par semaine. Chaque passage ne garde que ce qui a changé depuis le précédent : textes, projets, articles et sujets de veille, réglages (hors maintenance). Historique conservé {{ info.keepDays }} jours. Images, compte admin, journaux et messages ne sont pas inclus.</p>
      <p v-if="autoErr" class="err" role="alert">{{ autoErr }}</p>
      <button class="btn btn-primary" type="button" :disabled="busy" @click="runNow">Sauvegarder maintenant</button>
      <p v-if="!runs.length" class="muted">Aucune sauvegarde pour l'instant.</p>
      <ul v-else class="runs">
        <li v-for="r in runs" :key="r.id">
          <div class="row">
            <button type="button" class="lnk" :aria-expanded="openId === r.id" @click="toggle(r)">{{ fmt(r.at) }} · {{ r.kind === 'auto' ? 'auto' : 'manuelle' }}</button>
            <span class="muted">{{ r.changed }} modifié(s) · {{ r.removed }} supprimé(s) · {{ r.total }} au total</span>
            <button type="button" class="btn" @click="dl(r)">Télécharger l'état complet</button>
          </div>
          <div v-if="openId === r.id" class="det">
            <p v-if="!detail" class="muted">Chargement…</p>
            <p v-else-if="!detail.items.length" class="muted">Aucun changement ce jour-là.</p>
            <ul v-else>
              <li v-for="it in detail.items" :key="it.key" class="row">
                <span>{{ label(it.key) }} <em class="muted">({{ STATUS[it.status] }})</em></span>
                <span v-if="it.status !== 'removed'">
                  <button type="button" class="btn" @click="compare(it)">Comparer</button>
                  <button type="button" class="btn" @click="restoreOne(it)">Restaurer</button>
                </span>
              </li>
            </ul>
            <div v-if="cmp" class="diff" aria-live="polite">
              <p><strong>{{ label(cmp.key) }}</strong> : version actuelle comparée à la sauvegarde. <span v-if="same">Identique.</span></p>
              <p v-if="cmp.missing" class="muted">Cet élément n'existe plus sur le site.</p>
              <pre v-for="(l, i) in cmp.lines" :key="i" :class="l.t">{{ l.t === 'add' ? '+ ' : l.t === 'del' ? '− ' : '  ' }}{{ l.s }}</pre>
              <p class="muted">« − » : ce que le site a maintenant. « + » : ce que la restauration remettrait.</p>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.err{color:#b42318}
[data-theme=dark] .err{color:#ff9a90}
.prev{margin-top:12px}
.muted{opacity:.7}
.runs,.runs ul{list-style:none;padding:0;margin:12px 0 0}
.runs>li{border-top:1px solid var(--border,#8884);padding:8px 0}
.row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between;padding:3px 0}
.lnk{background:none;border:0;padding:0;font:inherit;font-weight:600;text-decoration:underline;cursor:pointer;color:inherit}
.det{margin:8px 0 4px 12px}
.diff{margin-top:10px}
.diff pre{margin:0;white-space:pre-wrap;font-size:.85rem}
.diff .add{background:#1a7f3722}.diff .del{background:#b4231822}.diff .gap{opacity:.5}
.prev ul{margin:6px 0 12px;padding-left:18px}
</style>
