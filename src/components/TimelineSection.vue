<script setup>
import { computed } from 'vue'
import { experiences, formations } from '../content/site.js'
import { lang, pick, t } from '../i18n/index.js'

const columns = computed(() => [{ key: 'journey.formation', items: formations.value }, { key: 'journey.experience', items: experiences.value }])
const points = (item) => { const p = item[`points_${lang.value}`]; return p?.length ? p : item.points_fr ?? [] }
</script>

<template>
  <section id="parcours" class="parcours" v-reveal>
    <div class="container">
      <h2>{{ t('journey.title') }}</h2>
      <div class="grid">
        <div v-for="col in columns" :key="col.key">
          <h3>{{ t(col.key) }}</h3>
          <ol class="timeline">
            <li v-for="(item, n) in col.items" :key="item.id ?? item.title_fr" :style="{ '--i': n }">
              <span class="when">{{ pick(item, 'when') }}</span>
              <h4>{{ pick(item, 'title') }}</h4>
              <p v-if="pick(item, 'place')" class="where">{{ pick(item, 'place') }}</p>
              <ul v-if="points(item).length"><li v-for="p in points(item)" :key="p">{{ p }}</li></ul>
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
h3{margin-bottom:22px;color:var(--green);font-size:24px}
.timeline{position:relative;margin:0;padding:0 0 0 30px;list-style:none}
.timeline::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:2px;background:linear-gradient(var(--green),var(--line));transform:scaleY(0);transform-origin:top;transition:transform 1.4s cubic-bezier(.2,.8,.2,1) .2s}
.reveal.in .timeline::before{transform:none}
.timeline>li{position:relative;padding-bottom:30px}
.timeline>li::before{content:'';position:absolute;left:-36px;top:7px;width:12px;height:12px;background:var(--green);transform:rotate(45deg);box-shadow:0 0 0 4px var(--bg),0 0 14px var(--glow)}
.reveal.in .timeline>li{animation:rise .65s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 140ms + 250ms)}
.when{color:var(--green);font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
h4{margin:4px 0;font:600 18px var(--font)}
.where{margin:0 0 8px;color:var(--muted);font-size:15px}
ul{margin:8px 0;padding-left:18px;color:var(--muted);font-size:15px}
.tech{margin:8px 0 0;color:var(--neon);font-size:13px}
@keyframes rise{from{opacity:0;transform:translateX(-16px)}}
</style>
