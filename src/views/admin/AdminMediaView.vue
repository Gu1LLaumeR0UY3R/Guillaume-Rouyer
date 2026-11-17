<script setup>
// Médias : zone de dépôt, réduction automatique dans le navigateur, texte alternatif obligatoire,
// liste avec miniatures, « utilisée dans… », corbeille (30 jours).
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { api, upload } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import './adminForm.css'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_PICK = 5 * 1024 * 1024 // taille maximale du fichier choisi
const MAX_SIDE = 1600 // plus grand côté après réduction
const MAX_OUT = 950_000 // taille maximale après réduction (le serveur accepte 1 Mo)

const tab = ref('media')
const list = ref([])
const otherCount = ref(0)
const usedBytes = ref(0)
const maxBytes = ref(1)
const error = ref('')
const loading = ref(true)
const over = ref(false)
const input = ref(null)
const staged = reactive([]) // images choisies, en attente d'envoi : { key, name, blob, url, w, h, alt, state, progress, error }
let key = 0

async function load() {
  loading.value = true
  try {
    const d = await api(`/api/admin/media${tab.value === 'trash' ? '?trash=1' : ''}`)
    list.value = d.media; otherCount.value = d.otherCount; usedBytes.value = d.usedBytes; maxBytes.value = d.maxBytes
    error.value = ''
  } catch (e) { error.value = e.message } finally { loading.value = false }
}
onMounted(load)
onBeforeUnmount(() => staged.forEach((s) => URL.revokeObjectURL(s.url)))
function setTab(t) { tab.value = t; load() }

