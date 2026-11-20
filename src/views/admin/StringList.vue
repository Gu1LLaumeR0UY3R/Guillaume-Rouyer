<script setup>
// Liste de textes modifiable : ajouter, supprimer, réordonner (pastilles, paragraphes…).
const props = defineProps({
  modelValue: { type: Array, required: true },
  label: { type: String, required: true },
  multiline: { type: Boolean, default: false },
  max: { type: Number, default: 10 },
  maxLength: { type: Number, default: 200 },
  hint: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const set = (list) => emit('update:modelValue', list)
const edit = (i, v) => set(props.modelValue.map((x, k) => (k === i ? v : x)))
const move = (i, d) => { const l = [...props.modelValue]; const j = i + d; if (j < 0 || j >= l.length) return; ;[l[i], l[j]] = [l[j], l[i]]; set(l) }
</script>

<template>
  <fieldset class="sl">
    <legend>{{ label }} <small>({{ modelValue.length }}/{{ max }})</small></legend>
    <p v-if="hint" class="hint">{{ hint }}</p>
    <div v-for="(v, i) in modelValue" :key="i" class="row">
      <textarea v-if="multiline" :value="v" rows="4" :maxlength="maxLength" :aria-label="`${label} ${i + 1}`" @input="edit(i, $event.target.value)" />
      <input v-else :value="v" :maxlength="maxLength" :aria-label="`${label} ${i + 1}`" @input="edit(i, $event.target.value)">
      <div class="btns">
        <button class="btn btn-ghost small" type="button" aria-label="Monter" @click="move(i, -1)">↑</button>
        <button class="btn btn-ghost small" type="button" aria-label="Descendre" @click="move(i, 1)">↓</button>
        <button class="btn btn-ghost small btn-danger" type="button" aria-label="Supprimer" @click="set(modelValue.filter((_, k) => k !== i))">✕</button>
      </div>
    </div>
    <button class="btn btn-ghost small add" type="button" :disabled="modelValue.length >= max" @click="set([...modelValue, ''])">+ Ajouter</button>
  </fieldset>
</template>

<style scoped>
.sl{display:grid;gap:10px;min-width:0}
.sl small{color:var(--muted);font-weight:400}
.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start}
.btns{display:flex;gap:6px}
.add{justify-self:start}
@media (max-width:600px){.row{grid-template-columns:1fr}}
</style>
