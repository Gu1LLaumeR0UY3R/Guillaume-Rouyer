<script setup>
// Tableau SpiderNet : charge les éléments modifiés dans l'admin, puis affiche le tableau.
// Si la base est vide ou injoignable, le tableau garde son contenu d'origine.
import { onMounted, ref } from 'vue'
import SpiderNetBoard from './SpiderNetBoard.vue'

const items = ref(null)
const ready = ref(false)
onMounted(async () => {
  try {
    const r = await fetch('/api/content/spidernet')
    if (r.ok) items.value = (await r.json()).items
  } catch { /* contenu d'origine */ }
  ready.value = true
})
</script>

<template>
  <SpiderNetBoard v-if="ready" :items="items" />
</template>
