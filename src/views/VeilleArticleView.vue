<script setup>
// Page publique /veille/<slug> : article rendu depuis le Markdown, avec sommaire, couverture, temps de lecture et articles liés.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { lang, t } from '../i18n/index.js'
import { usePageMeta } from '../composables/usePageMeta.js'
import { fetchArticle, formatDate, isoDate, safeColor, safeHttps } from '../content/veille.js'
import { renderMarkdown } from '../lib/markdown.js'
import ArticleBody from '../components/veille/ArticleBody.vue'

const route = useRoute()
const state = ref('loading') // loading | ready | notfound | error
const article = ref(null)
const topics = ref([])
const related = ref([])
const progress = ref(0)
const activeId = ref('')
const bodyEl = ref(null)

const rendered = computed(() => (article.value ? renderMarkdown(article.value.body) : { html: '', toc: [] }))
const toc = computed(() => rendered.value.toc)
const cover = computed(() => (safeHttps(article.value?.cover?.url) ? article.value.cover : null))

usePageMeta(() => {
  if (state.value === 'ready' && article.value) {
    return { title: article.value.title, description: article.value.excerpt, image: cover.value?.url, type: 'article', canonical: `/veille/${article.value.slug}` }
  }
  if (state.value === 'notfound') return { title: t('veille.notFoundTitle'), noindex: true }
  return {}
})

// Progression de lecture + section active du sommaire (un seul écouteur, limité à une image par frame).
let raf = 0
function measure() {
  raf = 0
  const el = bodyEl.value?.$el ?? bodyEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const total = r.height - window.innerHeight * 0.6
  progress.value = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : (r.bottom < window.innerHeight ? 1 : 0)
  let cur = ''
  for (const h of el.querySelectorAll('h2[id],h3[id]')) { if (h.getBoundingClientRect().top <= 140) cur = h.id; else break }
  activeId.value = cur
}
const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure) }
onMounted(() => { window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll) })
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) })

function scrollToHash() {
  if (!route.hash) return
  document.getElementById(decodeURIComponent(route.hash.slice(1)))?.scrollIntoView()
}
async function load(slug) {
  state.value = 'loading'
  article.value = null
  try {
    const d = await fetchArticle(slug)
    if (!d) { state.value = 'notfound'; return }
    article.value = d.article
    topics.value = d.topics
    related.value = d.related
    state.value = 'ready'
    await nextTick()
    scrollToHash()
    measure()
  } catch { state.value = 'error' }
}
watch(() => route.params.slug, (slug) => { if (slug) load(slug) }, { immediate: true })
</script>

