<script setup>
import { bios, facts, skillGroups } from '../content/site.js'
import { pick, t } from '../i18n/index.js'
</script>

<template>
  <section id="apropos" class="about" v-reveal>
    <div class="container">
      <h2>{{ t('about.title') }}</h2>
      <div class="grid">
        <div>
          <p v-for="b in bios" :key="b.id ?? b.text_fr" class="bio">{{ pick(b, 'text') }}</p>
          <ul class="facts"><li v-for="f in facts" :key="f.id ?? f.text_fr"><span aria-hidden="true">ᛟ</span>{{ pick(f, 'text') }}</li></ul>
        </div>
        <div class="groups">
          <article v-for="(g, n) in skillGroups" :key="g.id" class="group" :style="{ '--i': n }">
            <h3><span aria-hidden="true">{{ 'ᚠᚢᚦᚨ'[n % 4] }}</span>{{ pick(g, 'title') }}</h3>
            <ul class="pills">
              <li v-for="s in g.items" :key="s.id" :class="{ gauge: s.level > 0 }" :style="{ '--lvl': s.level / 100 }" :title="s.level > 0 ? `${t('about.level')} ${s.level} / 100` : undefined">
                {{ s.name }}<i v-if="s.level > 0" class="bar" />
              </li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:48px;align-items:start}
.bio{max-width:62ch;margin:0 0 16px;color:var(--muted);font-size:18px}
.bio:first-of-type::first-letter{float:left;margin:4px 12px 0 0;color:var(--green);font:600 64px/0.8 var(--serif);text-shadow:0 0 18px var(--glow)}
.facts,.pills{display:flex;flex-wrap:wrap;margin:0;padding:0;list-style:none}
.facts{gap:10px;margin-top:24px}
.facts li{display:inline-flex;gap:8px;align-items:center;padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);font-size:14px}
.facts span{color:var(--green);font-family:var(--runic)}
.groups{display:grid;gap:18px}
.group{padding:18px 20px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:transform .3s,border-color .3s,box-shadow .3s}
.group:hover{transform:translateY(-4px);border-color:var(--green);box-shadow:0 14px 30px -18px var(--glow)}
h3{display:flex;gap:10px;align-items:center;margin:0 0 12px;color:var(--green);font-size:19px}
h3 span{font:400 22px var(--runic);opacity:.9}
.pills{gap:8px}
.pills li{position:relative;overflow:hidden;padding:5px 12px;border:1px solid var(--line);border-radius:999px;background:var(--bg);font-size:14px;transition:border-color .2s,color .2s}
.pills li:hover{border-color:var(--green);color:var(--green)}
.gauge{padding-bottom:9px!important}
.bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--green),var(--neon));transform:scaleX(0);transform-origin:left;transition:transform 1.1s cubic-bezier(.2,.8,.2,1) .3s}
.reveal.in .bar{transform:scaleX(var(--lvl))}
.reveal.in .group{animation:rise .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 110ms)}
@keyframes rise{from{opacity:0;transform:translateY(22px)}}
</style>