const kb = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1e3))} Ko`)
const pct = computed(() => Math.min(100, (usedBytes.value / maxBytes.value) * 100))

// Réduit l'image dans le navigateur : plus grand côté 1600 px, WebP, qualité baissée jusqu'à tenir sous 950 Ko.
async function shrink(file) {
  const bmp = await createImageBitmap(file)
  let scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  for (let round = 0; round < 4; round++) {
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale))
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    c.getContext('2d').drawImage(bmp, 0, 0, w, h)
    for (const q of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await new Promise((r) => c.toBlob(r, 'image/webp', q))
      if (blob && blob.type === 'image/webp' && blob.size <= MAX_OUT) { bmp.close?.(); return { blob, w, h } }
    }
    scale *= 0.75
  }
  bmp.close?.()
  throw new Error('Impossible de réduire assez cette image')
}

async function addFiles(files) {
  for (const file of files) {
    if (!ACCEPT.includes(file.type)) { toast(`« ${file.name} » : format refusé (JPG, PNG, WebP ou AVIF).`, 'warn'); continue }
    if (file.size > MAX_PICK) { toast(`« ${file.name} » dépasse 5 Mo.`, 'warn'); continue }
    try {
      const { blob, w, h } = await shrink(file)
      staged.push({ key: ++key, name: file.name, blob, url: URL.createObjectURL(blob), w, h, alt: '', state: 'ready', progress: 0, error: '' })
    } catch (e) { toast(`« ${file.name} » : ${e.message}`, 'warn') }
  }
}
function onPick(e) { addFiles([...e.target.files]); e.target.value = '' }
function onDrop(e) { over.value = false; addFiles([...e.dataTransfer.files]) }
function unstage(s) { URL.revokeObjectURL(s.url); staged.splice(staged.indexOf(s), 1) }

const canSend = computed(() => staged.some((s) => s.state !== 'sending' && s.alt.trim().length >= 3))
async function sendAll() {
  for (const s of [...staged]) {
    if (s.state === 'sending' || s.alt.trim().length < 3) continue
    s.state = 'sending'; s.progress = 0; s.error = ''
    try {
      await upload('/api/admin/media', s.blob, { 'X-Name': s.name, 'X-Alt': s.alt.trim(), 'X-Width': String(s.w), 'X-Height': String(s.h) }, (p) => { s.progress = p })
      unstage(s)
      toast(`« ${s.name} » ajoutée.`, 'ok')
    } catch (e) { s.state = 'error'; s.error = e.message }
  }
  await load()
}

async function copyLink(m) {
  try { await navigator.clipboard.writeText(`/media/${m.id}`); toast(`Lien copié : /media/${m.id}`, 'ok') } catch { window.prompt('Copie ce lien :', `/media/${m.id}`) }
}
async function editAlt(m) {
  const v = window.prompt('Texte alternatif (décrit l\'image pour les personnes qui ne la voient pas) :', m.alt)
  if (v === null || v.trim() === m.alt) return
  try { await api(`/api/admin/media/${m.id}`, { method: 'PATCH', body: { alt: v } }); toast('Texte alternatif modifié.', 'ok'); await load() } catch (e) { toast(e.message, 'danger') }
}
async function trash(m) {
  try { await api(`/api/admin/media/${m.id}`, { method: 'DELETE' }) } catch (e) {
    if (e.status !== 409 || !m.usedIn.length) { toast(e.message, 'danger'); return }
    if (!window.confirm(`Cette image est utilisée dans : ${m.usedIn.map((u) => u.label).join(', ')}.\nLa mettre à la corbeille la fera disparaître de ces pages. Continuer ?`)) return
    try { await api(`/api/admin/media/${m.id}?force=1`, { method: 'DELETE' }) } catch (e2) { toast(e2.message, 'danger'); return }
  }
  toast('Image mise à la corbeille (30 jours pour la restaurer).', 'ok')
  await load()
}
async function restore(m) {
  try { await api(`/api/admin/media/${m.id}`, { method: 'PATCH', body: { restore: true } }); toast('Image restaurée.', 'ok'); await load() } catch (e) { toast(e.message, 'danger') }
}
async function erase(m) {
  if (!window.confirm('Supprimer définitivement cette image ? Impossible de la récupérer ensuite.')) return
  try { await api(`/api/admin/media/${m.id}?permanent=1`, { method: 'DELETE' }); toast('Image supprimée définitivement.', 'ok'); await load() } catch (e) { toast(e.message, 'danger') }
}
</script>

<template>
  <div class="admin wide">
    <h1>Médias</h1>
    <p>Les images sont réduites automatiquement avant l'envoi (1600 px maximum, format WebP). Le site ne garde que leur chemin, par exemple <code>/media/…</code>.</p>

    <div
      class="drop" :class="{ over }" role="button" tabindex="0"
      aria-label="Glisse tes images ici ou clique pour choisir"
      @click="input.click()" @keydown.enter.prevent="input.click()" @keydown.space.prevent="input.click()"
      @dragover.prevent="over = true" @dragenter.prevent="over = true" @dragleave.prevent="over = false" @drop.prevent="onDrop"
    >
      <svg class="up" viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 33V9M14 19l10-10 10 10M8 33v5a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3v-5" /></svg>
      <strong>Glisse tes images ici ou clique pour choisir</strong>
      <span class="hint">JPG, PNG, WebP ou AVIF · 5 Mo maximum par image · plusieurs à la fois possible</span>
      <input ref="input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" hidden @change="onPick" />
    </div>

    <section v-if="staged.length" class="staged" aria-label="Images à envoyer">
      <h2>À envoyer ({{ staged.length }})</h2>
      <p class="hint">Décris chaque image en quelques mots (obligatoire) : c'est ce que lisent les lecteurs d'écran et ce qui s'affiche si l'image ne charge pas.</p>
      <ul>
        <li v-for="s in staged" :key="s.key" :class="s.state">
          <img :src="s.url" alt="" width="84" height="84" />
          <div class="info">
            <span class="name" :title="s.name">{{ s.name }}</span>
            <span class="hint">{{ s.w }}×{{ s.h }} · {{ kb(s.blob.size) }} après réduction</span>
            <input v-model="s.alt" maxlength="200" placeholder="Texte alternatif (ex. : capture du tableau d'enquête SpiderNet)" :aria-label="`Texte alternatif de ${s.name}`" :disabled="s.state === 'sending'" />
            <span v-if="s.alt.trim().length < 3" class="hint need">Texte alternatif requis (3 caractères minimum)</span>
            <span v-if="s.error" class="err">{{ s.error }}</span>
            <span v-if="s.state === 'sending'" class="progress" role="progressbar" :aria-valuenow="Math.round(s.progress * 100)" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: s.progress * 100 + '%' }" /></span>
          </div>
          <button class="btn btn-ghost btn-danger small" type="button" :disabled="s.state === 'sending'" title="Retirer de la liste d'envoi" @click="unstage(s)">Retirer</button>
        </li>
      </ul>
      <div class="bar">
        <button class="btn btn-primary" type="button" :disabled="!canSend" :title="canSend ? 'Envoyer les images décrites' : 'Remplis le texte alternatif d\'au moins une image'" @click="sendAll">Envoyer</button>
      </div>
    </section>

    <div class="tabs" role="group" aria-label="Affichage">
      <button class="tab" type="button" :aria-pressed="tab === 'media'" @click="setTab('media')">Médias <span v-if="tab === 'media'">({{ list.length }})</span><span v-else>({{ otherCount }})</span></button>
      <button class="tab" type="button" :aria-pressed="tab === 'trash'" title="Les images y restent 30 jours, puis sont supprimées" @click="setTab('trash')">Corbeille <span v-if="tab === 'trash'">({{ list.length }})</span><span v-else>({{ otherCount }})</span></button>
      <span class="spacer" />
      <span class="quota" :title="`${kb(usedBytes)} utilisés sur ${kb(maxBytes)} réservés aux médias (corbeille comprise)`"><span class="qbar"><span :style="{ width: pct + '%' }" /></span>{{ kb(usedBytes) }} utilisés</span>
    </div>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="loading && !list.length" role="status">Chargement…</p>
    <p v-else-if="!list.length" class="empty">{{ tab === 'trash' ? 'La corbeille est vide.' : 'Aucune image pour le moment. Glisse-en une dans la zone ci-dessus.' }}</p>

    <ul v-else class="grid">
      <li v-for="(m, i) in list" :key="m.id" class="card-m" :style="{ '--d': Math.min(i, 12) }">
        <a class="thumb" :href="tab === 'trash' ? `/api/admin/media/${m.id}` : `/media/${m.id}`" target="_blank" rel="noopener" title="Ouvrir l'image en grand">
          <img :src="tab === 'trash' ? `/api/admin/media/${m.id}` : `/media/${m.id}`" :alt="m.alt" loading="lazy" width="320" height="200" />
        </a>
        <div class="meta">
          <span class="name" :title="m.name">{{ m.name }}</span>
          <span class="hint">{{ m.width }}×{{ m.height }} · {{ kb(m.size) }}</span>
          <span class="alt" :title="m.alt">{{ m.alt }}</span>
          <template v-if="tab === 'media'">
            <span v-if="m.usedIn.length" class="used" :title="m.usedIn.map((u) => `${u.kind} : ${u.label}`).join('\n')">Utilisée dans :
              <template v-for="(u, k) in m.usedIn" :key="k"><RouterLink v-if="u.href" :to="u.href">{{ u.label }}</RouterLink><span v-else>{{ u.label }}</span><span v-if="k < m.usedIn.length - 1">, </span></template>
            </span>
            <span v-else class="hint" title="Aucun projet ni réglage ne contient le lien de cette image">Non utilisée</span>
          </template>
          <span v-else class="hint warn">Suppression définitive dans {{ m.daysLeft }} jour{{ m.daysLeft > 1 ? 's' : '' }}</span>
        </div>
        <div class="actions">
          <template v-if="tab === 'media'">
            <button class="btn btn-ghost small" type="button" title="Copie le chemin à coller dans un projet" @click="copyLink(m)">Copier le lien</button>
            <button class="btn btn-ghost small" type="button" title="Modifier le texte alternatif" @click="editAlt(m)">Texte alt</button>
            <button class="btn btn-ghost btn-danger small" type="button" title="Met l'image à la corbeille (30 jours pour la restaurer)" @click="trash(m)">Corbeille</button>
          </template>
          <template v-else>
            <button class="btn btn-primary small" type="button" @click="restore(m)">Restaurer</button>
            <button class="btn btn-ghost btn-danger small" type="button" title="Impossible à annuler" @click="erase(m)">Supprimer</button>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.drop{display:grid;justify-items:center;gap:10px;margin-top:24px;padding:48px 24px;border:3px dashed var(--green);border-radius:var(--radius);background:color-mix(in srgb,var(--green) 5%,var(--card));color:var(--fg);text-align:center;cursor:pointer;transition:background .2s,transform .2s,border-color .2s,box-shadow .2s}
.drop strong{font:600 22px var(--serif)}
.drop:hover,.drop:focus-visible{background:color-mix(in srgb,var(--green) 10%,var(--card));box-shadow:0 18px 36px -24px var(--glow)}
.drop.over{border-style:solid;background:color-mix(in srgb,var(--green) 16%,var(--card));transform:scale(1.01)}
.up{color:var(--green);animation:float 2.6s ease-in-out infinite}
.drop.over .up{animation-duration:.8s}
.staged{margin-top:28px}
.staged h2{margin:0 0 6px;font-size:22px}
.staged ul{display:grid;gap:12px;margin:16px 0 0;padding:0;list-style:none}
.staged li{display:flex;gap:16px;align-items:flex-start;padding:14px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);animation:rise .4s cubic-bezier(.2,.8,.2,1) both}
.staged li.error{border-color:#b42318}
.staged img{flex:none;width:84px;height:84px;border-radius:12px;object-fit:cover;background:var(--bg)}
.info{display:grid;flex:1;gap:6px;min-width:0}
.info input{width:100%;box-sizing:border-box}
.name{overflow:hidden;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
.need{color:#b45309}
.progress{display:block;height:8px;border-radius:999px;background:var(--bg);overflow:hidden}
.progress span{display:block;height:100%;border-radius:999px;background:var(--green);transition:width .15s}
.tabs{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:32px 0 16px}
.tab{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:0 18px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);font:600 15px/1 var(--font);cursor:pointer;transition:background .2s,color .2s,transform .15s}
.tab:hover{transform:translateY(-1px);border-color:var(--green)}
.tab[aria-pressed='true']{border-color:var(--green);background:var(--green);color:var(--on-green)}
.spacer{flex:1}
.quota{display:inline-flex;align-items:center;gap:10px;color:var(--muted);font-size:14px}
.qbar{display:block;width:110px;height:8px;border-radius:999px;background:var(--line);overflow:hidden}
.qbar span{display:block;height:100%;background:var(--green)}
.empty{padding:28px;border:1px dashed var(--line);border-radius:var(--radius);text-align:center}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px;margin:0;padding:0;list-style:none}
.card-m{display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:transform .2s,border-color .2s,box-shadow .2s;animation:rise .45s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d) * 45ms)}
.card-m:hover{transform:translateY(-4px);border-color:var(--green);box-shadow:0 16px 30px -20px var(--glow)}
.thumb{display:block;aspect-ratio:16/10;background:var(--bg);overflow:hidden}
.thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s}
.card-m:hover .thumb img{transform:scale(1.05)}
.meta{display:grid;flex:1;align-content:start;gap:4px;padding:14px 16px 6px;min-width:0}
.alt{overflow:hidden;color:var(--fg);font-size:14px;text-overflow:ellipsis;white-space:nowrap}
.used{font-size:14px;color:var(--green);font-weight:600}
.warn{color:#b45309}
.card-m .actions{justify-content:flex-start;padding:8px 16px 16px}
@keyframes rise{from{opacity:0;transform:translateY(14px)}}
@keyframes float{50%{transform:translateY(-6px)}}
@media (prefers-reduced-motion:reduce){.up,.card-m,.staged li{animation:none}.drop,.card-m,.thumb img,.tab{transition:none}}
</style>
