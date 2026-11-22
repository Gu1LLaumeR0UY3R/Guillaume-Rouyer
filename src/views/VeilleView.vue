<script setup>
// Page publique /veille : liste des articles publiés, filtrable par sujet (?sujet=<identifiant>).
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { lang, t } from '../i18n/index.js'
import { usePageMeta } from '../composables/usePageMeta.js'
import { fetchList, formatDate, isoDate, safeColor, safeHttps } from '../content/veille.js'

const route = useRoute()
const articles = ref([])
const topics = ref([])
const state = ref('loading') // loading | ready | error

const active = computed(() => (typeof route.query.sujet === 'string' ? route.query.sujet : ''))
const shown = computed(() => (active.value ? articles.value.filter((a) => a.topics.includes(active.value)) : articles.value))
const topicMap = computed(() => Object.fromEntries(topics.value.map((s) => [s.slug, s])))
const activeName = computed(() => topicMap.value[active.value]?.name ?? '')

usePageMeta(() => ({
  title: activeName.value ? `${t('veille.title')} : ${activeName.value}` : t('veille.title'),
  description: t('veille.metaDescription'),
  canonical: '/veille',
}))

async function load() {
  state.value = 'loading'
  try {
    const d = await fetchList()
    articles.value = d?.articles ?? []
    topics.value = d?.topics ?? []
    state.value = 'ready'
  } catch { state.value = 'error' }
}
onMounted(load)
</script>

<template>
  <section class="veille container" :aria-busy="state === 'loading'">
    <h1>{{ t('veille.title') }}</h1>
    <p class="lead">{{ t('veille.lead') }}</p>
    <p v-if="lang === 'en'" class="note">{{ t('veille.frOnly') }}</p>

    <nav v-if="topics.length" class="chips" :aria-label="t('veille.filter')">
      <RouterLink class="chip" :to="{ path: '/veille' }" :aria-current="active ? null : 'page'">{{ t('veille.all') }}</RouterLink>
      <RouterLink v-for="s in topics" :key="s.slug" class="chip" :to="{ path: '/veille', query: { sujet: s.slug } }" :aria-current="active === s.slug ? 'page' : null">
        <i :style="{ background: safeColor(s.color) }" aria-hidden="true" />{{ s.name }}<span class="n">{{ s.articles }}</span>
      </RouterLink>
    </nav>

    <p v-if="state === 'loading'" class="status">{{ t('veille.loading') }}</p>
    <div v-else-if="state === 'error'" class="status" role="alert">
      <p>{{ t('veille.error') }}</p>
      <button class="retry" type="button" @click="load">{{ t('veille.retry') }}</button>
    </div>
    <template v-else>
      <p class="count" aria-live="polite">{{ shown.length }} {{ shown.length > 1 ? t('veille.articles') : t('veille.article') }}</p>
      <p v-if="!shown.length" class="status">{{ active ? t('veille.emptyTopic') : t('veille.empty') }}</p>
      <ul v-else class="grid">
        <li v-for="a in shown" :key="a.slug">
          <article class="vcard" lang="fr">
            <img v-if="safeHttps(a.cover?.url)" :src="a.cover.url" :alt="a.cover.alt" width="640" height="360" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <div class="body">
              <ul v-if="a.topics.length" class="pills" aria-label="Sujets">
                <li v-for="s in a.topics" :key="s"><i :style="{ background: safeColor(topicMap[s]?.color) }" aria-hidden="true" />{{ topicMap[s]?.name ?? s }}</li>
              </ul>
              <h2><RouterLink class="stretch" :to="`/veille/${a.slug}`">{{ a.title }}</RouterLink></h2>
              <p v-if="a.excerpt" class="excerpt">{{ a.excerpt }}</p>
              <p class="meta" lang="">
                <time :datetime="isoDate(a.publishedAt)">{{ formatDate(a.publishedAt, lang) }}</time> · {{ a.readingMinutes }} {{ t('veille.minutes') }}
              </p>
            </div>
          </article>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.veille{padding-top:48px;padding-bottom:80px}
h1{margin:0 0 12px;font:700 clamp(34px,6vw,52px)/1.1 var(--serif)}
.lead{max-width:62ch;margin:0 0 8px;color:var(--muted);font-size:18px}
.note{margin:0 0 8px;color:var(--muted);font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0 8px}
.chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border:1px solid var(--line);border-radius:999px;color:var(--fg);text-decoration:none;transition:border-color .2s,background .2s}
.chip:hover{border-color:var(--neon)}
.chip[aria-current=page]{border-color:var(--neon);background:var(--card);font-weight:600}
.chip i,.pills i{display:inline-block;width:10px;height:10px;border-radius:50%;flex:none}
.chip .n{color:var(--muted);font-size:13px}
.count{margin:16px 0;color:var(--muted)}
.status{margin:32px 0;color:var(--muted)}
.retry{min-height:44px;padding:0 20px;border:1px solid var(--green);border-radius:12px;background:transparent;color:var(--fg);font:600 15px var(--font);cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:24px;margin:0;padding:0;list-style:none}
.vcard{position:relative;display:flex;flex-direction:column;height:100%;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:transform .3s,box-shadow .3s,border-color .3s}
.vcard:hover{transform:translateY(-6px);box-shadow:0 24px 40px -18px var(--glow);border-color:var(--neon)}
.vcard:focus-within{outline:3px solid var(--neon);outline-offset:3px}
.vcard img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
.body{display:flex;flex-direction:column;gap:10px;flex:1;padding:22px 24px 24px}
.pills{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.pills li{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border:1px solid var(--line);border-radius:999px;font-size:13px;font-weight:600}
h2{margin:0;font:700 24px/1.25 var(--serif)}
.stretch{color:var(--fg);text-decoration:none}
.stretch::after{content:"";position:absolute;inset:0}
.excerpt{margin:0;color:var(--muted)}
.meta{margin:auto 0 0;padding-top:6px;color:var(--muted);font-size:14px}
@media (prefers-reduced-motion:reduce){.vcard,.vcard:hover{transition:none;transform:none}}
</style>
