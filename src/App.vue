<script setup>
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import AboutSection from './components/AboutSection.vue'
import TimelineSection from './components/TimelineSection.vue'
</script>

<template>
  <a class="skip" href="#contenu">Aller au contenu</a>
  <AppHeader />
  <main id="contenu">
    <HeroSection />
    <ProjectsSection />
    <AboutSection />
    <TimelineSection />
  </main>
</template>
