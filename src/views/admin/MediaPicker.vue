<script setup>
// Fenêtre de choix d'une image du gestionnaire de médias, avec envoi d'une nouvelle image sur place.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api, upload } from '../../admin/api.js'
import { checkFile, shrink } from '../../admin/images.js'

const props = defineProps({ selected: { type: String, default: null } })
const emit = defineEmits(['pick', 'close'])

const list = ref([])
const loading = ref(true)
const error = ref('')
const fileInput = ref(null)
const draft = ref(null) // { blob, url, name, w, h, alt }
const sending = ref(false)
const progress = ref(0)

async function load() {
  try { list.value = (await api('/api/admin/media')).media } catch (e) { error.value = e.message } finally { loading.value = false }
}
const onKey = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => { load(); document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden' })
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; if (draft.value) URL.revokeObjectURL(draft.value.url) })

async function choose(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  error.value = checkFile(file)
  if (error.value) return
  try {
    const { blob, w, h } = await shrink(file)
    if (draft.value) URL.revokeObjectURL(draft.value.url)
    draft.value = { blob, w, h, name: file.name, url: URL.createObjectURL(blob), alt: '' }
  } catch (err) { error.value = err.message }
}
async function send() {
  const d = draft.value
  if (!d || d.alt.trim().length < 3) return
  sending.value = true; error.value = ''; progress.value = 0
  try {
    const r = await upload('/api/admin/media', d.blob, { 'X-Name': d.name, 'X-Alt': d.alt.trim(), 'X-Width': String(d.w), 'X-Height': String(d.h) }, (p) => { progress.value = p })
    emit('pick', r.url)
  } catch (err) { error.value = err.message } finally { sending.value = false }
}
</script>

<template>
  <!-- Téléporté dans <body> : la page admin a une animation (transform) qui fausserait position:fixed -->
  <Teleport to="body">
  <div class="overlay" @click.self="emit('close')">
    <div class="dlg" role="dialog" aria-modal="true" aria-label="Choisir une image">
      <header>
        <h2>Choisir une image</h2>
        <button class="x" type="button" aria-label="Fermer" title="Fermer (Échap)" @click="emit('close')">×</button>
      </header>
      <p v-if="error" class="err" role="alert">{{ error }}</p>

      <section class="new">
        <h3>Envoyer une nouvelle image</h3>
        <template v-if="!draft">
          <button class="btn btn-ghost" type="button" @click="fileInput.click()">Choisir un fichier…</button>
          <span class="hint">JPG, PNG, WebP ou AVIF, 5 Mo maximum. Elle est réduite automatiquement.</span>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden @change="choose" />
        </template>
        <div v-else class="draft">
          <img :src="draft.url" alt="" />
          <div class="d-info">
            <input v-model="draft.alt" maxlength="200" placeholder="Décris l'image en quelques mots (obligatoire)" aria-label="Texte alternatif" :disabled="sending" />
            <span v-if="sending" class="progress"><span :style="{ width: progress * 100 + '%' }" /></span>
            <div class="row">
              <button class="btn btn-primary small" type="button" :disabled="sending || draft.alt.trim().length < 3" @click="send">Envoyer et utiliser</button>
              <button class="btn btn-ghost small" type="button" :disabled="sending" @click="draft = null">Annuler</button>
            </div>
          </div>
        </div>
      </section>

      <h3>Ou choisir dans tes médias</h3>
      <p v-if="loading" role="status">Chargement…</p>
      <p v-else-if="!list.length" class="hint">Aucune image pour le moment.</p>
      <ul v-else class="grid">
        <li v-for="m in list" :key="m.id">
          <button type="button" class="pick" :class="{ on: props.selected === `/media/${m.id}` }" :title="m.alt" @click="emit('pick', `/media/${m.id}`)">
            <img :src="`/media/${m.id}`" :alt="m.alt" loading="lazy" width="160" height="100" />
            <span>{{ m.name }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
.overlay{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:20px;background:rgba(5,15,10,.6);animation:fade .2s ease both}
.dlg{display:grid;gap:14px;align-content:start;width:min(820px,100%);max-height:calc(100vh - 40px);overflow:auto;padding:22px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);box-shadow:0 30px 60px -20px rgba(0,0,0,.5);animation:pop .3s cubic-bezier(.2,.8,.2,1) both}
header{display:flex;align-items:center;justify-content:space-between}
h2{margin:0;font-size:24px}
h3{margin:0;font-size:16px}
.x{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:var(--fg);font:400 28px/1 var(--font);cursor:pointer;transition:background .2s,transform .2s}
.x:hover{background:var(--bg);transform:rotate(90deg)}
.new{display:grid;gap:10px;padding:14px;border:1px dashed var(--green);border-radius:12px;background:color-mix(in srgb,var(--green) 5%,transparent)}
.new .btn{justify-self:start}
.draft{display:flex;gap:14px;align-items:flex-start}
.draft img{flex:none;width:120px;height:80px;border-radius:10px;object-fit:cover}
.d-info{display:grid;flex:1;gap:8px;min-width:0}
.d-info input{width:100%;box-sizing:border-box;min-height:42px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg);font:inherit}
.row{display:flex;flex-wrap:wrap;gap:8px}
.progress{display:block;height:8px;border-radius:999px;background:var(--bg);overflow:hidden}
.progress span{display:block;height:100%;background:var(--green);transition:width .15s}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0;padding:0;list-style:none}
.pick{display:grid;gap:6px;width:100%;padding:6px;border:2px solid transparent;border-radius:12px;background:var(--bg);color:var(--fg);font:500 13px var(--font);text-align:left;cursor:pointer;transition:transform .15s,border-color .15s}
.pick:hover{transform:translateY(-3px);border-color:var(--green)}
.pick.on{border-color:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 25%,transparent)}
.pick img{display:block;width:100%;height:96px;border-radius:8px;object-fit:cover}
.pick span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}
.hint{color:var(--muted);font-size:14px}
.err{margin:0;color:#b42318;font-weight:600}
.small{min-height:38px;padding:0 14px;font-size:14px}
@keyframes fade{from{opacity:0}}
@keyframes pop{from{opacity:0;transform:translateY(16px) scale(.97)}}
@media (prefers-reduced-motion:reduce){.overlay,.dlg{animation:none}}
</style>
