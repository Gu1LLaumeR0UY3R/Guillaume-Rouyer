<script setup>
import ForestScene from './ForestScene.vue'
</script>

<template>
  <section id="accueil" class="hero">
    <ForestScene />
    <div class="container">
      <p class="badge">Bachelor Concepteur Développeur d'Applications · Full Stack &amp; Cybersécurité</p>
      <h1>Développeur Web &amp; PHP, <span>full stack</span>.</h1>
      <p class="lead">
        Guillaume Rouyer, développeur junior curieux et autodidacte. Des API REST aux apps mobiles,
        jusqu'à une IA locale auto-hébergée sur mon propre serveur Proxmox.
      </p>
      <div class="cta">
        <RouterLink class="btn btn-primary" to="/projets">Voir mes projets</RouterLink>
        <a class="btn btn-ghost" href="https://github.com/Gu1LLaumeR0UY3R" rel="noopener">GitHub</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Le ciel est dessiné dans la scène : les couleurs du texte suivent le jour/nuit (data-sky posé par ForestScene) */
.hero{--hero-fg:#14231a;--hero-muted:#3f5246;--hero-green:#14532d;position:relative;overflow:hidden;min-height:clamp(560px,86vh,780px);padding:96px 0 0;border-radius:0 0 32px 32px}
.hero[data-sky="night"]{--hero-fg:#eef4ff;--hero-muted:#c3cdea;--hero-green:#8df2a6}
.hero > .container{position:relative;z-index:1}
.badge{display:inline-block;margin:0 0 24px;padding:6px 14px;border:1px solid var(--neon);border-radius:999px;background:rgba(255,255,255,.55);color:var(--hero-green);font-size:14px}
.hero[data-sky="night"] .badge{background:rgba(14,22,60,.5)}
h1{max-width:900px;margin-bottom:24px;color:var(--hero-fg);font-size:clamp(40px,7vw,72px);text-shadow:0 0 18px rgba(255,255,255,.35)}
h1 span{color:var(--hero-green)}
.lead{max-width:640px;margin:0 0 32px;color:var(--hero-muted);font-size:clamp(17px,2vw,20px)}
.hero[data-sky="night"] h1{text-shadow:none}
.hero[data-sky="night"] :deep(.btn-ghost){color:var(--hero-fg);border-color:rgba(238,244,255,.45)}
.cta{display:flex;flex-wrap:wrap;gap:16px}
</style>
