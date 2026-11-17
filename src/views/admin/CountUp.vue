<script setup>
// Nombre qui monte de 0 à sa valeur (sans animation si l'utilisateur la désactive dans son système).
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({ value: { type: Number, required: true }, duration: { type: Number, default: 900 } })
const shown = ref(0)
let raf = 0

function run(to) {
  cancelAnimationFrame(raf)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !to) { shown.value = to; return }
  const from = shown.value, t0 = performance.now()
  const step = (t) => {
    const k = Math.min(1, (t - t0) / props.duration)
    shown.value = Math.round(from + (to - from) * (1 - (1 - k) ** 3)) // ralentit vers la fin
    if (k < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
watch(() => props.value, run, { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template><span>{{ shown }}</span></template>
