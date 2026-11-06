<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { GAME_URL, HERO, REPO } from '../../data/bataille.js'

// Diaporama : hero-1, hero-2… déposés dans src/assets/bataille-navale/.
const files = import.meta.glob('../../assets/bataille-navale/hero-*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const slides = Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url)

const index = ref(0)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
let timer
onMounted(() => {
  if (slides.length > 1 && !reduceMotion) timer = setInterval(() => { index.value = (index.value + 1) % slides.length }, 6500)
})
onBeforeUnmount(() => clearInterval(timer))
const pad = (n) => String(n).padStart(2, '0')
const counter = computed(() => `${pad(index.value + 1)} / ${pad(slides.length)}`)
</script>

<template>
  <header class="hero">
    <div class="bg">
      <img v-for="(s, i) in slides" :key="s" :src="s" alt="" :class="{ on: i === index }">
      <div v-if="!slides.length" class="fallback">
        <span class="sun" />
        <svg class="wave w1" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60C100 20 200 100 300 60S500 20 600 60 800 100 900 60 1100 20 1200 60V120H0Z" /></svg>
        <svg class="wave w2" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70C120 40 180 100 300 70S480 40 600 70 780 100 900 70 1080 40 1200 70V120H0Z" /></svg>
      </div>
      <div class="veil" />
    </div>
    <div class="content container">
      <p class="kicker">{{ HERO.kicker }}</p>
      <h1>{{ HERO.title }}</h1>
      <p class="tagline">{{ HERO.tagline }}</p>
      <p class="text">{{ HERO.text }}</p>
      <ul class="meta"><li v-for="m in HERO.meta" :key="m">{{ m }}</li></ul>
      <div class="actions">
        <a v-if="GAME_URL" class="btn play" :href="GAME_URL" target="_blank" rel="noopener">Jouer maintenant</a>
        <a class="btn ghost" :href="REPO" target="_blank" rel="noopener">Voir le code</a>
        <a class="btn link" href="#jeu">Découvrir le projet ↓</a>
      </div>
    </div>
    <p v-if="slides.length > 1" class="counter" aria-hidden="true">{{ counter }}</p>
  </header>
</template>

<style scoped>
.hero{position:relative;display:flex;align-items:center;min-height:clamp(540px,86vh,800px);overflow:hidden;background:#0e5578;color:#fff}
.bg{position:absolute;inset:0}
.bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 1.3s ease}
.bg img.on{opacity:1}
.fallback{position:absolute;inset:0;background:linear-gradient(180deg,#f2b36a 0%,#e58c66 22%,#2c8cae 46%,#126184 70%,#0B3550 100%)}
.sun{position:absolute;right:16%;top:20%;width:clamp(90px,14vw,190px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff6d8,#ffd27a 55%,rgba(255,189,84,0) 72%);filter:blur(1px)}
.wave{position:absolute;left:-5%;width:110%;height:34%}
.w1{bottom:0;fill:rgba(11,53,80,.85);animation:drift 14s ease-in-out infinite alternate}
.w2{bottom:6%;fill:rgba(40,166,160,.35);animation:drift 10s ease-in-out infinite alternate-reverse}
@keyframes drift{from{transform:translateX(-2%)}to{transform:translateX(2%)}}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,38,58,.78),rgba(6,38,58,.35) 55%,rgba(6,38,58,0))}
.content{position:relative;padding-top:72px;padding-bottom:96px}
.content>*{max-width:36rem}
.kicker{margin:0 0 18px;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:#bfe6ee}
h1{margin:0 0 14px;font:italic 500 clamp(54px,9vw,104px)/1 var(--serif);color:var(--sun);text-shadow:0 4px 30px rgba(0,0,0,.25)}
.tagline{margin:0 0 14px;font:500 clamp(22px,3vw,30px)/1.25 var(--serif)}
.text{margin:0 0 18px;color:#e3f3f7}
.meta{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 26px;padding:0;list-style:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#bfe6ee}
.meta li+li::before{content:'·';margin-right:16px;opacity:.6}
.actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 24px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none;transition:transform .25s,box-shadow .25s}
.btn:hover{transform:translateY(-2px)}
.play{background:var(--sun);color:#10293a;box-shadow:0 12px 28px -12px rgba(255,189,84,.8)}
.ghost{border:1px solid rgba(255,255,255,.6);color:#fff}
.link{padding:0 8px;color:#fff;opacity:.9}
.counter{position:absolute;left:clamp(20px,5vw,48px);bottom:24px;margin:0;font-size:13px;letter-spacing:.12em}
.content>*{opacity:0;transform:translateY(24px);animation:rise 1s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(var(--i,0)*.12s + .15s)}
.content>:nth-child(1){--i:0}.content>:nth-child(2){--i:1}.content>:nth-child(3){--i:2}.content>:nth-child(4){--i:3}.content>:nth-child(5){--i:4}.content>:nth-child(6){--i:5}
@keyframes rise{to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.content>*{opacity:1;transform:none;animation:none}.w1,.w2{animation:none}}
</style>
