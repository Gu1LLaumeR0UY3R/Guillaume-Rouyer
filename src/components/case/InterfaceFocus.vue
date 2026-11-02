<script setup>
import { FOCUS } from '../../data/goodnightCase.js'
import ImageSlot from './ImageSlot.vue'
</script>

<template>
  <section class="focus">
    <div class="container">
      <div class="head">
        <p class="kicker">{{ FOCUS.kicker }}</p>
        <h2>{{ FOCUS.title }}</h2>
        <p class="lead">{{ FOCUS.text }}</p>
      </div>
      <div class="grid">
        <article v-for="it in FOCUS.items" :key="it.slot" class="card" tabindex="0">
          <ImageSlot :name="it.slot" :alt="it.alt" ratio="4 / 3" />
          <div class="body">
            <span class="role">{{ it.role }}</span>
            <h3>{{ it.title }}</h3>
            <p class="more">{{ it.more }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.focus{padding:96px 0}
.head{max-width:36rem;margin-bottom:40px}
.kicker{margin:0 0 16px;color:var(--muted);font-size:11px;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 14px;font:500 clamp(30px,4vw,44px)/1.12 var(--serif)}
.lead{margin:0;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px}
.card{outline-offset:6px}
.body{padding:16px 4px 0}
.role{color:var(--olive);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
h3{margin:6px 0 0;font:600 22px var(--serif)}
.more{margin:8px 0 0;color:var(--muted);font-size:15px}
.card{transition:transform .4s}.card:hover{transform:translateY(-4px)}
.card:hover :deep(img){transform:scale(1.05)}
.more{max-height:0;opacity:0;overflow:hidden;transition:max-height .4s ease,opacity .4s ease}
.card:hover .more,.card:focus-within .more{max-height:8em;opacity:1}
@media (hover:none){.more{max-height:none;opacity:1}}
</style>
