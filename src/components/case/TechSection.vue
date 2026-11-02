<script setup>
import { TECH } from '../../data/goodnightCase.js'
</script>

<template>
  <section class="tech">
    <div class="container grid">
      <div>
        <p class="kicker">{{ TECH.kicker }}</p>
        <h2>{{ TECH.title }}</h2>
        <p v-for="p in TECH.challenge" :key="p" class="para">{{ p }}</p>
        <ul class="stack"><li v-for="s in TECH.stack" :key="s">{{ s }}</li></ul>
      </div>
      <figure class="code">
        <figcaption>{{ TECH.codeTitle }}</figcaption>
        <pre><code>{{ TECH.code }}</code></pre>
      </figure>
    </div>
    <p class="container note">{{ TECH.note }}</p>
  </section>
</template>

<style scoped>
.tech{padding:96px 0;background:#ebe5d9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:start}
.kicker{margin:0 0 16px;color:var(--muted);font-size:11px;letter-spacing:.24em;text-transform:uppercase}
h2{margin:0 0 20px;font:500 clamp(28px,3.6vw,40px)/1.15 var(--serif)}
.para{margin:0 0 14px;color:var(--muted)}
.stack{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;list-style:none}
.stack li{padding:6px 14px;border:1px solid #cfc7b7;border-radius:999px;font-size:13px}
.code{margin:0;overflow:hidden;border-radius:16px;background:#242622;color:#ece7dc}
figcaption{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.1);color:#b9b4a6;font-size:12px;letter-spacing:.08em}
pre{margin:0;padding:20px;overflow-x:auto;font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.note{margin-top:32px;color:var(--muted);font-size:14px}
</style>
