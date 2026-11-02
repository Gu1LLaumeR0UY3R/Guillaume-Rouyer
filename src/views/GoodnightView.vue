<script setup>
import CaseHero from '../components/case/CaseHero.vue'
import ProductIntro from '../components/case/ProductIntro.vue'
import JourneySteps from '../components/case/JourneySteps.vue'
import InterfaceFocus from '../components/case/InterfaceFocus.vue'
import TechSection from '../components/case/TechSection.vue'
import CaseCta from '../components/case/CaseCta.vue'
</script>

<template>
  <div class="case">
    <CaseHero />
    <ProductIntro />
    <JourneySteps />
    <InterfaceFocus />
    <TechSection />
    <CaseCta />
  </div>
</template>

<style>
.case{--cream:#F5F1E9;--sand:#DED7CA;--ink:#242622;--olive:#69745D;--muted:#5f625b;--serif:'Playfair Display Variable','Playfair Display',Georgia,serif;--sans:'DM Sans Variable','DM Sans',system-ui,sans-serif;background:var(--cream);color:var(--ink);font-family:var(--sans);line-height:1.65}
.case h1,.case h2,.case h3{color:var(--ink)}
</style>