<template>
  <div class="container">
    <div v-if="state === 'ready' && article" class="bar" role="progressbar" :aria-label="t('veille.progress')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(progress * 100)"><i :style="{ transform: `scaleX(${progress})` }" /></div>
    <div v-if="state === 'ready' && article" class="layout">
    <article class="va">
      <RouterLink class="back" to="/veille">← {{ t('veille.back') }}</RouterLink>
      <header>
        <ul v-if="topics.length" class="pills" aria-label="Sujets">
          <li v-for="s in topics" :key="s.slug">
            <RouterLink :to="{ path: '/veille', query: { sujet: s.slug } }"><i :style="{ background: safeColor(s.color) }" aria-hidden="true" />{{ s.name }}</RouterLink>
          </li>
        </ul>
        <h1 lang="fr">{{ article.title }}</h1>
        <p class="meta">
          <time :datetime="isoDate(article.publishedAt)">{{ formatDate(article.publishedAt, lang) }}</time> · {{ article.readingMinutes }} {{ t('veille.minutes') }}
        </p>
        <p v-if="article.excerpt" class="lead" lang="fr">{{ article.excerpt }}</p>
        <p v-if="lang === 'en'" class="note">{{ t('veille.frOnly') }}</p>
      </header>

      <figure v-if="cover" class="cover">
        <img :src="cover.url" :alt="cover.alt" loading="eager" decoding="async" referrerpolicy="no-referrer" />
        <figcaption v-if="cover.caption" lang="fr">{{ cover.caption }}</figcaption>
      </figure>

      <details v-if="toc.length >= 2" class="toc toc-inline">
        <summary>{{ t('veille.toc') }}</summary>
        <ol>
          <li v-for="h in toc" :key="h.id" :class="`l${h.level}`" lang="fr"><RouterLink :to="{ hash: `#${h.id}` }">{{ h.text }}</RouterLink></li>
        </ol>
      </details>

      <ArticleBody ref="bodyEl" :html="rendered.html" lang="fr" />

      <section v-if="related.length" class="related" aria-labelledby="rel-title">
        <h2 id="rel-title">{{ t('veille.related') }}</h2>
        <ul>
          <li v-for="r in related" :key="r.slug">
            <RouterLink :to="`/veille/${r.slug}`" lang="fr">{{ r.title }}</RouterLink>
            <span class="meta">{{ formatDate(r.publishedAt, lang) }} · {{ r.readingMinutes }} {{ t('veille.minutes') }}</span>
          </li>
        </ul>
      </section>
    </article>
    <aside v-if="toc.length >= 2" class="toc toc-side" :aria-label="t('veille.toc')">
      <p class="toc-title">{{ t('veille.toc') }}</p>
      <ol>
        <li v-for="h in toc" :key="h.id" :class="[`l${h.level}`, { on: activeId === h.id }]" lang="fr"><RouterLink :to="{ hash: `#${h.id}` }" :aria-current="activeId === h.id ? 'location' : null">{{ h.text }}</RouterLink></li>
      </ol>
      <a class="totop" href="#" @click.prevent="scrollTo({ top: 0, behavior: 'smooth' })">↑ {{ t('veille.top') }}</a>
    </aside>
    </div>

    <div v-else-if="state === 'loading'" class="va status" aria-busy="true">{{ t('veille.loading') }}</div>
    <div v-else class="va status" role="alert">
      <h1>{{ state === 'notfound' ? t('veille.notFoundTitle') : t('veille.error') }}</h1>
      <p v-if="state === 'notfound'">{{ t('veille.notFound') }}</p>
      <RouterLink class="back" to="/veille">← {{ t('veille.back') }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.bar{position:fixed;top:0;left:0;right:0;z-index:60;height:3px;background:transparent;pointer-events:none}
.bar i{display:block;height:100%;background:var(--green);transform-origin:0 50%;transition:transform .08s linear}
.layout{display:grid;grid-template-columns:minmax(0,1fr);justify-content:center}
.va{width:100%;max-width:760px;min-width:0;margin:0 auto;padding:40px 0 96px}
.toc-side{display:none}
@media (min-width:1200px){
  .layout{grid-template-columns:minmax(0,760px) 250px;gap:64px}
  .va{margin:0}
  .toc-inline{display:none}
  .toc-side{display:block;position:sticky;top:96px;align-self:start;margin-top:120px;max-height:calc(100vh - 128px);overflow:auto;padding:0 0 0 18px;border-left:2px solid var(--line);font-size:14.5px}
  .toc-side .toc-title{margin:0 0 10px;color:var(--muted);font:700 12px var(--font);letter-spacing:.08em;text-transform:uppercase}
  .toc-side ol{margin:0;padding:0;list-style:none}
  .toc-side li{margin:2px 0}
  .toc-side li.l3{padding-left:14px}
  .toc-side a{display:block;padding:4px 0;color:var(--muted);text-decoration:none;line-height:1.35}
  .toc-side a:hover,.toc-side li.on a{color:var(--fg)}
  .toc-side li.on a{font-weight:700;color:var(--green)}
  .totop{display:inline-block;margin-top:14px;color:var(--muted);font-size:13px}
}
@media (prefers-reduced-motion:reduce){.bar i{transition:none}}
.back{display:inline-block;margin-bottom:20px;color:var(--green);font-weight:600;text-decoration:none}
.back:hover{text-decoration:underline}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px;padding:0;list-style:none}
.pills a{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 12px;border:1px solid var(--line);border-radius:999px;color:var(--fg);font-size:14px;font-weight:600;text-decoration:none}
.pills a:hover{border-color:var(--neon)}
.pills i{display:inline-block;width:10px;height:10px;border-radius:50%}
h1{margin:0 0 12px;font:700 clamp(32px,6vw,48px)/1.15 var(--serif)}
.meta{margin:0 0 16px;color:var(--muted);font-size:15px}
.lead{margin:0 0 24px;color:var(--muted);font-size:20px;line-height:1.55}
.note{margin:0 0 16px;color:var(--muted);font-size:14px}
.cover{margin:0 0 32px}
.cover img{display:block;width:100%;height:auto;border-radius:var(--radius)}
.cover figcaption{margin-top:8px;color:var(--muted);font-size:14px}
.toc-inline{margin:0 0 36px;padding:14px 20px;border:1px solid var(--line);border-radius:16px;background:var(--card)}
.toc-inline summary{cursor:pointer;font:700 17px var(--font)}
.toc-inline summary:focus-visible{outline:3px solid var(--green);outline-offset:3px;border-radius:6px}
.toc-inline ol{margin:10px 0 0;padding-left:1.2em}
.toc-inline li{margin:4px 0}.toc-inline li.l3{margin-left:1.2em;list-style:circle}
.toc-inline a{color:var(--fg);text-underline-offset:3px}.toc-inline a:hover{color:var(--green)}
.related{margin-top:56px;padding-top:24px;border-top:1px solid var(--line)}
.related h2{margin:0 0 12px;font:700 22px var(--serif)}
.related ul{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.related li{display:grid;gap:2px}
.related a{color:var(--green);font-weight:600;font-size:18px}
.related .meta{margin:0;font-size:14px}
.status{color:var(--muted)}
</style>
