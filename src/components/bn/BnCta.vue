<script setup>
import { CREDITS, GAME_URL, REPO } from '../../data/bataille.js'
</script>

<template>
  <section class="cta">
    <div class="container inner">
      <h2>Envie de jouer ?</h2>
      <div class="buttons">
        <a v-if="GAME_URL" class="btn play" :href="GAME_URL" target="_blank" rel="noopener">Jouer maintenant</a>
        <a class="btn ghost" :href="REPO" target="_blank" rel="noopener">Voir le code</a>
        <RouterLink class="btn ghost" to="/projets">Tous les projets</RouterLink>
      </div>
      <div class="credits">
        <h3>{{ CREDITS.title }}</h3>
        <p v-for="p in CREDITS.paragraphs" :key="p">{{ p }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta{padding:96px 0;background:linear-gradient(180deg,#0B3550,#072a40);color:#e6f3f7}
.inner{max-width:780px;text-align:center}
h2{margin:0 0 24px;font:italic 500 clamp(34px,5vw,54px)/1.1 var(--serif);color:#fff}
.buttons{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 26px;border-radius:999px;font-weight:600;text-decoration:none;transition:transform .25s}
.btn:hover{transform:translateY(-2px)}
.play{background:var(--sun);color:#10293a}
.ghost{border:1px solid rgba(255,255,255,.5);color:#fff}
.credits{margin-top:48px;padding-top:28px;border-top:1px solid rgba(255,255,255,.14);text-align:left}
h3{margin:0 0 10px;font:600 18px var(--serif);color:#fff}
.credits p{margin:0 0 8px;color:#9fc3d0;font-size:14px}
</style>
