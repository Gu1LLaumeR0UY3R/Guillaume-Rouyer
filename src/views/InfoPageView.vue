<script setup>
// Pages à sections éditables dans l'admin : Maintenant, Mes outils, Changelog (le bloc est choisi par la route).
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LegalLayout from '../components/LegalLayout.vue'
import RichText from '../components/RichText.vue'
import { useBlock } from '../content/blocks.js'
import { CHANGELOG_DEFAULT, NOW_DEFAULT, TOOLS_DEFAULT } from '../content/pageDefaults.js'

const DEFAULTS = { now: NOW_DEFAULT, tools: TOOLS_DEFAULT, changelog: CHANGELOG_DEFAULT }
const route = useRoute()
const block = computed(() => route.meta.block)
const { data, ready } = useBlock(route.meta.block)
const page = computed(() => data.value ?? DEFAULTS[block.value])
</script>

<template>
  <LegalLayout v-if="ready" :title="route.meta.title" :updated="page.updated">
    <template v-for="s in page.sections" :key="s.title">
      <h2>{{ s.title }}</h2>
      <RichText :body="s.body" />
    </template>
  </LegalLayout>
</template>
