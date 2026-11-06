<script setup>
import { ARSENAL, GAMEPLAY } from '../../data/bataille.js'
import BnImage from './BnImage.vue'
</script>

<template>
  <section id="jeu" class="play">
    <div class="container grid">
      <div class="text">
        <p class="kicker">{{ GAMEPLAY.kicker }}</p>
        <h2>{{ GAMEPLAY.title }}</h2>
        <p v-for="p in GAMEPLAY.paragraphs" :key="p">{{ p }}</p>
        <ul class="fleet" aria-label="Flotte">
          <li v-for="[name, n] in GAMEPLAY.fleet" :key="name"><span class="dots"><i v-for="k in n" :key="k" /></span>{{ name }}</li>
        </ul>
      </div>
      <BnImage name="plateau" alt="Plateau de jeu en 3D" ratio="16 / 10" class="shot" />
    </div>
    <div class="container">
      <h3 class="sub">L'arsenal</h3>
      <div class="cards">
        <article v-for="t in ARSENAL" :key="t.id" class="card">
          <span class="ico" aria-hidden="true">
            <svg v-if="t.id === 'sonar'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="2.4" /><path d="M10.5 10.5a7.8 7.8 0 0 0 0 11M21.5 10.5a7.8 7.8 0 0 1 0 11M6.5 6.5a13.4 13.4 0 0 0 0 19M25.5 6.5a13.4 13.4 0 0 1 0 19" /></svg>
            <svg v-else-if="t.id === 'brouilleur'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 18l4-8 4 12 4-16 4 20 4-10 4 6" /></svg>
            <svg v-else-if="t.id === 'bouee'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4v8M12 12h8l2 9H10zM6 26c3-2 5-2 8 0s5 2 8 0 4-2 6 0" /></svg>
            <svg v-else viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="3" /><circle cx="6.5" cy="9" r="3" /><circle cx="25.5" cy="9" r="3" /><circle cx="6.5" cy="23" r="3" /><circle cx="25.5" cy="23" r="3" /><path d="M9 11l4 3M23 11l-4 3M9 21l4-3M23 21l-4-3" /></svg>
          </span>
          <h4>{{ t.name }}</h4>
          <p>{{ t.text }}</p>
          <ul class="facts">
            <li>{{ t.price }} poissons</li>
            <li>Recharge : {{ t.recharge }} tours</li>
            <li :class="t.turn ? 'costs' : 'free'">{{ t.turn ? 'Coûte le tour' : 'Le tir reste possible' }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.play{padding:96px 0 88px;background:var(--paper)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:center;margin-bottom:64px}
.kicker{margin:0 0 14px;color:#1d7a74;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 18px;font:500 clamp(30px,4vw,44px)/1.12 var(--serif);color:var(--deep)}
.text p{margin:0 0 12px;color:var(--muted)}
.fleet{display:flex;flex-wrap:wrap;gap:8px 18px;margin:20px 0 0;padding:0;list-style:none;font-size:13px}
.dots{display:inline-flex;gap:2px;margin-right:8px;vertical-align:middle}
.dots i{width:7px;height:7px;border-radius:2px;background:var(--ocean)}
.shot{box-shadow:0 30px 60px -30px rgba(11,53,80,.5);border:6px solid var(--sand)}
.sub{margin:0 0 20px;font:500 26px var(--serif);color:var(--deep)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px}
.card{padding:24px;border:1px solid #e3d7b6;border-radius:18px;background:var(--sand);transition:transform .35s,box-shadow .35s}
.card:hover{transform:translateY(-6px);box-shadow:0 22px 40px -24px rgba(11,53,80,.55)}
.ico{display:grid;place-items:center;width:52px;height:52px;margin-bottom:14px;border-radius:50%;background:#fff;color:var(--ocean)}
.ico svg{width:28px;height:28px}
h4{margin:0 0 8px;font:600 20px var(--serif);color:var(--deep)}
.card p{margin:0 0 14px;color:var(--muted);font-size:15px}
.facts{display:flex;flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;font-size:13px;color:var(--deep)}
.costs{color:#a4572b;font-weight:600}
.free{color:#1d7a74;font-weight:600}
</style>
