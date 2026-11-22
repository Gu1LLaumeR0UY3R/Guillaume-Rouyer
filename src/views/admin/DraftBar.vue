<script setup>
// Petite barre d'un éditeur : mettre la version du formulaire en brouillon, et lien vers l'onglet Versions.
import { computed, onMounted, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'

const props = defineProps({ kind: { type: String, required: true }, refKey: { type: String, required: true }, getData: { type: Function, required: true } })
const draft = ref(null), busy = ref(false)
const q = computed(() => `kind=${props.kind}&ref=${encodeURIComponent(props.refKey)}`)
const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
const load = async () => { try { draft.value = (await api(`/api/admin/drafts?${q.value}`)).draft } catch { draft.value = null } }
onMounted(load)

async function save() {
  busy.value = true
  try {
    await api('/api/admin/drafts', { method: 'PUT', body: { kind: props.kind, ref: props.refKey, data: props.getData(), publishAt: null } })
    await load()
    toast("Brouillon enregistré : le site n'a pas changé. Programme-le ou publie-le dans l'onglet Versions.", 'info')
  } catch (e) { toast(e.message, 'danger') } finally { busy.value = false }
}
defineExpose({ load })
</script>

<template>
  <div class="db">
    <button class="btn btn-ghost small" type="button" :disabled="busy" @click="save">Enregistrer en brouillon</button>
    <span v-if="draft" class="pill" :class="{ sched: draft.publishAt }">{{ draft.publishAt ? `Programmé le ${fmt(draft.publishAt)}` : `Brouillon du ${fmt(draft.updatedAt)}` }}</span>
    <RouterLink :to="`/admin/versions?kind=${kind}&ref=${encodeURIComponent(refKey)}`" class="lnk">Historique et publication →</RouterLink>
  </div>
</template>

<style scoped>
.db{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 16px}
.pill{font-size:.78rem;font-weight:700;padding:3px 10px;border-radius:99px;background:#fde68a;color:#78350f}
.pill.sched{background:var(--green);color:var(--on-green)}
.lnk{font-size:.9rem;font-weight:600}
</style>
