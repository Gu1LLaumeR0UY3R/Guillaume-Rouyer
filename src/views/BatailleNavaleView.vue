<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BnHero from '../components/bn/BnHero.vue'
import BnStats from '../components/bn/BnStats.vue'
import BnArsenal from '../components/bn/BnArsenal.vue'
import BnEditor from '../components/bn/BnEditor.vue'
import BnAI from '../components/bn/BnAI.vue'
import BnWaves from '../components/bn/BnWaves.vue'
import BnStatus from '../components/bn/BnStatus.vue'
import BnCta from '../components/bn/BnCta.vue'
import BnDivider from '../components/bn/BnDivider.vue'

const progress = ref(0)
const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
}
onMounted(() => { window.addEventListener('scroll', onScroll, { passive: true }); onScroll() })
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="bn">
    <div class="progress" aria-hidden="true"><span :style="{ transform: `scaleX(${progress})` }" /></div>
    <BnHero />
    <BnDivider top="#0B3550" bottom="#FBF6EA" />
    <BnStats />
    <BnArsenal />
    <BnDivider top="#FBF6EA" bottom="#0B3550" />
    <BnEditor />
    <BnDivider top="#0e4468" bottom="#e4f1f1" />
    <BnAI />
    <BnDivider top="#f4f1e6" bottom="#126184" />
    <BnWaves />
    <BnDivider top="#0B3550" bottom="#F1E5C8" />
    <BnStatus />
    <BnDivider top="#F1E5C8" bottom="#0B3550" />
    <BnCta />
  </div>
</template>

<style>
.bn{--ocean:#126184;--deep:#0B3550;--sun:#FFBD54;--sand:#F1E5C8;--lagoon:#28A6A0;--paper:#FBF6EA;--ink:#10293a;--muted:#4b6272;--serif:'Playfair Display Variable','Playfair Display',Georgia,serif;--sans:'DM Sans Variable','DM Sans',system-ui,sans-serif;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.65}
.bn .progress{position:fixed;left:0;right:0;top:0;z-index:40;height:3px;background:rgba(11,53,80,.15)}
.bn .progress span{display:block;height:100%;background:linear-gradient(90deg,#28A6A0,#FFBD54);transform-origin:left;transition:transform .12s linear}
</style>
