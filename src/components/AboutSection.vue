<script setup>
import { FACTS, SKILLS } from '../data/skills.js'
</script>

<template>
  <section id="apropos" class="about" v-reveal>
    <div class="container">
      <h2>À propos</h2>
      <div class="grid">
        <div>
          <p>
            Je suis développeur junior, passionné par les nouvelles technologies. Autodidacte et curieux, j'aime comprendre
            comment les choses fonctionnent, des API REST aux applications mobiles, jusqu'à l'auto-hébergement d'une IA
            locale sur mon propre serveur Proxmox.
          </p>
          <p>
            Je me forme au Bachelor Concepteur Développeur d'Applications (Full Stack &amp; Cybersécurité), après un BTS SIO
            option SLAM. J'aime autant construire l'interface que l'infrastructure qui la fait tourner : PHP et Laravel,
            Python et FastAPI, Vue.js, React Native, Docker.
          </p>
          <ul class="facts"><li v-for="f in FACTS" :key="f">{{ f }}</li></ul>
        </div>
        <div>
          <div v-for="g in SKILLS" :key="g.title" class="group">
            <h3>{{ g.title }}</h3>
            <ul class="pills"><li v-for="i in g.items" :key="i">{{ i }}</li></ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:48px;align-items:start}
p{max-width:62ch;margin:0 0 16px;color:var(--muted);font-size:18px}
.facts,.pills{display:flex;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.facts{gap:10px;margin-top:24px}
.facts li{padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:14px}
.group+.group{margin-top:22px}
h3{margin:0 0 10px;font-size:20px}
.pills{gap:8px}
.pills li{padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:14px}
</style>
