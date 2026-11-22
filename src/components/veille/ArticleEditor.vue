<script setup>
// Éditeur d'article : barre d'outils qui écrit le Markdown, aperçu en direct, boîtes de dialogue pour les liens, images, code et blocs.
import { nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import ArticleBody from './ArticleBody.vue'
import { CALLOUTS, CODE_LANGUAGES, IMAGE_WIDTHS, renderMarkdown } from '../../lib/markdown.js'
import * as E from '../../lib/mdEdit.js'

const props = defineProps({ modelValue: { type: String, default: '' }, maxlength: { type: Number, default: 60000 } })
const emit = defineEmits(['update:modelValue'])

const ta = ref(null)
const dialogEl = ref(null)
const mode = ref(window.matchMedia?.('(min-width: 1100px)').matches ? 'split' : 'write')
const rendered = ref({ html: '', toc: [] })

// ---------- Aperçu (léger retard pour ne pas recalculer à chaque touche) ----------
let timer
function refresh() { rendered.value = renderMarkdown(props.modelValue) }
watch(() => props.modelValue, () => { if (mode.value === 'write') return; clearTimeout(timer); timer = setTimeout(refresh, 250) })
watch(mode, (m) => { if (m !== 'write') refresh() }, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))

// ---------- Application d'une modification dans le texte (garde l'historique annuler/rétablir quand le navigateur le permet) ----------
function apply(ed) {
  const el = ta.value
  if (!el) return
  el.focus()
  el.setSelectionRange(ed.from, ed.to)
  let done = false
  try { done = !!document.execCommand?.('insertText', false, ed.text) } catch { done = false }
  if (!done) { el.setRangeText(ed.text, ed.from, ed.to, 'end'); emit('update:modelValue', el.value) }
  el.setSelectionRange(ed.selStart, ed.selEnd)
}
function act(fn) {
  const el = ta.value
  if (!el) return
  apply(fn(el.value, el.selectionStart, el.selectionEnd))
}

