<script setup>
// Page publique /veille : liste des articles publiés, filtrable par sujet (?sujet=<identifiant>).
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { lang, t } from '../i18n/index.js'
import { usePageMeta } from '../composables/usePageMeta.js'
import { fetchList, formatDate, isoDate, safeColor, safeHttps } from '../content/veille.js'

const route = useRoute()
const router = useRouter()
const articles = ref([])
const topics = ref([])
const state = ref('loading') // loading | ready | error

const active = computed(() => (typeof route.query.sujet === 'string' ? route.query.sujet : ''))
const SORTS = ['recent', 'old', 'short', 'az']
const q = ref(typeof route.query.q === 'string' ? route.query.q.slice(0, 80) : '')
const sort = ref(SORTS.includes(route.query.tri) ? route.query.tri : 'recent')
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const shown = computed(() => {
  let list = active.value ? articles.value.filter((a) => a.topics.includes(active.value)) : articles.value
  const terms = norm(q.value).split(/\s+/).filter(Boolean)
  if (terms.length) {
    list = list.filter((a) => {
      const hay = norm(`${a.title} ${a.excerpt} ${a.topics.map((s) => topicMap.value[s]?.name ?? s).join(' ')}`)
      return terms.every((w) => hay.includes(w))
    })
  }
  const by = { recent: (a, b) => b.publishedAt - a.publishedAt, old: (a, b) => a.publishedAt - b.publishedAt, short: (a, b) => a.readingMinutes - b.readingMinutes || b.publishedAt - a.publishedAt, az: (a, b) => a.title.localeCompare(b.title, 'fr') }
  const sorted = [...list].sort(by[sort.value])
  // Sans recherche, les articles « à la une » passent en premier (l'ordre choisi est gardé dans chaque groupe).
  return terms.length ? sorted : [...sorted.filter((a) => a.featured), ...sorted.filter((a) => !a.featured)]
})
// La recherche et le tri vivent dans l'adresse (?q=…&tri=…) : on peut partager ou rafraîchir la page.
let urlTimer
watch([q, sort], () => {
  clearTimeout(urlTimer)
  urlTimer = setTimeout(() => {
    const query = { ...route.query }
    if (q.value.trim()) query.q = q.value.trim(); else delete query.q
    if (sort.value !== 'recent') query.tri = sort.value; else delete query.tri
    router.replace({ path: route.path, query })
  }, 300)
})
const keep = (extra = {}) => ({ path: '/veille', query: { ...(q.value.trim() ? { q: q.value.trim() } : {}), ...(sort.value !== 'recent' ? { tri: sort.value } : {}), ...extra } })
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
      <RouterLink class="chip" :to="keep()" :aria-current="active ? null : 'page'">{{ t('veille.all') }}</RouterLink>
      <RouterLink v-for="s in topics" :key="s.slug" class="chip" :to="keep({ sujet: s.slug })" :aria-current="active === s.slug ? 'page' : null">
        <i :style="{ background: safeColor(s.color) }" aria-hidden="true" />{{ s.name }}<span class="n">{{ s.articles }}</span>
      </RouterLink>
    </nav>

    <form class="tools" role="search" @submit.prevent>
      <label class="search"><span class="sr">{{ t('veille.search') }}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input v-model="q" type="search" maxlength="80" autocomplete="off" :placeholder="t('veille.searchHint')" />
        <button v-if="q" type="button" class="x" :aria-label="t('veille.clear')" @click="q = ''">×</button>
      </label>
      <label class="sortsel">{{ t('veille.sort') }}
        <select v-model="sort">
          <option value="recent">{{ t('veille.sortRecent') }}</option><option value="old">{{ t('veille.sortOld') }}</option>
          <option value="short">{{ t('veille.sortShort') }}</option><option value="az">{{ t('veille.sortAz') }}</option>
        </select>
      </label>
    </form>

    <p v-if="state === 'loading'" class="status">{{ t('veille.loading') }}</p>
    <div v-else-if="state === 'error'" class="status" role="alert">
      <p>{{ t('veille.error') }}</p>
      <button class="retry" type="button" @click="load">{{ t('veille.retry') }}</button>
    </div>
    <template v-else>
      <p class="count" aria-live="polite">{{ shown.length }} {{ shown.length > 1 ? t('veille.articles') : t('veille.article') }}</p>
      <p v-if="!shown.length" class="status">{{ q.trim() ? t('veille.noMatch') : active ? t('veille.emptyTopic') : t('veille.empty') }}</p>
      <ul v-else class="grid">
        <li v-for="a in shown" :key="a.slug">
          <article class="vcard" :class="{ star: a.featured }" lang="fr">
            <img v-if="safeHttps(a.cover?.url)" :src="a.cover.url" :alt="a.cover.alt" width="640" height="360" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <div class="body">
              <span v-if="a.featured" class="badge"><span aria-hidden="true">★</span> {{ t('veille.featured') }}</span>
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
.tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:16px 0 0}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.search{position:relative;display:flex;align-items:center;flex:1 1 260px;color:var(--muted)}
.search svg{position:absolute;left:14px;pointer-events:none}
.search input{width:100%;min-height:46px;padding:0 42px 0 42px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--fg);font:16px var(--font)}
.search input:focus-visible,.sortsel select:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
.search .x{position:absolute;right:8px;width:32px;height:32px;border:0;border-radius:50%;background:none;color:var(--muted);font-size:22px;line-height:1;cursor:pointer}
.sortsel{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:15px}
.sortsel select{min-height:46px;padding:0 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--fg);font:16px var(--font)}
.count{margin:16px 0;color:var(--muted)}
.status{margin:32px 0;color:var(--muted)}
.retry{min-height:44px;padding:0 20px;border:1px solid var(--green);border-radius:12px;background:transparent;color:var(--fg);font:600 15px var(--font);cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:24px;margin:0;padding:0;list-style:none}
.vcard{position:relative;display:flex;flex-direction:column;height:100%;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:transform .3s,box-shadow .3s,border-color .3s}
.vcard.star{border-color:#c5a45d;box-shadow:0 0 0 1px #c5a45d inset}
.badge{justify-self:start;align-self:flex-start;margin-bottom:10px;padding:3px 12px;border-radius:999px;background:#49443d;color:#f1dca0;border:1px solid #c5a45d;font:700 13px var(--font);letter-spacing:.03em}
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
