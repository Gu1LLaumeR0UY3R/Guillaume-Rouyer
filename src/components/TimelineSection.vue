<script setup>
import { EXPERIENCES, FORMATION } from '../data/timeline.js'

const columns = [
  { title: 'Formation', items: FORMATION },
  { title: 'Expériences', items: EXPERIENCES },
]
</script>

<template>
  <section id="parcours" class="parcours" v-reveal>
    <div class="container">
      <h2>Parcours</h2>
      <div class="grid">
        <div v-for="col in columns" :key="col.title">
          <h3>{{ col.title }}</h3>
          <ol class="timeline">
            <li v-for="item in col.items" :key="item.title">
              <span class="when">{{ item.when }}</span>
              <h4>{{ item.title }}</h4>
              <p class="where">{{ item.where }}</p>
              <ul v-if="item.points"><li v-for="p in item.points" :key="p">{{ p }}</li></ul>
              <p v-if="item.tech" class="tech">{{ item.tech }}</p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:56px}
h3{margin-bottom:20px;font-size:26px}
.timeline{position:relative;margin:0;padding:0 0 0 28px;list-style:none;border-left:2px solid var(--line)}
.timeline>li{position:relative;padding-bottom:28px}
.timeline>li::before{content:'';position:absolute;left:-36px;top:6px;width:14px;height:14px;border:3px solid var(--bg);border-radius:50%;background:var(--green)}
.when{color:var(--green);font-size:13px;font-weight:600;letter-spacing:.04em}
h4{margin:4px 0;font:600 18px var(--font)}
.where{margin:0 0 8px;color:var(--muted);font-size:15px}
ul{margin:8px 0;padding-left:18px;color:var(--muted);font-size:15px}
.tech{margin:8px 0 0;color:var(--green);font-size:13px}
</style>
