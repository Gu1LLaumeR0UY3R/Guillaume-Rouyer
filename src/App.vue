<script setup>
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
</script>

<template>
  <a class="skip" href="#contenu">Aller au contenu</a>
  <AppHeader />
  <main id="contenu">
    <HeroSection />
    <ProjectsSection />
  </main>
</template>
