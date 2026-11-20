<script setup>
import { computed, provide, ref } from 'vue'
import { useScrollVar } from '../composables/useScrollVar.js'
import CaseHero from '../components/case/CaseHero.vue'
import ProductIntro from '../components/case/ProductIntro.vue'
import JourneySteps from '../components/case/JourneySteps.vue'
import InterfaceFocus from '../components/case/InterfaceFocus.vue'
import TechSection from '../components/case/TechSection.vue'
import CaseCta from '../components/case/CaseCta.vue'

import { useBlock } from '../content/blocks.js'
import { goodnightDefaults } from '../content/goodnightDefaults.js'

const root = ref(null)
useScrollVar(root)

// Textes et images modifiés dans l'admin ; sinon contenu d'origine
const { data, ready } = useBlock('goodnight')
provide('goodnight', computed(() => data.value ?? goodnightDefaults()))
</script>

<template>
  <div ref="root" class="case">
    <template v-if="ready">
    <CaseHero />
    <ProductIntro />
    <JourneySteps />
    <InterfaceFocus />
    <TechSection />
    <CaseCta />
    </template>
  </div>
</template>

<style>
.case{--cream:#F5F1E9;--sand:#DED7CA;--ink:#242622;--olive:#69745D;--muted:#5f625b;--serif:'Playfair Display Variable','Playfair Display',Georgia,serif;--sans:'DM Sans Variable','DM Sans',system-ui,sans-serif;background:var(--cream);color:var(--ink);font-family:var(--sans);line-height:1.65}
.case h1,.case h2,.case h3{color:var(--ink)}
</style>
