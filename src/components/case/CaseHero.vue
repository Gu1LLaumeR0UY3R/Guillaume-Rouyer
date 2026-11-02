<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { HERO } from '../../data/goodnightCase.js'

// Diaporama du bandeau : hero-1, hero-2… déposés dans src/assets/goodnight/.
const files = import.meta.glob('../../assets/goodnight/hero-*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const slides = Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url)

const index = ref(0)
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
let timer
onMounted(() => {
  if (slides.length > 1 && !reduceMotion) timer = setInterval(() => { index.value = (index.value + 1) % slides.length }, 6000)
})
onBeforeUnmount(() => clearInterval(timer))

const pad = (n) => String(n).padStart(2, '0')
const counter = computed(() => `${pad(index.value + 1)} / ${pad(slides.length)}`)
</script>

<template>
  <header class="hero">
    <div class="bg">
      <img v-for="(s, i) in slides" :key="s" :src="s" alt="" :class="{ on: i === index }">
      <div v-if="!slides.length" class="fallback" />
      <div class="veil" />
    </div>
    <div class="content container">
      <p class="kicker">{{ HERO.kicker }}</p>
      <h1>{{ HERO.title }}</h1>
      <p class="tagline">{{ HERO.tagline }}</p>
      <p class="text">{{ HERO.text }}</p>
      <ul class="meta"><li v-for="m in HERO.meta" :key="m">{{ m }}</li></ul>
      <a class="cta" href="#apercu">
        Découvrir le projet
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </div>
    <p v-if="slides.length > 1" class="counter" aria-hidden="true">{{ counter }}</p>
  </header>
</template>

<style scoped>
.hero{position:relative;display:flex;align-items:center;min-height:clamp(520px,82vh,780px);overflow:hidden;background:#efe3d2}
.bg{position:absolute;inset:0}
.bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 1.2s ease}
.bg img.on{opacity:1}
.fallback{position:absolute;inset:0;background:radial-gradient(circle at 78% 30%,rgba(255,232,190,.95),transparent 38%),linear-gradient(120deg,#f4e6d3,#e6c8a6 50%,#c7a389)}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(245,241,233,.93),rgba(245,241,233,.6) 42%,rgba(245,241,233,0) 75%)}
.content{position:relative;padding-top:72px;padding-bottom:96px}
.content>*{max-width:34rem}
.kicker{margin:0 0 20px;color:var(--muted);font-size:11px;letter-spacing:.24em;text-transform:uppercase}
h1{margin:0 0 20px;font:600 clamp(56px,9vw,104px)/.95 var(--serif);letter-spacing:-.01em}
.tagline{margin:0 0 14px;font:500 clamp(22px,3vw,30px)/1.25 var(--serif)}
.text{margin:0 0 20px;color:var(--muted)}
.meta{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 28px;padding:0;list-style:none;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.meta li+li::before{content:'·';margin-right:18px;opacity:.5}
.cta{display:inline-flex;align-items:center;gap:12px;min-height:48px;padding:0 24px;border-radius:999px;background:var(--ink);color:var(--cream);font-size:15px;font-weight:600;text-decoration:none;transition:transform .25s}
.cta:hover{transform:translateY(-2px)}
.counter{position:absolute;left:clamp(20px,5vw,48px);bottom:24px;margin:0;font-size:13px;letter-spacing:.12em}
.content>*{opacity:0;transform:translateY(26px);animation:rise 1s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(var(--i,0)*.12s + .15s)}
.content>:nth-child(1){--i:0}.content>:nth-child(2){--i:1}.content>:nth-child(3){--i:2}.content>:nth-child(4){--i:3}.content>:nth-child(5){--i:4}.content>:nth-child(6){--i:5}
.bg{animation:reveal 1.6s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{to{opacity:1;transform:none}}
@keyframes reveal{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.content>*{opacity:1;transform:none;animation:none}.bg{animation:none}}
</style>
