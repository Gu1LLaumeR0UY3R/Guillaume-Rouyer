<script setup>
import { CTA, REPO } from '../../data/goodnightCase.js'
</script>

<template>
  <section class="cta">
    <div class="container inner">
      <h2>{{ CTA.title }}</h2>
      <p>{{ CTA.text }}</p>
      <div class="buttons">
        <a class="btn main" :href="REPO" target="_blank" rel="noopener">Voir le code</a>
        <RouterLink class="btn ghost" to="/projets">Tous les projets</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta{padding:96px 0;background:linear-gradient(135deg,#5d6853,#69745D 55%,#7d8870);color:#f5f1e9}
.inner{max-width:760px;text-align:center}
h2{margin:0 0 16px;font:500 clamp(30px,4.4vw,48px)/1.1 var(--serif)}
p{margin:0 0 28px;color:#e3e0d3}
.buttons{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 26px;border-radius:999px;font-weight:600;text-decoration:none}
.main{background:#f5f1e9;color:#242622}
.ghost{border:1px solid rgba(245,241,233,.6);color:#f5f1e9}

</style>
