<script setup>
import { INTRO } from '../../data/goodnightCase.js'
import ImageSlot from './ImageSlot.vue'
</script>

<template>
  <section id="apercu" class="intro">
    <div class="container grid">
      <div class="text">
        <p class="kicker">{{ INTRO.kicker }}</p>
        <h2>{{ INTRO.title }}</h2>
        <p v-for="p in INTRO.paragraphs" :key="p" class="para">{{ p }}</p>
        <ul class="stack"><li v-for="s in INTRO.stack" :key="s">{{ s }}</li></ul>
      </div>
      <div class="devices">
        <div class="laptop">
          <div class="screen"><ImageSlot name="desktop" alt="Capture de la version web de Goodnight" ratio="16 / 10" /></div>
          <div class="base" />
        </div>
        <div class="phone">
          <div class="screen"><ImageSlot name="mobile" alt="Capture de l'application mobile de Goodnight" ratio="9 / 19" /></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.intro{padding:96px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px;align-items:center}
.kicker{margin:0 0 16px;color:var(--muted);font-size:11px;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 20px;font:500 clamp(30px,4vw,44px)/1.12 var(--serif)}
.para{margin:0 0 14px;color:var(--muted)}
.stack{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;list-style:none}
.stack li{padding:6px 14px;border:1px solid var(--sand);border-radius:999px;font-size:13px}
.devices{position:relative;padding:0 0 40px 70px}
.laptop{position:relative}
.laptop .screen{overflow:hidden;border:10px solid #1d1f1c;border-radius:16px 16px 6px 6px;background:#1d1f1c;box-shadow:0 30px 60px -30px rgba(36,38,34,.45)}
.laptop .base{width:108%;height:14px;margin-left:-4%;border-radius:0 0 14px 14px;background:linear-gradient(#d6cfc1,#bdb6a7)}
.phone{position:absolute;left:0;bottom:0;width:clamp(96px,26%,140px)}
.phone .screen{overflow:hidden;border:7px solid #1d1f1c;border-radius:24px;background:#1d1f1c;box-shadow:0 24px 44px -20px rgba(36,38,34,.55)}
.screen :deep(.slot){border-radius:0}

</style>
