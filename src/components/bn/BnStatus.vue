<script setup>
import { STATUS, STATUS_NOTE } from '../../data/bataille.js'
</script>

<template>
  <section id="statut" class="status">
    <div class="container">
      <p class="kicker">Roadmap</p>
      <h2>Ce qui existe, ce qui arrive.</h2>
      <div class="cols">
        <article v-for="col in STATUS" :key="col.state" :class="col.state">
          <h3><span class="dot" aria-hidden="true" />{{ col.label }}</h3>
          <ul><li v-for="it in col.items" :key="it">{{ it }}</li></ul>
        </article>
      </div>
      <p class="note">{{ STATUS_NOTE }}</p>
    </div>
  </section>
</template>

<style scoped>
.status{padding:96px 0;background:var(--sand)}
.kicker{margin:0 0 14px;color:#1d7a74;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 32px;font:500 clamp(30px,4vw,44px)/1.12 var(--serif);color:var(--deep)}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
article{padding:26px;border-radius:18px;background:var(--paper);border:1px solid #e3d7b6}
h3{display:flex;align-items:center;gap:10px;margin:0 0 14px;font:600 20px var(--serif);color:var(--deep)}
.dot{width:12px;height:12px;border-radius:50%}
.done .dot{background:var(--lagoon)}
.wip .dot{background:var(--sun)}
.next .dot{background:#b8b09a}
ul{margin:0;padding-left:18px;color:var(--muted);font-size:15px}
li+li{margin-top:8px}
.note{margin:20px 0 0;color:var(--muted);font-size:14px}
</style>
