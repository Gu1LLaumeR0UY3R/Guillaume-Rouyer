<script setup>
import { computed } from 'vue'

// Les images sont détectées automatiquement dans src/assets/bataille-navale/ d'après leur nom de fichier.
const files = import.meta.glob('../../assets/bataille-navale/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const urls = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop().replace(/\.[^.]+$/, ''), url]))

const props = defineProps({
  name: { type: String, required: true },
  alt: { type: String, default: '' },
  ratio: { type: String, default: '16 / 9' },
})
const src = computed(() => urls[props.name])
</script>

<template>
  <figure class="slot" :style="{ aspectRatio: ratio }">
    <img v-if="src" :src="src" :alt="alt" loading="lazy" decoding="async">
    <div v-else class="ph" aria-hidden="true">
      <svg viewBox="0 0 120 40" preserveAspectRatio="none"><path d="M0 24C15 16 25 32 40 24S65 16 80 24 105 32 120 24V40H0Z" fill="rgba(255,255,255,.16)" /><path d="M0 30C15 22 25 38 40 30S65 22 80 30 105 38 120 30V40H0Z" fill="rgba(255,255,255,.12)" /></svg>
    </div>
  </figure>
</template>

<style scoped>
.slot{position:relative;margin:0;overflow:hidden;border-radius:14px;background:#0f4a66}
img{display:block;width:100%;height:100%;object-fit:cover;transition:transform 1s cubic-bezier(.2,.7,.2,1)}
.ph{position:absolute;inset:0;display:flex;align-items:flex-end;background:linear-gradient(160deg,#1b7a9d,#0e4f6e)}
.ph svg{width:100%;height:55%}
</style>
