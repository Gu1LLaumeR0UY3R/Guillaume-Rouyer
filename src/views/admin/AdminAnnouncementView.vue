<script setup>
// Annonce : texte, type, lien, dates de début et de fin, aperçu en direct de la bannière de la page d'accueil.
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import AnnouncementBanner from '../../components/AnnouncementBanner.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import './adminForm.css'

const f = reactive({ announceOn: false, announceText: '', announceType: 'info', announceLink: '', announceLinkLabel: '', start: '', end: '' })
const error = ref('')
const busy = ref(false)
const loaded = ref(false)

// <input type="datetime-local"> <-> millisecondes (heure locale de l'ordinateur)
const pad = (n) => String(n).padStart(2, '0')
const toLocal = (ms) => { if (!ms) return ''; const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
const toMs = (v) => (v ? new Date(v).getTime() : null)

function fill(s) {
  Object.assign(f, { announceOn: s.announceOn, announceText: s.announceText, announceType: s.announceType, announceLink: s.announceLink, announceLinkLabel: s.announceLinkLabel, start: toLocal(s.announceStart), end: toLocal(s.announceEnd) })
}
onMounted(async () => {
  try { fill((await api('/api/admin/settings')).settings); loaded.value = true } catch (e) { error.value = e.message }
})

async function save() {
  error.value = ''; busy.value = true
  try {
    const { settings } = await api('/api/admin/settings', { method: 'PUT', body: {
      announceOn: f.announceOn, announceText: f.announceText.trim(), announceType: f.announceType, announceLink: f.announceLink.trim(),
      announceLinkLabel: f.announceLinkLabel.trim(), announceStart: toMs(f.start), announceEnd: toMs(f.end),
    } })
    fill(settings)
    toast('Annonce enregistrée. Elle apparaît sur l\'accueil en quelques secondes.', 'ok')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}

const now = () => Date.now()
const state = computed(() => {
  if (!f.announceText.trim()) return { cls: 'off', label: 'Vide', hint: 'Écris un texte pour pouvoir l\'afficher.' }
  if (!f.announceOn) return { cls: 'off', label: 'Désactivée', hint: 'Invisible pour les visiteurs.' }
  if (f.start && toMs(f.start) > now()) return { cls: 'wait', label: 'Programmée', hint: `Apparaîtra le ${new Date(f.start).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.` }
  if (f.end && toMs(f.end) <= now()) return { cls: 'off', label: 'Terminée', hint: 'La date de fin est passée.' }
  return { cls: 'live', label: 'Visible', hint: f.end ? `Visible jusqu'au ${new Date(f.end).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.` : 'Visible, sans date de fin.' }
})
const preview = computed(() => (f.announceText.trim() ? { text: f.announceText.trim(), type: f.announceType, link: /^(https:\/\/|\/(?!\/))/.test(f.announceLink.trim()) ? f.announceLink.trim() : '', linkLabel: f.announceLinkLabel.trim() } : null))
</script>

<template>
  <div class="admin wide narrow">
    <h1>Annonce</h1>
    <p>Une bannière affichée sur la page d'accueil, juste avant les projets. Le visiteur peut la fermer : elle ne revient que si tu changes le texte, le type ou le lien.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>

    <form v-if="loaded" novalidate @submit.prevent="save">
      <div class="top">
        <ToggleSwitch v-model="f.announceOn" label="Afficher l'annonce sur le site" />
        <span class="state" :class="state.cls" :title="state.hint"><span class="dot" aria-hidden="true" />{{ state.label }}</span>
      </div>
      <p class="hint">{{ state.hint }}</p>

      <label>Texte de l'annonce
        <textarea v-model="f.announceText" maxlength="200" rows="2" placeholder="Ex. : Nouveau projet en ligne, viens le découvrir !" />
        <span class="hint count">{{ f.announceText.length }} / 200</span>
      </label>

      <fieldset>
        <legend>Type</legend>
        <div class="types">
          <label v-for="[v, l, h] in [['info', 'Info', 'Vert, discret : une information'], ['nouveau', 'Nouveau', 'Bleu : une nouveauté'], ['important', 'Important', 'Orange : à ne pas rater']]" :key="v" class="type" :class="[v, { on: f.announceType === v }]" :title="h">
            <input v-model="f.announceType" type="radio" name="type" :value="v" /> {{ l }}
          </label>
        </div>
      </fieldset>

      <div class="grid2">
        <label>Lien (facultatif)
          <input v-model="f.announceLink" maxlength="300" placeholder="/projets ou https://…" />
          <span class="hint">Une page du site (commence par /) ou une adresse https.</span>
        </label>
        <label>Texte du lien
          <input v-model="f.announceLinkLabel" maxlength="40" placeholder="En savoir plus" />
        </label>
      </div>

      <div class="grid2">
        <label>Début (facultatif)
          <input v-model="f.start" type="datetime-local" />
          <span class="hint">Vide = visible tout de suite.</span>
        </label>
        <label>Fin (facultatif)
          <input v-model="f.end" type="datetime-local" />
          <span class="hint">Vide = visible jusqu'à ce que tu la désactives.</span>
        </label>
      </div>

      <div class="bar">
        <button class="btn btn-primary" type="submit" :disabled="busy">{{ busy ? 'Enregistrement…' : 'Enregistrer' }}</button>
        <button v-if="f.start || f.end" class="btn btn-ghost" type="button" title="Retire les dates" @click="f.start = ''; f.end = ''">Effacer les dates</button>
      </div>
    </form>

    <h2 class="pv">Aperçu</h2>
    <div class="preview-wrap">
      <AnnouncementBanner v-if="preview" :preview="preview" />
      <p v-else class="hint">L'aperçu apparaît dès que tu écris un texte.</p>
    </div>
  </div>
</template>

<style scoped>
.top{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.state{display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 14px;border:1px solid var(--line);border-radius:999px;font:600 14px/1 var(--font);color:var(--fg)}
.dot{width:10px;height:10px;border-radius:50%;background:var(--muted)}
.state.live{border-color:var(--green)}
.state.live .dot{background:var(--green);animation:blink 1.8s ease-in-out infinite}
.state.wait .dot{background:#d97706}
.count{text-align:right}
.types{display:flex;flex-wrap:wrap;gap:10px}
.type{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 16px;border:1px solid var(--line);border-radius:999px;cursor:pointer;transition:border-color .2s,background .2s,transform .15s}
.type:hover{transform:translateY(-1px);border-color:var(--green)}
.type.on{border-color:var(--green);background:color-mix(in srgb,var(--green) 12%,transparent)}
.type.nouveau.on{border-color:#2563eb;background:color-mix(in srgb,#2563eb 12%,transparent)}
.type.important.on{border-color:#d97706;background:color-mix(in srgb,#d97706 12%,transparent)}
.type input{min-height:auto;width:16px;height:16px;padding:0}
.pv{margin:32px 0 8px;font-size:22px}
.preview-wrap{padding:8px 16px 16px;border:1px dashed var(--line);border-radius:var(--radius);background:var(--bg)}
.preview-wrap :deep(.container){padding:0}
@keyframes blink{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.state.live .dot{animation:none}.type{transition:none}}
</style>
