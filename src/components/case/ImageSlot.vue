<script setup>
import { computed } from 'vue'

// Les images sont détectées automatiquement dans src/assets/goodnight/ d'après leur nom de fichier.
const files = import.meta.glob('../../assets/goodnight/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
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
    <div v-else class="ph" aria-hidden="true"><span class="l1" /><span class="l2" /><span class="l3" /></div>
  </figure>
</template>

<style scoped>
.slot{position:relative;margin:0;overflow:hidden;border-radius:14px;background:#e9e3d6}
img{display:block;width:100%;height:100%;object-fit:cover;}
.ph{position:absolute;inset:0;display:grid;align-content:center;gap:10px;padding:12%;background:linear-gradient(145deg,#efe9dc,#ddd5c5)}
.ph span{display:block;height:9px;border-radius:99px;background:rgba(36,38,34,.1)}
.l1{width:55%}
.l2{width:80%}
.l3{width:40%}
</style>
