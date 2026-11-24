<script setup>
// Recherche globale de l'admin (Ctrl/Cmd + K) et raccourcis clavier (touche « ? » pour la liste).
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { PAGES } from '../../admin/pages.js'

const props = defineProps({ pages: { type: Array, default: () => [] } })
const router = useRouter()
const dlg = ref(null), help = ref(null), input = ref(null)
const q = ref(''), idx = ref(0)
const data = ref({ projects: [], articles: [], messages: [] })
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const go = (to) => () => router.push(to)

const items = computed(() => {
  const out = props.pages.map((p) => ({ group: 'Pages admin', label: p.label, hint: p.tip, run: go(p.to) }))
  for (const p of PAGES) out.push({ group: 'Contenu du site', label: p.title, hint: p.desc, run: go(p.to) })
  for (const p of data.value.projects) out.push({ group: 'Projets', label: p.name, hint: p.status, extra: `${p.tag} ${p.slug}`, run: go(`/admin/projets/${p.slug}`) })
  for (const a of data.value.articles) out.push({ group: 'Articles', label: a.title, hint: a.status === 'published' ? 'Publié' : 'Brouillon', extra: `${a.slug} ${a.excerpt}`, run: go(`/admin/veille/${a.slug}`) })
  for (const m of data.value.messages) out.push({ group: 'Messages', label: m.subject || '(sans objet)', hint: m.name, extra: `${m.email} ${m.preview}`, run: go('/admin/messages') })
  out.push(
    { group: 'Actions', label: 'Nouvel article', extra: 'creer ecrire veille', run: go('/admin/veille/nouveau') },
    { group: 'Actions', label: 'Nouveau projet', extra: 'creer ajouter', run: go('/admin/projets/nouveau') },
    { group: 'Actions', label: 'Voir le site', extra: 'public', run: () => window.open('/', '_blank', 'noopener') },
    { group: 'Actions', label: 'Raccourcis clavier', extra: 'aide', run: () => openHelp() },
  )
  return out
})
const results = computed(() => {
  const n = norm(q.value).trim()
  if (!n) return items.value.filter((i) => i.group === 'Actions' || i.group === 'Pages admin').slice(0, 14)
  const words = n.split(/\s+/)
  return items.value.map((i) => {
    const label = norm(i.label), all = `${label} ${norm(i.extra)} ${norm(i.hint)}`
    if (!words.every((w) => all.includes(w))) return null
    return { i, score: label.startsWith(n) ? 0 : label.includes(n) ? 1 : words.every((w) => label.includes(w)) ? 2 : 3 }
  }).filter(Boolean).sort((a, b) => a.score - b.score).slice(0, 14).map((r) => r.i)
})

let loaded = false
async function load() {
  if (loaded) return
  loaded = true
  const get = async (url, key, pick) => { try { data.value[key] = (await api(url))[pick] ?? [] } catch { loaded = false } }
  await Promise.all([get('/api/admin/projects', 'projects', 'projects'), get('/api/admin/veille/articles', 'articles', 'articles'), get('/api/admin/messages', 'messages', 'messages')])
}
function show() {
  if (dlg.value?.open) return
  q.value = ''; idx.value = 0; dlg.value.showModal(); nextTick(() => input.value?.focus()); load()
}
const hide = () => dlg.value?.close()
function pick(i) { const it = results.value[i]; if (!it) return; hide(); it.run() }
function onKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); idx.value = Math.min(idx.value + 1, results.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx.value = Math.max(idx.value - 1, 0) }
  else if (e.key === 'Enter') { e.preventDefault(); pick(idx.value) }
  nextTick(() => dlg.value?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }))
}