// ---------- Barre d'outils ----------
const ICON = {
  left: 'M3 6h18M3 10h12M3 14h18M3 18h12', center: 'M3 6h18M6 10h12M3 14h18M6 18h12', right: 'M3 6h18M9 10h12M3 14h18M9 18h12', justify: 'M3 6h18M3 10h18M3 14h18M3 18h18',
}
const GROUPS = [
  { label: 'Titres', items: [
    { id: 'h2', text: 'H2', title: 'Titre de section (H2)', run: () => act((v, s, e) => E.heading(v, s, e, 2)) },
    { id: 'h3', text: 'H3', title: 'Sous-titre (H3)', run: () => act((v, s, e) => E.heading(v, s, e, 3)) },
    { id: 'h4', text: 'H4', title: 'Intertitre (H4)', run: () => act((v, s, e) => E.heading(v, s, e, 4)) },
  ] },
  { label: 'Style du texte', items: [
    { id: 'bold', text: 'G', cls: 'b', title: 'Gras (Ctrl+B)', run: () => act((v, s, e) => E.wrapInline(v, s, e, '**')) },
    { id: 'italic', text: 'I', cls: 'i', title: 'Italique (Ctrl+I)', run: () => act((v, s, e) => E.wrapInline(v, s, e, '_')) },
    { id: 'strike', text: 'S', cls: 's', title: 'Barré', run: () => act((v, s, e) => E.wrapInline(v, s, e, '~~')) },
    { id: 'underline', text: 'U', cls: 'u', title: 'Souligné', run: () => act((v, s, e) => E.wrapInline(v, s, e, '++')) },
    { id: 'mark', text: 'Ab', cls: 'm', title: 'Surligné', run: () => act((v, s, e) => E.wrapInline(v, s, e, '==')) },
    { id: 'code', text: '</>', title: 'Code dans le texte', run: () => act((v, s, e) => E.wrapInline(v, s, e, '`', '`', 'code')) },
  ] },
  { label: 'Alignement', items: ['left', 'center', 'right', 'justify'].map((k) => ({
    id: `align-${k}`, icon: ICON[k], title: { left: 'Aligner à gauche', center: 'Centrer', right: 'Aligner à droite', justify: 'Justifier' }[k],
    run: () => act((v, s, e) => E.align(v, s, e, k)),
  })) },
  { label: 'Structure', items: [
    { id: 'ul', text: '•', title: 'Liste à puces', run: () => act((v, s, e) => E.prefixLines(v, s, e, 'ul')) },
    { id: 'ol', text: '1.', title: 'Liste numérotée', run: () => act((v, s, e) => E.prefixLines(v, s, e, 'ol')) },
    { id: 'quote', text: '❝', title: 'Citation simple', run: () => act((v, s, e) => E.prefixLines(v, s, e, 'quote')) },
    { id: 'hr', text: '—', title: 'Séparateur', run: () => act((v, s, e) => E.insertBlock(v, s, e, '---')) },
    { id: 'table', text: '▦', title: 'Tableau', run: () => act((v, s, e) => E.insertBlock(v, s, e, E.TABLE_TEMPLATE)) },
  ] },
  { label: 'Insertions', items: [
    { id: 'link', text: 'Lien', title: 'Insérer un lien (Ctrl+K)', run: () => openDialog('link') },
    { id: 'image', text: 'Image', title: 'Insérer une image externe', run: () => openDialog('image') },
    { id: 'codeblock', text: 'Code', title: 'Bloc de code coloré', run: () => openDialog('code') },
    { id: 'callout', text: 'Encadré', title: 'Encadré (info, astuce, attention, à retenir)', run: () => openDialog('callout') },
    { id: 'details', text: 'Dépliable', title: 'Section dépliable', run: () => openDialog('details') },
    { id: 'pullquote', text: 'Citation+', title: 'Citation mise en valeur', run: () => openDialog('quote') },
    { id: 'card', text: 'Carte lien', title: 'Carte de lien avec description', run: () => openDialog('card') },
  ] },
]

function onKeydown(ev) {
  if (!(ev.ctrlKey || ev.metaKey) || ev.altKey) return
  const k = ev.key.toLowerCase()
  if (k === 'b') { ev.preventDefault(); act((v, s, e) => E.wrapInline(v, s, e, '**')) }
  else if (k === 'i') { ev.preventDefault(); act((v, s, e) => E.wrapInline(v, s, e, '_')) }
  else if (k === 'k') { ev.preventDefault(); openDialog('link') }
}

