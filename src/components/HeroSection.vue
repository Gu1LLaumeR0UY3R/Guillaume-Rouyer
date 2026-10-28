<script setup>
import MeadowField from './MeadowField.vue'
</script>

<template>
  <section id="accueil" class="hero">
    <div class="container">
      <p class="badge">Recherche d'alternance 2026 · Bachelor Concepteur Développeur d'Applications</p>
      <h1>Développeur Web &amp; PHP, <span>full stack</span>.</h1>
      <p class="lead">
        Guillaume Rouyer, développeur junior curieux et autodidacte. Des API REST aux apps mobiles,
        jusqu'à une IA locale auto-hébergée sur mon propre serveur Proxmox.
      </p>
      <div class="cta">
        <a class="btn btn-primary" href="#projets">Voir mes projets</a>
        <a class="btn btn-ghost" href="https://github.com/Gu1LLaumeR0UY3R" rel="noopener">GitHub</a>
      </div>
      <MeadowField />
    </div>
  </section>
</template>

<style scoped>
.hero{padding:96px 0 24px}
.badge{display:inline-block;margin:0 0 24px;padding:6px 14px;border:1px solid var(--neon);border-radius:999px;color:var(--green);font-size:14px}
h1{max-width:900px;margin-bottom:24px;font-size:clamp(40px,7vw,72px)}
h1 span{color:var(--green)}
.lead{max-width:640px;margin:0 0 32px;color:var(--muted);font-size:clamp(17px,2vw,20px)}
.cta{display:flex;flex-wrap:wrap;gap:16px}
</style>
