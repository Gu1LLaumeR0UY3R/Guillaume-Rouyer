<script setup>
import { EDITOR } from '../../data/bataille.js'
import BnImage from './BnImage.vue'
</script>

<template>
  <section id="editeur" class="editor">
    <div class="container">
      <p class="kicker">{{ EDITOR.kicker }}</p>
      <h2>{{ EDITOR.title }}</h2>
      <p class="sub">{{ EDITOR.subtitle }}</p>
      <div class="stage"><BnImage name="editeur" alt="L'éditeur de cartes de Bataille Navale" ratio="16 / 9" /></div>
      <ul class="verbs">
        <li v-for="v in EDITOR.verbs" :key="v.key">
          <span class="key">{{ v.key }}</span>
          <h3>{{ v.title }}</h3>
          <p>{{ v.text }}</p>
        </li>
      </ul>
      <div class="steps">
        <figure v-for="s in EDITOR.steps" :key="s.slot">
          <BnImage :name="s.slot" :alt="s.alt" ratio="4 / 3" />
          <figcaption>{{ s.title }}</figcaption>
        </figure>
      </div>
      <p class="maps">Cinq cartes fournies : <strong>{{ EDITOR.maps.join(' · ') }}</strong></p>
    </div>
  </section>
</template>

<style scoped>
.editor{padding:96px 0;background:linear-gradient(180deg,#0B3550,#0e4468);color:#e6f3f7}
.kicker{margin:0 0 14px;color:var(--sun);font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 14px;font:italic 500 clamp(34px,5vw,56px)/1.08 var(--serif);color:#fff}
.sub{max-width:44rem;margin:0 0 36px;color:#bcd9e3;font-size:18px}
.stage{padding:10px;border:1px solid rgba(255,255,255,.18);border-radius:22px;background:rgba(255,255,255,.06);box-shadow:0 40px 80px -40px rgba(0,0,0,.6)}
.verbs{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin:40px 0 0;padding:0;list-style:none}
.verbs li{padding:22px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.05);transition:transform .35s,background .35s}
.verbs li:hover{transform:translateY(-4px);background:rgba(255,255,255,.09)}
.key{display:inline-block;margin-bottom:10px;padding:3px 10px;border-radius:999px;background:rgba(255,189,84,.18);color:var(--sun);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
h3{margin:0 0 6px;font:600 20px var(--serif);color:#fff}
.verbs p{margin:0;color:#bcd9e3;font-size:15px}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:40px}
.steps figure{margin:0}
figcaption{margin-top:10px;color:#fff;font-weight:600;font-size:15px}
.maps{margin:32px 0 0;color:#bcd9e3}
.maps strong{color:#fff;font-weight:600}
</style>
