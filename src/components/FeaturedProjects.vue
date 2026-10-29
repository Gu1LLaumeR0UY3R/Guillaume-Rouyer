<script setup>
import { computed } from 'vue'
import { PROJECTS, projectLink } from '../data/projects.js'

const featured = computed(() => PROJECTS.filter((p) => p.featured))
</script>

<template>
  <section class="featured" v-reveal>
    <div class="container">
      <h2>Projets phares</h2>
      <p class="intro">Les projets dont je suis le plus fier, avec leur histoire et leurs choix techniques.</p>
      <div class="grid">
        <RouterLink v-for="(p, i) in featured" :key="p.slug" class="card" :class="{ big: i === 0 }" :to="projectLink(p)">
          <div class="banner" :style="{ background: p.accent }">
            <span v-if="p.status" class="status">{{ p.status }}</span>
            <h3>{{ p.name }}</h3>
          </div>
          <div class="content">
            <p>{{ p.desc }}</p>
            <ul class="stack"><li v-for="s in p.stack.slice(0, 4)" :key="s">{{ s }}</li></ul>
            <span class="more">Découvrir le projet →</span>
          </div>
        </RouterLink>
      </div>
      <p class="all"><RouterLink class="btn btn-ghost" to="/projets">Voir tous les projets</RouterLink></p>
    </div>
  </section>
</template>

<style scoped>
.intro{max-width:60ch;margin:0 0 32px;color:var(--muted);font-size:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.card{display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);text-decoration:none;transition:transform .3s,box-shadow .3s,border-color .3s}
.card:hover{transform:translateY(-6px);box-shadow:0 24px 40px -18px var(--glow);border-color:var(--neon)}
.big{grid-column:1/-1}
.banner{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:10px;min-height:150px;padding:24px;color:#fff}
.big .banner{min-height:220px}
.banner::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.5),rgba(0,0,0,.05))}
.banner>*{position:relative}
.status{padding:3px 12px;border-radius:999px;background:rgba(255,255,255,.2);font-size:12px}
h3{font-size:clamp(28px,4vw,40px)}
.content{display:flex;flex-direction:column;gap:14px;padding:24px}
.content p{margin:0;color:var(--muted)}
.stack{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.stack li{padding:4px 10px;border:1px solid var(--line);border-radius:999px;font-size:13px}
.more{color:var(--green);font-weight:600}
.all{margin:32px 0 0}
</style>
