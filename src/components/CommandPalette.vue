<script setup>
// Palette de commandes (Ctrl/Cmd + K, ou touche « / ») : recherche globale dans les pages, projets, articles de veille et actions.
// Motif « combobox + listbox » : flèches, Entrée, Échap ; boîte de dialogue native (focus piégé).
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { lang } from '../i18n/index.js'
import { projects, loadProjects, projectLink } from '../content/projects.js'
import { fetchList } from '../content/veille.js'
import { links, settings } from '../content/settings.js'
import { openCv } from '../content/cvGate.js'
import { unlock } from '../lib/achievements.js'

const router = useRouter()
const { toggle: toggleTheme } = useTheme()
const dlg = ref(null)
const input = ref(null)
const q = ref('')
const idx = ref(0)
const articles = ref([])
let loaded = false

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const go = (to) => () => router.push(to)
const ext = (href) => () => window.open(href, '_blank', 'noopener,noreferrer')
const fire = (name) => () => window.dispatchEvent(new CustomEvent(name))

const PAGES = [
  ['Accueil', '/'], ['Projets', '/projets'], ['Veille technologique', '/veille'], ['À propos', '/a-propos'], ['Contact', '/contact'],
  ['Maintenant', '/maintenant'], ['Mes outils', '/outils'], ['Changelog', '/changelog'],
  ['Mentions légales', '/mentions-legales'], ['Confidentialité', '/confidentialite'],
]

const items = computed(() => {
  const out = PAGES.map(([label, to]) => ({ group: 'Pages', label, hint: to, run: go(to) }))
  for (const p of projects.value) out.push({ group: 'Projets', label: p.name, hint: p.tag, extra: `${p.desc} ${(p.stack ?? []).join(' ')}`, run: go(projectLink(p)) })
  for (const a of articles.value) out.push({ group: 'Veille', label: a.title, hint: 'Article', extra: a.excerpt, run: go(`/veille/${a.slug}`) })
  out.push(
    { group: 'Actions', label: 'Changer de thème clair / sombre', extra: 'theme dark light nuit', run: toggleTheme },
    { group: 'Actions', label: lang.value === 'fr' ? 'Passer le site en anglais' : 'Passer le site en français', extra: 'langue english french', run: () => { lang.value = lang.value === 'fr' ? 'en' : 'fr' } },
    { group: 'Actions', label: 'Ouvrir le terminal', extra: 'terminal console shell commande', run: fire('open-terminal') },
    { group: 'Actions', label: 'Voir mes succès', extra: 'succes achievements trophees', run: fire('open-succes') },
    { group: 'Actions', label: 'Ouvrir les réglages d\'accessibilité', extra: 'a11y handicap contraste taille', run: fire('open-a11y') },
  )
  if (settings.value.hasCv === true) out.push({ group: 'Actions', label: 'Télécharger le CV', extra: 'cv resume pdf', run: openCv })
  for (const l of links.value.filter((x) => x.external)) out.push({ group: 'Actions', label: `Ouvrir ${l.label}`, hint: 'Lien externe', run: ext(l.href) })
  return out
})

const results = computed(() => {
  const n = norm(q.value).trim()
  if (!n) return items.value.filter((i) => i.group === 'Pages' || i.group === 'Actions').slice(0, 14)
  const words = n.split(/\s+/)
  return items.value
    .map((i) => {
      const label = norm(i.label)
      const all = `${label} ${norm(i.extra)}`
      if (!words.every((w) => all.includes(w))) return null
      return { i, score: label.startsWith(n) ? 0 : label.includes(n) ? 1 : words.every((w) => label.includes(w)) ? 2 : 3 }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .slice(0, 12)
    .map((r) => r.i)
})

watch(q, () => { idx.value = 0 })

async function ensureData() {
  if (loaded) return
  loaded = true
  loadProjects()
  try { articles.value = (await fetchList())?.articles ?? [] } catch { loaded = false }
}
function show() {
  if (dlg.value?.open) return
  q.value = ''; idx.value = 0
  dlg.value.showModal()
  nextTick(() => input.value?.focus())
  ensureData()
  unlock('curieux')
}
function hide() { dlg.value?.close() }
function pick(i) { const it = results.value[i]; if (!it) return; hide(); it.run() }
function onKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); idx.value = Math.min(idx.value + 1, results.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx.value = Math.max(idx.value - 1, 0) }
  else if (e.key === 'Enter') { e.preventDefault(); pick(idx.value) }
  nextTick(() => dlg.value?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }))
}
const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
function onGlobal(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.value?.open ? hide() : show() }
  else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e) && !dlg.value?.open) { e.preventDefault(); show() }
}
window.addEventListener('keydown', onGlobal)
window.addEventListener('open-palette', show)
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => { window.removeEventListener('keydown', onGlobal); window.removeEventListener('open-palette', show) })
</script>

<template>
  <dialog ref="dlg" class="pal" aria-label="Recherche et commandes" @click="(e) => e.target === dlg && hide()">
    <div class="box">
      <input
        ref="input" v-model="q" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list"
        :aria-activedescendant="results.length ? `pal-${idx}` : undefined" placeholder="Rechercher une page, un projet, un article, une action…" autocomplete="off" spellcheck="false" @keydown="onKey"
      />
      <ul id="pal-list" role="listbox" aria-label="Résultats">
        <template v-for="(r, i) in results" :key="r.group + r.label + i">
          <li v-if="i === 0 || results[i - 1].group !== r.group" class="grp" role="presentation">{{ r.group }}</li>
          <li :id="`pal-${i}`" role="option" :aria-selected="i === idx" :class="{ on: i === idx }" @mousemove="idx = i" @click="pick(i)">
            <span>{{ r.label }}</span><small v-if="r.hint">{{ r.hint }}</small>
          </li>
        </template>
        <li v-if="!results.length" class="none" role="presentation">Aucun résultat</li>
      </ul>
      <p class="foot" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> naviguer · <kbd>Entrée</kbd> ouvrir · <kbd>Échap</kbd> fermer</p>
    </div>
  </dialog>
</template>

<style scoped>
.pal{width:min(620px,calc(100vw - 24px));margin:12vh auto auto;padding:0;border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--fg);box-shadow:0 24px 70px rgba(0,0,0,.35)}
.pal::backdrop{background:rgba(0,0,0,.45)}
.box{display:grid}
input{width:100%;box-sizing:border-box;min-height:56px;padding:0 20px;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--fg);font:500 17px var(--font);outline:none}
input:focus-visible{box-shadow:inset 0 -3px 0 var(--green)}
ul{max-height:min(52vh,420px);margin:0;padding:6px;overflow:auto;list-style:none}
li{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:10px 14px;border-radius:10px;cursor:pointer;font-size:15px}
li.grp{padding:10px 14px 4px;color:var(--muted);font:700 12px var(--font);letter-spacing:.08em;text-transform:uppercase;cursor:default}
li.on{background:var(--green);color:var(--on-green)}
li.none{color:var(--muted);cursor:default}
small{color:inherit;opacity:.7;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%}
.foot{margin:0;padding:10px 16px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
kbd{padding:1px 6px;margin-right:3px;border:1px solid var(--line);border-radius:6px;font:600 12px var(--font)}
</style>
