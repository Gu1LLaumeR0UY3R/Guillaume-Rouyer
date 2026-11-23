<script setup>
// Édition des succès : nom, description et icône de chacun. Les conditions de déblocage restent dans le code.
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import { BASE } from '../../lib/achievements.js'
import './adminForm.css'

const rows = reactive(BASE.map((a) => ({ id: a.id, title: a.title, desc: a.desc, icon: a.icon, base: a })))
const busy = ref(false)
const error = ref('')
const loaded = ref(false)

onMounted(async () => {
  try {
    const d = await api('/api/admin/content/succes')
    for (const o of d.items ?? []) { const r = rows.find((x) => x.id === o.id); if (r) Object.assign(r, { title: o.title, desc: o.desc ?? '', icon: o.icon || r.base.icon }) }
  } catch (e) { error.value = e.message } finally { loaded.value = true }
})

const body = () => ({ items: rows.map((r) => ({ id: r.id, title: r.title, desc: r.desc, icon: r.icon })) })
async function save() {
  busy.value = true; error.value = ''
  try { await api('/api/admin/content/succes', { method: 'PUT', body: body() }); toast('Succès enregistrés.', 'ok', 3000) }
  catch (e) { error.value = e.message } finally { busy.value = false }
}
async function resetAll() {
  if (!window.confirm('Remettre tous les noms d\'origine ?')) return
  busy.value = true; error.value = ''
  try {
    await api('/api/admin/content/succes', { method: 'DELETE' })
    for (const r of rows) Object.assign(r, { title: r.base.title, desc: r.base.desc, icon: r.base.icon })
    toast('Noms d\'origine rétablis.', 'warn')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
const restore = (r) => Object.assign(r, { title: r.base.title, desc: r.base.desc, icon: r.base.icon })
</script>

<template>
  <div class="admin wide">
    <RouterLink class="back" to="/admin/contenu">← Contenu</RouterLink>
    <h1>Succès</h1>
    <p class="hint">Change le nom, la description et l'icône (un emoji) de chaque succès. Les conditions pour les débloquer restent celles du site. Les visiteurs voient les changements au prochain chargement.</p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <form v-if="loaded" novalidate @submit.prevent="save">
      <fieldset v-for="r in rows" :key="r.id" class="row">
        <legend>{{ r.base.title }} <span class="hint">· {{ r.id }}</span></legend>
        <div class="line">
          <label class="ic">Icône<input v-model="r.icon" maxlength="8" /></label>
          <label>Nom<input v-model="r.title" maxlength="40" required /></label>
          <label class="wide2">Description<input v-model="r.desc" maxlength="120" /></label>
          <button type="button" class="btn btn-ghost" @click="restore(r)">Origine</button>
        </div>
      </fieldset>
      <div class="bar">
        <button class="btn btn-primary" type="submit" :disabled="busy">Enregistrer</button>
        <button class="btn btn-ghost" type="button" :disabled="busy" @click="resetAll">Tout remettre d'origine</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.back{display:inline-block;margin-bottom:12px;color:var(--muted);font-weight:600;text-decoration:none}
.line{display:grid;grid-template-columns:70px 1fr 2fr auto;gap:12px;align-items:end}
.ic input{text-align:center;font-size:20px}
@media(max-width:760px){.line{grid-template-columns:70px 1fr}.wide2,.line .btn{grid-column:1/-1}}
</style>
