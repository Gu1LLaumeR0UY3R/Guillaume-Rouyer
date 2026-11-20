<script setup>
// Champ image : aperçu + choix dans le gestionnaire de médias + retrait.
import { ref } from 'vue'
import MediaPicker from './MediaPicker.vue'

defineProps({ modelValue: { type: String, default: '' }, label: { type: String, required: true }, fallback: { type: String, default: 'Image du dossier du site' } })
const emit = defineEmits(['update:modelValue'])
const picking = ref(false)
</script>

<template>
  <div class="img">
    <span class="lab">{{ label }}</span>
    <div class="box">
      <img v-if="modelValue" :src="modelValue" alt="">
      <span v-else class="none">{{ fallback }}</span>
    </div>
    <div class="btns">
      <button class="btn btn-ghost small" type="button" @click="picking = true">{{ modelValue ? 'Changer' : 'Choisir une image' }}</button>
      <button v-if="modelValue" class="btn btn-ghost small btn-danger" type="button" @click="emit('update:modelValue', '')">Retirer</button>
    </div>
    <MediaPicker v-if="picking" :selected="modelValue" @close="picking = false" @pick="(u) => { emit('update:modelValue', u); picking = false }" />
  </div>
</template>

<style scoped>
.img{display:grid;gap:8px;align-content:start}
.lab{font-weight:600}
.box{display:grid;place-items:center;aspect-ratio:16/10;max-width:260px;overflow:hidden;border:1px dashed var(--line);border-radius:12px;background:var(--bg)}
.box img{width:100%;height:100%;object-fit:cover}
.none{padding:8px;color:var(--muted);font-size:13px;text-align:center}
.btns{display:flex;flex-wrap:wrap;gap:8px}
</style>
