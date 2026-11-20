<script setup>
import { computed } from 'vue'
import LegalLayout from '../components/LegalLayout.vue'
import RichText from '../components/RichText.vue'
import { useBlock } from '../content/blocks.js'
import { LEGAL_DEFAULT } from '../content/legalDefaults.js'

const { data, ready } = useBlock('legal')
const page = computed(() => data.value ?? LEGAL_DEFAULT)
</script>

<template>
  <LegalLayout v-if="ready" title="Mentions légales" :updated="page.updated">
    <template v-for="s in page.sections" :key="s.title">
      <h2>{{ s.title }}</h2>
      <RichText :body="s.body" />
    </template>
  </LegalLayout>
</template>
