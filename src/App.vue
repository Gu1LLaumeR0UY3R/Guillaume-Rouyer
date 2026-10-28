<script setup>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <a class="skip" href="#contenu">Aller au contenu</a>
  <AppHeader />
  <main id="contenu"><RouterView /></main>
  <AppFooter />
</template>
