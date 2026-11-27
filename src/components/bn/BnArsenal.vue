<script setup>
import { ARSENAL, GAMEPLAY } from '../../data/bataille.js'
import BnImage from './BnImage.vue'
import { spotlight as vSpotlight } from '../../directives/spotlight.js'
</script>

<template>
  <section id="jeu" class="play" v-reveal>
    <div class="container grid">
      <div class="text">
        <p class="kicker">{{ GAMEPLAY.kicker }}</p>
        <h2>{{ GAMEPLAY.title }}</h2>
        <p v-for="p in GAMEPLAY.paragraphs" :key="p">{{ p }}</p>
        <ul class="fleet" aria-label="Flotte">
          <li v-for="[name, n] in GAMEPLAY.fleet" :key="name"><span class="dots"><i v-for="k in n" :key="k" :style="{ '--n': k }" /></span>{{ name }}</li>
        </ul>
      </div>
      <BnImage name="plateau" alt="Plateau de jeu en 3D" ratio="16 / 10" class="shot" />
    </div>
    <div class="container">
      <h3 class="sub">L'arsenal</h3>
      <div class="cards">
        <article v-for="t in ARSENAL" :key="t.id" v-spotlight class="card" :class="t.id">
          <span class="ico" aria-hidden="true">
            <svg v-if="t.id === 'sonar'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="2.4" /><path d="M10.5 10.5a7.8 7.8 0 0 0 0 11M21.5 10.5a7.8 7.8 0 0 1 0 11M6.5 6.5a13.4 13.4 0 0 0 0 19M25.5 6.5a13.4 13.4 0 0 1 0 19" /></svg>
            <svg v-else-if="t.id === 'brouilleur'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 18l4-8 4 12 4-16 4 20 4-10 4 6" /></svg>
            <svg v-else-if="t.id === 'bouee'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4v8M12 12h8l2 9H10zM6 26c3-2 5-2 8 0s5 2 8 0 4-2 6 0" /></svg>
            <svg v-else viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="16" cy="16" r="3" /><circle cx="6.5" cy="9" r="3" /><circle cx="25.5" cy="9" r="3" /><circle cx="6.5" cy="23" r="3" /><circle cx="25.5" cy="23" r="3" /><path d="M9 11l4 3M23 11l-4 3M9 21l4-3M23 21l-4-3" /></svg>
          </span>
          <h4>{{ t.name }}</h4>
          <p>{{ t.text }}</p>
          <div class="meta">
            <span class="price"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M3 12c3-5 8-6 12-3l4-3v12l-4-3c-4 3-9 2-12-3z" fill="currentColor" /></svg>{{ t.price }} poissons</span>
            <span class="recharge" :aria-label="`Recharge : ${t.recharge} tours`"><small>Recharge</small><i v-for="k in t.recharge" :key="k" /></span>
          </div>
          <p class="turn" :class="t.turn ? 'costs' : 'free'">{{ t.turn ? 'Coûte le tour' : 'Le tir reste possible' }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.play{padding:96px 0 88px;background:var(--paper)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:48px;align-items:center;margin-bottom:64px}
.kicker{margin:0 0 14px;color:#1d7a74;font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 18px;font:500 clamp(30px,4vw,44px)/1.12 var(--serif);color:var(--deep)}
.text p{margin:0 0 12px;color:var(--muted)}
.fleet{display:flex;flex-wrap:wrap;gap:8px 18px;margin:20px 0 0;padding:0;list-style:none;font-size:13px}
.dots{display:inline-flex;gap:2px;margin-right:8px;vertical-align:middle}
.dots i{width:7px;height:7px;border-radius:2px;background:var(--ocean);transform:scale(0)}
.in .dots i{animation:pop .45s cubic-bezier(.3,1.5,.5,1) both;animation-delay:calc(var(--n) * 70ms + 350ms)}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.dots i{transform:none;animation:none!important}}
.shot{box-shadow:0 30px 60px -30px rgba(11,53,80,.5);border:6px solid var(--sand)}
.sub{margin:0 0 20px;font:500 26px var(--serif);color:var(--deep)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:20px}
.card{position:relative;padding:24px;border:1px solid #e3d7b6;border-radius:18px;background:var(--sand);transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .35s ease-out,box-shadow .35s}
.card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.55),transparent 62%);opacity:0;transition:opacity .3s;pointer-events:none}
.card:hover::before{opacity:1}
.card:hover{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(-6px);box-shadow:0 22px 40px -24px rgba(11,53,80,.55)}
.ico{position:relative;display:grid;place-items:center;width:52px;height:52px;margin-bottom:14px;border-radius:50%;background:#fff;color:var(--ocean)}
.sonar .ico::after{content:'';position:absolute;inset:-2px;border:2px solid var(--lagoon);border-radius:50%;animation:ping 2.6s ease-out infinite}
@keyframes ping{from{transform:scale(1);opacity:.9}to{transform:scale(1.7);opacity:0}}
.ico svg{width:28px;height:28px}
h4{margin:0 0 8px;font:600 20px var(--serif);color:var(--deep)}
.card p{margin:0 0 14px;color:var(--muted);font-size:15px}
.meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding-top:12px;border-top:1px dashed #cfc29b;font-size:13px;color:var(--deep)}
.price{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#fff;font-weight:600}
.recharge{display:inline-flex;align-items:center;gap:3px}
.recharge small{margin-right:4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.recharge i{width:8px;height:8px;border-radius:50%;background:var(--ocean)}
.turn{margin:10px 0 0;font-size:13px;font-weight:600}
.costs{color:#a4572b}
.free{color:#1d7a74}
@media (prefers-reduced-motion:reduce){.sonar .ico::after{animation:none}}
.kicker::after{content:'';display:block;width:42px;height:2px;margin-top:10px;background:currentColor;opacity:.55;transform:scaleX(0);transform-origin:left;transition:transform .8s .25s ease}
.in .kicker::after{transform:scaleX(1)}
@media (prefers-reduced-motion:reduce){.kicker::after{transform:none;transition:none}}
</style>