// ---------- Boîtes de dialogue ----------
const opt = (value, label) => ({ value, label })
const DIALOGS = {
  link: { title: 'Insérer un lien', ok: 'Insérer', fields: [
    { key: 'url', label: 'Adresse du lien', type: 'url', required: true, placeholder: 'https://…', hint: 'https, mailto:, #ancre ou /page-du-site' },
  ] },
  image: { title: 'Insérer une image', ok: 'Insérer', fields: [
    { key: 'url', label: 'Lien de l\'image', type: 'url', required: true, placeholder: 'https://…', hint: 'Lien externe en https (l\'image n\'est pas hébergée sur le site)' },
    { key: 'alt', label: 'Texte alternatif', type: 'text', required: true, placeholder: 'Décris ce que montre l\'image', hint: 'Obligatoire : lecteurs d\'écran et référencement' },
    { key: 'caption', label: 'Légende', type: 'text', placeholder: 'Facultative, affichée sous l\'image' },
    { key: 'width', label: 'Largeur', type: 'select', options: IMAGE_WIDTHS.map((w) => opt(w, `${w} % de la colonne`)) },
    { key: 'align', label: 'Alignement', type: 'select', options: [opt('left', 'À gauche'), opt('center', 'Centrée'), opt('right', 'À droite')] },
    { key: 'zoom', label: 'Zoom au clic sur l\'image', type: 'checkbox' },
  ] },
  code: { title: 'Insérer un bloc de code', ok: 'Insérer', fields: [
    { key: 'lang', label: 'Langage', type: 'select', options: [opt('', 'Sans coloration'), ...CODE_LANGUAGES.map((l) => opt(l, l))] },
    { key: 'file', label: 'Nom du fichier', type: 'text', placeholder: 'Facultatif, ex. : src/main.js' },
  ] },
  callout: { title: 'Insérer un encadré', ok: 'Insérer', fields: [
    { key: 'kind', label: 'Type', type: 'select', options: Object.entries(CALLOUTS).map(([k, l]) => opt(k, l)) },
    { key: 'title', label: 'Titre', type: 'text', placeholder: 'Facultatif (sinon le nom du type)' },
  ] },
  details: { title: 'Insérer une section dépliable', ok: 'Insérer', fields: [
    { key: 'title', label: 'Titre visible', type: 'text', placeholder: 'Ex. : Voir la configuration complète' },
  ] },
  quote: { title: 'Insérer une citation mise en valeur', ok: 'Insérer', fields: [
    { key: 'author', label: 'Auteur', type: 'text', placeholder: 'Facultatif' },
    { key: 'source', label: 'Source', type: 'text', placeholder: 'Facultative (livre, site…)' },
  ] },
  card: { title: 'Insérer une carte de lien', ok: 'Insérer', fields: [
    { key: 'url', label: 'Adresse du lien', type: 'url', required: true, placeholder: 'https://…', hint: 'Lien externe en https' },
    { key: 'title', label: 'Titre de la carte', type: 'text', required: true },
  ] },
}
const DEFAULTS = { image: { width: 100, align: 'center', zoom: false }, code: { lang: '' }, callout: { kind: 'info' } }
const dlg = reactive({ kind: '', values: {}, error: '' })
let saved = { s: 0, e: 0 }
const cfg = () => DIALOGS[dlg.kind]
const isHttps = (u) => /^https:\/\//i.test((u ?? '').trim())
const isLink = (u) => /^(https?:\/\/|mailto:|#|\/(?!\/))/i.test((u ?? '').trim())
const oneLine = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()

async function openDialog(kind) {
  const el = ta.value
  saved = { s: el.selectionStart, e: el.selectionEnd }
  Object.assign(dlg, { kind, values: { ...(DEFAULTS[kind] ?? {}) }, error: '' })
  await nextTick()
  const d = dialogEl.value
  d.showModal ? d.showModal() : d.setAttribute('open', '')
  d.querySelector('input,select')?.focus()
}
function closeDialog() {
  const d = dialogEl.value
  d.close ? d.close() : d.removeAttribute('open')
  dlg.kind = ''
  ta.value?.focus()
}
function submitDialog() {
  const v = dlg.values
  const kind = dlg.kind
  if (kind === 'link' && !isLink(v.url)) return void (dlg.error = 'Adresse invalide : https, mailto:, #ancre ou /page-du-site.')
  if ((kind === 'image' || kind === 'card') && !isHttps(v.url)) return void (dlg.error = 'Le lien doit commencer par https://')
  if (kind === 'image' && !oneLine(v.alt)) return void (dlg.error = 'Le texte alternatif est obligatoire.')
  if (kind === 'card' && !oneLine(v.title)) return void (dlg.error = 'Le titre de la carte est obligatoire.')
  const { s, e } = saved
  const text = ta.value.value
  let ed
  if (kind === 'link') ed = E.link(text, s, e, v.url.trim().replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29'))
  else if (kind === 'image') ed = E.insertBlock(text, s, e, E.imageMd({ url: v.url, alt: v.alt, caption: v.caption, width: Number(v.width), align: v.align, zoom: !!v.zoom }))
  else if (kind === 'code') ed = E.codeBlock(text, s, e, v.lang, v.file)
  else if (kind === 'callout') ed = E.wrapBlock(text, s, e, `${v.kind}${oneLine(v.title) ? ` ${oneLine(v.title)}` : ''}`, 'Texte de l\'encadré')
  else if (kind === 'details') ed = E.wrapBlock(text, s, e, `details${oneLine(v.title) ? ` ${oneLine(v.title)}` : ''}`, 'Contenu masqué')
  else if (kind === 'quote') ed = E.wrapBlock(text, s, e, `quote${oneLine(v.author) || oneLine(v.source) ? ` ${oneLine(v.author)}${oneLine(v.source) ? ` | ${oneLine(v.source)}` : ''}` : ''}`, 'Texte de la citation')
  else if (kind === 'card') ed = E.wrapBlock(text, s, e, `link ${v.url.trim().replace(/\s/g, '%20')} ${oneLine(v.title)}`, 'Courte description du lien')
  closeDialog()
  apply(ed)
}
</script>

<template>
  <div class="ed">
    <div class="tb" role="toolbar" aria-label="Mise en forme de l'article">
      <div v-for="g in GROUPS" :key="g.label" class="grp" role="group" :aria-label="g.label">
        <button v-for="it in g.items" :key="it.id" type="button" class="tbtn" :data-id="it.id" :title="it.title" :aria-label="it.title" @mousedown.prevent @click="it.run()">
          <svg v-if="it.icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path :d="it.icon" /></svg>
          <span v-else :class="it.cls">{{ it.text }}</span>
        </button>
      </div>
      <div class="grp modes" role="group" aria-label="Affichage">
        <button v-for="[m, l] in [['write', 'Écrire'], ['split', 'Côte à côte'], ['preview', 'Aperçu']]" :key="m" type="button" class="tbtn txt" :class="{ on: mode === m }" :aria-pressed="mode === m" @click="mode = m">{{ l }}</button>
      </div>
    </div>

    <div class="panes" :class="mode">
      <textarea
        v-show="mode !== 'preview'" ref="ta" class="src" :value="modelValue" :maxlength="maxlength" spellcheck="true" aria-label="Contenu de l'article (Markdown)"
        placeholder="Écris ton article ici. Utilise la barre d'outils ou le Markdown." @input="emit('update:modelValue', $event.target.value)" @keydown="onKeydown"
      />
      <div v-show="mode !== 'write'" class="pv" aria-label="Aperçu de l'article">
        <p v-if="!modelValue.trim()" class="hint">L'aperçu apparaît ici dès que tu écris.</p>
        <ArticleBody :html="rendered.html" />
      </div>
    </div>

    <details class="help">
      <summary>Aide-mémoire de la mise en forme</summary>
      <div class="helpgrid">
        <div>
          <p><strong>Texte</strong></p>
          <p><code>**gras**</code> · <code>_italique_</code> · <code>~~barré~~</code> · <code>==surligné==</code> · <code>++souligné++</code></p>
          <p><code>## Titre</code> · <code>### Sous-titre</code> (le titre de l'article est déjà le titre principal)</p>
          <p><code>[texte](https://…)</code> · <code>- puce</code> · <code>1. numéro</code> · <code>&gt; citation</code> · <code>---</code></p>
        </div>
        <div>
          <p><strong>Alignement et blocs</strong> (ferme avec <code>:::</code>)</p>
          <p><code>::: center</code> · <code>left</code> · <code>right</code> · <code>justify</code></p>
          <p><code>::: info</code> · <code>tip</code> · <code>warning</code> · <code>important</code> + titre facultatif</p>
          <p><code>::: details Titre</code> · <code>::: quote Auteur | Source</code> · <code>::: link https://… Titre</code></p>
          <p>Pour mettre un bloc dans un autre, utilise plus de deux-points au bloc extérieur (<code>::::</code>).</p>
        </div>
        <div>
          <p><strong>Images et code</strong></p>
          <p><code>![alt](https://… "Légende"){width=50 align=right zoom}</code></p>
          <p>Largeurs : 25, 33, 50, 66, 75, 100 · alignements : left, center, right</p>
          <p><code>```js src/main.js</code> … <code>```</code> : langage puis nom du fichier</p>
        </div>
      </div>
    </details>

    <dialog ref="dialogEl" class="dlg" aria-labelledby="ed-dlg-title" @cancel.prevent="closeDialog">
      <form v-if="dlg.kind" novalidate @submit.prevent="submitDialog">
        <h3 id="ed-dlg-title">{{ cfg().title }}</h3>
        <label v-for="f in cfg().fields" :key="f.key" :class="{ check: f.type === 'checkbox' }">
          <template v-if="f.type === 'checkbox'"><input v-model="dlg.values[f.key]" type="checkbox" />{{ f.label }}</template>
          <template v-else-if="f.type === 'select'">{{ f.label }}
            <select v-model="dlg.values[f.key]"><option v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</option></select>
          </template>
          <template v-else>{{ f.label }}<input v-model="dlg.values[f.key]" :type="f.type" :required="f.required" :placeholder="f.placeholder" maxlength="300" /></template>
          <span v-if="f.hint" class="hint">{{ f.hint }}</span>
        </label>
        <img v-if="dlg.kind === 'image' && isHttps(dlg.values.url)" class="thumb" :src="dlg.values.url.trim()" alt="" referrerpolicy="no-referrer" />
        <p v-if="dlg.error" class="err" role="alert">{{ dlg.error }}</p>
        <div class="bar">
          <button class="btn btn-primary" type="submit">{{ cfg().ok }}</button>
          <button class="btn btn-ghost" type="button" @click="closeDialog">Annuler</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.ed{display:grid;gap:12px}
.tb{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:6px 14px;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.grp{display:flex;gap:4px;align-items:center}
.grp+.grp{padding-left:14px;border-left:1px solid var(--line)}
.modes{margin-left:auto}
.tbtn{display:inline-flex;align-items:center;justify-content:center;min-width:36px;min-height:36px;padding:0 8px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--fg);font:600 14px var(--font);cursor:pointer}
.tbtn:hover{border-color:var(--line);background:var(--bg)}
.tbtn:focus-visible{outline:3px solid var(--green);outline-offset:1px}
.tbtn.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.tbtn .b{font-weight:800}.tbtn .i{font-style:italic;font-family:var(--serif)}.tbtn .s{text-decoration:line-through}.tbtn .u{text-decoration:underline}
.tbtn .m{background:color-mix(in srgb,var(--neon) 45%,transparent);border-radius:4px;padding:0 3px}
.panes{display:grid;gap:16px;align-items:start}
.panes.split{grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr))}
.src{width:100%;min-height:62vh;padding:16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--fg);font:15px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;tab-size:2;resize:vertical;box-sizing:border-box}
.src:focus-visible{outline:3px solid var(--green);outline-offset:1px}
.pv{min-height:62vh;max-height:80vh;padding:20px 24px;overflow:auto;border:1px solid var(--line);border-radius:12px;background:var(--bg)}
.pv :deep(.art){font-size:17px}
.help{border:1px solid var(--line);border-radius:12px;background:var(--card)}
.help summary{padding:12px 16px;font-weight:700;cursor:pointer}
.helpgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:4px 24px;padding:0 16px 8px;font-size:14px}
.helpgrid p{margin:.35em 0}
.helpgrid code{padding:1px 5px;border:1px solid var(--line);border-radius:5px;background:var(--bg);font-size:12.5px}
.dlg{width:min(520px,94vw);padding:0;border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--fg)}
.dlg::backdrop{background:rgba(0,0,0,.55)}
.dlg form{display:grid;gap:14px;margin:0;padding:22px;border:0;background:none}
.dlg h3{margin:0;font-size:20px}
.dlg label{display:grid;gap:6px;font-weight:600}
.dlg label.check{display:flex;align-items:center;gap:10px}
.dlg .thumb{max-width:100%;max-height:160px;object-fit:contain;border-radius:8px;justify-self:start}
</style>
