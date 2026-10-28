<script setup>
import { LINKS } from '../data/contact.js'
</script>

<template>
  <section id="contact" class="contact" v-reveal>
    <div class="container">
      <h2>Travaillons ensemble</h2>
      <p>Alternance en 2026, mission freelance ou simple question : écris-moi.</p>
      <div class="cta">
        <a
          v-for="l in LINKS"
          :key="l.label"
          class="btn"
          :class="l.primary ? 'light' : 'outline'"
          :href="l.href"
          :rel="l.external ? 'noopener' : null"
        >{{ l.label }}</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact{display:flex;align-items:center;min-height:60vh;background:var(--deep);color:#f3fbf5;text-align:center}
.container{width:100%}
p{margin:0 0 28px;color:#b8d8c2}
.cta{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
.light{background:#39ff88;border-color:#39ff88;color:#052e16}
.outline{background:transparent;border-color:#b8d8c2;color:#f3fbf5}
</style>
