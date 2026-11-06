<script setup>
import BnHero from '../components/bn/BnHero.vue'
import BnArsenal from '../components/bn/BnArsenal.vue'
import BnEditor from '../components/bn/BnEditor.vue'
import BnAI from '../components/bn/BnAI.vue'
import BnWaves from '../components/bn/BnWaves.vue'
import BnStatus from '../components/bn/BnStatus.vue'
import BnCta from '../components/bn/BnCta.vue'
</script>

<template>
  <div class="bn">
    <BnHero />
    <BnArsenal />
    <BnEditor />
    <BnAI />
    <BnWaves />
    <BnStatus />
    <BnCta />
  </div>
</template>

<style>
.bn{--ocean:#126184;--deep:#0B3550;--sun:#FFBD54;--sand:#F1E5C8;--lagoon:#28A6A0;--paper:#FBF6EA;--ink:#10293a;--muted:#4b6272;--serif:'Playfair Display Variable','Playfair Display',Georgia,serif;--sans:'DM Sans Variable','DM Sans',system-ui,sans-serif;background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.65}
</style>
