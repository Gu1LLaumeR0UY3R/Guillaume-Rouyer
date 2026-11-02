<script setup>
import { STEPS } from '../../data/goodnightCase.js'
</script>

<template>
  <section class="journey">
    <div class="container grid">
      <div>
        <p class="kicker">Le parcours</p>
        <h2>De la recherche à la réservation.</h2>
      </div>
      <ol class="steps">
        <li v-for="s in STEPS" :key="s.n">
          <span class="ico" aria-hidden="true">
            <svg v-if="s.icon === 'search'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <svg v-else-if="s.icon === 'calendar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <h3>{{ s.n }}. {{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.journey{padding:88px 0;background:#ebe5d9}
.grid{display:grid;grid-template-columns:minmax(240px,1fr) 2.4fr;gap:48px;align-items:start}
@media (max-width:860px){.grid{grid-template-columns:1fr}}
.kicker{margin:0 0 16px;color:var(--muted);font-size:11px;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0;font:500 clamp(28px,3.4vw,38px)/1.15 var(--serif)}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;margin:0;padding:0;list-style:none}
.ico{display:grid;place-items:center;width:52px;height:52px;margin-bottom:18px;border-radius:50%;background:var(--sand)}
h3{margin:0 0 8px;font:600 20px var(--serif)}
.steps p{margin:0;color:var(--muted);font-size:15px}
.steps li{transition:transform .35s}.steps li:hover{transform:translateY(-4px)}
.ico{transition:background .35s,color .35s}.steps li:hover .ico{background:var(--ink);color:var(--cream)}
</style>
