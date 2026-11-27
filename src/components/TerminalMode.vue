<script setup>
// Mode terminal : navigue sur le site avec des commandes (help, ls, open, projets, veille, theme, lang, cv, succes…).
// Ouvert par la touche « ` », par Ctrl + ` ou depuis la palette.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { lang } from '../i18n/index.js'
import { projects, loadProjects, projectLink } from '../content/projects.js'
import { fetchList } from '../content/veille.js'
import { links, settings } from '../content/settings.js'
import { openCv } from '../content/cvGate.js'
import { unlock } from '../lib/achievements.js'

const router = useRouter()
const { theme, toggle } = useTheme()
const dlg = ref(null)
const inp = ref(null)
const scroller = ref(null)
const out = ref([])
const line = ref('')
const hist = []
let hi = 0
let articles = null

const PAGES = { accueil: '/', projets: '/projets', veille: '/veille', 'a-propos': '/a-propos', contact: '/contact', maintenant: '/maintenant', outils: '/outils', changelog: '/changelog', mentions: '/mentions-legales', confidentialite: '/confidentialite' }
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const print = (...l) => { out.value.push(...l.map((t) => ({ t, k: 'o' }))); nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight }) }

async function loadArticles() {
  if (articles) return articles
  try { articles = (await fetchList())?.articles ?? [] } catch { articles = [] }
  return articles
}
function go(to, label) { print(`→ ${label}`); dlg.value.close(); router.push(to) }

const CMDS = {
  help: () => print('Commandes :', '  ls                 pages du site', '  open <nom>         ouvrir une page, un projet ou un article', '  projets            liste des projets', '  veille             derniers articles', '  whoami             qui suis-je', '  theme [dark|light] changer de thème', '  lang               changer de langue', '  cv                 télécharger le CV', '  contact            écrire un message', '  succes             voir les succès', '  clear              effacer l\'écran', '  exit               fermer (ou Échap)'),
  ls: () => print(Object.keys(PAGES).map((p) => p + '/').join('  ')),
  whoami: () => print('Guillaume Rouyer', 'Développeur full stack & cybersécurité · Brive-la-Gaillarde'),
  projets: () => { loadProjects(); print(...(projects.value.length ? projects.value.map((p) => `  ${p.slug.padEnd(22)} ${p.name}`) : ['Aucun projet pour l\'instant.'])) },
  veille: async () => { const a = await loadArticles(); print(...(a.length ? a.slice(0, 10).map((x) => `  ${x.slug.padEnd(28)} ${x.title}`) : ['Aucun article.'])) },
  theme: (a) => { const want = a === 'dark' || a === 'light' ? a : theme.value === 'dark' ? 'light' : 'dark'; if (want !== theme.value) toggle(); print(`Thème : ${want === 'dark' ? 'sombre' : 'clair'}`); if (want === 'dark') unlock('nocturne') },
  lang: () => { lang.value = lang.value === 'fr' ? 'en' : 'fr'; print(`Langue : ${lang.value}`) },
  cv: () => { if (settings.value.hasCv !== true) return print('Aucun CV disponible pour l\'instant.'); print('Ouverture du téléchargement…'); dlg.value.close(); openCv() },
  contact: () => go('/contact', 'contact'),
  succes: () => { dlg.value.close(); window.dispatchEvent(new CustomEvent('open-succes')) },
  clear: () => { out.value = [] },
  exit: () => dlg.value.close(),
  echo: (a, raw) => print(raw),
  date: () => print(new Date().toLocaleString('fr-FR')),
  sudo: () => { print('Nice try. Cet incident sera... ignoré.'); unlock('sudo') },
  github: () => { const l = links.value.find((x) => /github/i.test(x.label)); l ? window.open(l.href, '_blank', 'noopener,noreferrer') : print('Lien indisponible.') },
}
CMDS.cd = (a) => CMDS.open(a)
CMDS.projects = CMDS.projets

async function open(arg) {
  const n = norm(arg).replace(/\/$/, '')
  if (!n) return print('Usage : open <nom>   (essaie « ls » ou « projets »)')
  if (PAGES[n]) return go(PAGES[n], n)
  loadProjects()
  const p = projects.value.find((x) => norm(x.slug) === n || norm(x.name).includes(n))
  if (p) return go(projectLink(p), p.name)
  const a = (await loadArticles()).find((x) => x.slug === n || norm(x.title).includes(n))
  if (a) return go(`/veille/${a.slug}`, a.title)
  print(`open: « ${arg} » introuvable`)
}
CMDS.open = (a) => open(a)

async function run() {
  const raw = line.value.trim()
  line.value = ''
  out.value.push({ t: `$ ${raw}`, k: 'c' })
  if (!raw) return
  hist.push(raw); hi = hist.length
  const [cmd, ...rest] = raw.split(/\s+/)
  const f = CMDS[cmd.toLowerCase()]
  if (!f) return print(`${cmd}: commande inconnue. Tape « help ».`)
  try { await f(rest.join(' ').toLowerCase() === rest.join(' ') ? rest.join(' ') : rest.join(' '), rest.join(' ')) } catch { print('Erreur.') }
}
function onKey(e) {
  if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); line.value = hist[hi] }
  else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); line.value = hist[hi] ?? '' }
  else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.value = [] }
}
function show() {
  if (dlg.value?.open) return
  if (!out.value.length) print('Terminal Guillaume Rouyer — tape « help » pour la liste des commandes.')
  dlg.value.showModal()
  nextTick(() => inp.value?.focus())
  unlock('hacker')
}
const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable
function onGlobal(e) {
  if (location.pathname.startsWith('/admin')) return
  if (e.key === '`' && !e.altKey && !e.metaKey && (!typing(e) || e.ctrlKey) && !document.querySelector('dialog[open]')) { e.preventDefault(); show() }
}
onMounted(() => { window.addEventListener('keydown', onGlobal); window.addEventListener('open-terminal', show) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onGlobal); window.removeEventListener('open-terminal', show) })
</script>

<template>
  <dialog ref="dlg" class="term" aria-label="Terminal" @click="inp?.focus()">
    <div ref="scroller" class="scr" role="log" aria-live="polite">
      <p v-for="(o, i) in out" :key="i" :class="o.k">{{ o.t }}</p>
    </div>
    <form class="prompt" @submit.prevent="run">
      <label for="term-in">$</label>
      <input id="term-in" ref="inp" v-model="line" autocomplete="off" autocapitalize="off" spellcheck="false" @keydown="onKey" />
    </form>
  </dialog>
</template>

<style scoped>
.term{width:min(760px,calc(100vw - 20px));height:min(460px,80vh);margin:8vh auto auto;padding:0;border:1px solid #2f7d4f;border-radius:12px;background:#0b130d;color:#c9f5d6;font:15px/1.5 ui-monospace,Menlo,Consolas,monospace;box-shadow:0 24px 70px rgba(0,0,0,.5)}
.term[open]{display:flex;flex-direction:column}
.term::backdrop{background:rgba(0,0,0,.55)}
.scr{flex:1;overflow:auto;padding:14px 16px}
p{margin:0;white-space:pre-wrap;word-break:break-word}
.c{color:#7dffa0}
.prompt{display:flex;gap:8px;padding:10px 16px;border-top:1px solid #1d3a27}
label{color:#7dffa0}
input{flex:1;min-width:0;border:0;outline:0;background:none;color:inherit;font:inherit}
.prompt:focus-within{box-shadow:inset 0 -2px 0 #7dffa0}
</style>
