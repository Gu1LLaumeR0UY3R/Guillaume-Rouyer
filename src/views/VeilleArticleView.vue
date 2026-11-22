<script setup>
// Page publique /veille/<slug> : article rendu depuis le Markdown, avec sommaire, couverture, temps de lecture et articles liés.
import { computed, nextTick, ref, watch } from 'vue'
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
  } catch { state.value = 'error' }
}
watch(() => route.params.slug, (slug) => { if (slug) load(slug) }, { immediate: true })
</script>

<template>
  <div class="container">
    <article v-if="state === 'ready' && article" class="va">
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

      <nav v-if="toc.length >= 2" class="toc" aria-labelledby="toc-title">
        <h2 id="toc-title">{{ t('veille.toc') }}</h2>
        <ol>
          <li v-for="h in toc" :key="h.id" :class="`l${h.level}`" lang="fr"><RouterLink :to="{ hash: `#${h.id}` }">{{ h.text }}</RouterLink></li>
        </ol>
      </nav>

      <ArticleBody :html="rendered.html" lang="fr" />

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

    <div v-else-if="state === 'loading'" class="va status" aria-busy="true">{{ t('veille.loading') }}</div>
    <div v-else class="va status" role="alert">
      <h1>{{ state === 'notfound' ? t('veille.notFoundTitle') : t('veille.error') }}</h1>
      <p v-if="state === 'notfound'">{{ t('veille.notFound') }}</p>
      <RouterLink class="back" to="/veille">← {{ t('veille.back') }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.va{max-width:760px;margin:0 auto;padding:40px 0 96px}
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
.toc{margin:0 0 36px;padding:18px 22px;border:1px solid var(--line);border-radius:16px;background:var(--card)}
.toc h2{margin:0 0 8px;font:700 18px var(--font)}
.toc ol{margin:0;padding-left:1.2em}
.toc li{margin:4px 0}.toc li.l3{margin-left:1.2em;list-style:circle}
.toc a{color:var(--fg);text-underline-offset:3px}.toc a:hover{color:var(--green)}
.related{margin-top:56px;padding-top:24px;border-top:1px solid var(--line)}
.related h2{margin:0 0 12px;font:700 22px var(--serif)}
.related ul{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.related li{display:grid;gap:2px}
.related a{color:var(--green);font-weight:600;font-size:18px}
.related .meta{margin:0;font-size:14px}
.status{color:var(--muted)}
</style>