// ---- Raccourcis : g + lettre = aller à, n + lettre = nouveau
const GO = { t: '/admin/tableau', m: '/admin/messages', p: '/admin/projets', v: '/admin/veille', c: '/admin/contenu', i: '/admin/medias', s: '/admin/statistiques', j: '/admin/journaux', o: '/admin/corbeille', r: '/admin/reglages', u: '/admin/versions' }
const NEW = { a: '/admin/veille/nouveau', p: '/admin/projets/nouveau' }
const LABEL = { t: 'Tableau de bord', m: 'Messages', p: 'Projets', v: 'Veille', c: 'Contenu', i: 'Images (médias)', s: 'Statistiques', j: 'Journaux', o: 'Corbeille', r: 'Réglages', u: 'Versions' }
const SHORTCUTS = [
  ['Ctrl K', 'Rechercher partout'], ['?', 'Afficher cette aide'], ['Échap', 'Fermer une fenêtre'],
  ...Object.entries(GO).map(([k, v]) => [`g puis ${k}`, `Aller à : ${LABEL[k]}`]),
  ['n puis a', 'Nouvel article'], ['n puis p', 'Nouveau projet'],
]
function openHelp() { help.value?.showModal() }
let chord = '', timer = 0
const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
function onGlobal(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.value?.open ? hide() : show(); return }
  if (typing(e) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return
  if (e.key === '?') { e.preventDefault(); openHelp(); return }
  if (chord) {
    const to = (chord === 'g' ? GO : NEW)[e.key.toLowerCase()]
    chord = ''; clearTimeout(timer)
    if (to) { e.preventDefault(); router.push(to) }
    return
  }
  if (e.key === 'g' || e.key === 'n') { chord = e.key; clearTimeout(timer); timer = setTimeout(() => { chord = '' }, 1200) }
}
window.addEventListener('keydown', onGlobal)
onBeforeUnmount(() => { window.removeEventListener('keydown', onGlobal); clearTimeout(timer) })
</script>

<template>
  <dialog ref="dlg" class="apal" aria-label="Recherche dans l'administration" @click="(e) => e.target === dlg && hide()">
    <input ref="input" v-model="q" type="text" role="combobox" aria-expanded="true" aria-controls="apal-list" aria-autocomplete="list" :aria-activedescendant="results.length ? `apal-${idx}` : undefined" placeholder="Rechercher une page, un projet, un article, un message…" autocomplete="off" spellcheck="false" @keydown="onKey" @input="idx = 0" />
    <ul id="apal-list" role="listbox" aria-label="Résultats">
      <template v-for="(r, i) in results" :key="r.group + r.label + i">
        <li v-if="i === 0 || results[i - 1].group !== r.group" class="grp" role="presentation">{{ r.group }}</li>
        <li :id="`apal-${i}`" role="option" :aria-selected="i === idx" :class="{ on: i === idx }" @mousemove="idx = i" @click="pick(i)"><span>{{ r.label }}</span><small v-if="r.hint">{{ r.hint }}</small></li>
      </template>
      <li v-if="!results.length" class="none" role="presentation">Aucun résultat</li>
    </ul>
    <p class="foot" aria-hidden="true">↑ ↓ naviguer · Entrée ouvrir · Échap fermer · <kbd>?</kbd> raccourcis</p>
  </dialog>

  <dialog ref="help" class="apal help" aria-labelledby="sc-t" @click="(e) => e.target === help && help.close()">
    <h2 id="sc-t">Raccourcis clavier</h2>
    <dl>
      <template v-for="[k, d] in SHORTCUTS" :key="k"><dt><kbd>{{ k }}</kbd></dt><dd>{{ d }}</dd></template>
    </dl>
    <button type="button" class="btn btn-primary" @click="help.close()">Fermer</button>
  </dialog>
</template>

<style scoped>
.apal{width:min(620px,calc(100vw - 24px));margin:12vh auto auto;padding:0;border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--fg);box-shadow:0 24px 70px rgba(0,0,0,.35)}
.apal::backdrop{background:rgba(0,0,0,.45)}
input{display:block;width:100%;box-sizing:border-box;min-height:56px;padding:0 20px;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;color:var(--fg);font:500 17px var(--font);outline:none}
input:focus-visible{box-shadow:inset 0 -3px 0 var(--green)}
ul{max-height:min(52vh,420px);margin:0;padding:6px;overflow:auto;list-style:none}
li{display:flex;justify-content:space-between;gap:12px;align-items:baseline;padding:10px 14px;border-radius:10px;cursor:pointer;font-size:15px}
li.grp{padding:10px 14px 4px;color:var(--muted);font:700 12px var(--font);letter-spacing:.08em;text-transform:uppercase;cursor:default}
li.on{background:var(--green);color:var(--on-green)}
li.none{color:var(--muted);cursor:default}
small{opacity:.7;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
.foot{margin:0;padding:10px 16px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
kbd{padding:1px 7px;border:1px solid var(--line);border-radius:6px;font:600 13px var(--font);background:var(--bg)}
.help{padding:22px;margin-top:10vh}
.help h2{margin:0 0 12px;font:600 22px var(--serif)}
dl{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:0 0 16px;max-height:55vh;overflow:auto}
dt{margin:0} dd{margin:0;align-self:center}
</style>
