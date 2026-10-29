<script setup>
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()
</script>

<template>
  <a class="skip" href="#contenu">Aller au contenu</a>
  <AppHeader v-if="!route.meta.fullscreen" />
  <main id="contenu"><RouterView /></main>
  <AppFooter v-if="!route.meta.fullscreen" />
</template>
