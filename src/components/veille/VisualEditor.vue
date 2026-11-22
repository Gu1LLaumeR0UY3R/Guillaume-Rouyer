<script setup>
// Éditeur visuel (type Word/Notion) : on écrit et met en forme directement, le Markdown est généré en coulisse.
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch, nextTick } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { extensions } from '../../lib/veilleEditor.js'
import { markdownToEditorHtml, CALLOUTS, CODE_LANGUAGES, IMAGE_WIDTHS, ALIGN_BLOCKS } from '../../lib/markdown.js'
import { editorToMarkdown } from '../../lib/mdSerialize.js'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const tick = ref(0)
const ed = shallowRef(null)
let last = props.modelValue

ed.value = new Editor({
  extensions: extensions(),
  content: markdownToEditorHtml(props.modelValue),
  editorProps: { attributes: { class: 'pm', 'aria-label': 'Contenu de l\'article', role: 'textbox', 'aria-multiline': 'true' } },
  onUpdate({ editor }) {
    last = editorToMarkdown(editor.getJSON())
    emit('update:modelValue', last)
  },
  onTransaction() { tick.value++ },
})
watch(() => props.modelValue, (v) => {
  if (v === last) return
  last = v
  ed.value.commands.setContent(markdownToEditorHtml(v), { emitUpdate: false })
})
onBeforeUnmount(() => ed.value?.destroy())

const e = () => ed.value
const is = (name, attrs) => { tick.value; return e().isActive(name, attrs) }
const run = (fn) => fn(e().chain().focus()).run()

// ---------- Contexte : propriétés du bloc où se trouve le curseur ----------
const LABELS = { callout: 'Encadré', details: 'Section dépliable', pullquote: 'Citation', linkcard: 'Carte de lien', alignBlock: 'Alignement', image: 'Image', codeBlock: 'Bloc de code' }
const ctx = computed(() => {
  tick.value
  const sel = e().state.selection
  const out = []
  if (sel.node && sel.node.type.name === 'image') out.push({ type: 'image', pos: sel.from, attrs: sel.node.attrs })
  const $f = sel.$from
  for (let d = $f.depth; d > 0; d--) {
    const n = $f.node(d)
    if (LABELS[n.type.name]) out.push({ type: n.type.name, pos: $f.before(d), attrs: n.attrs })
  }
  return out
})
function setAttr(c, key, value) {
  e().chain().command(({ tr }) => { tr.setNodeMarkup(c.pos, undefined, { ...c.attrs, [key]: value }); return true }).run()
}
const inTable = computed(() => is('table'))

// ---------- Boîte de dialogue (lien, image) ----------
const dlgEl = ref(null)
const dlg = reactive({ kind: '', url: '', alt: '', error: '' })
const isHttps = (u) => /^https:\/\//i.test((u ?? '').trim())
const isLink = (u) => /^(https?:\/\/|mailto:|#|\/(?!\/))/i.test((u ?? '').trim())
async function openDialog(kind) {
  Object.assign(dlg, { kind, error: '', alt: '', url: kind === 'link' ? (e().getAttributes('link').href ?? '') : '' })
  await nextTick()
  dlgEl.value.showModal ? dlgEl.value.showModal() : dlgEl.value.setAttribute('open', '')
  dlgEl.value.querySelector('input')?.focus()
}
function closeDialog() { dlgEl.value.close ? dlgEl.value.close() : dlgEl.value.removeAttribute('open'); dlg.kind = '' }
function submitDialog() {
  const url = dlg.url.trim()
  if (dlg.kind === 'link') {
    if (!url) { run((c) => c.unsetLink()); return closeDialog() }
    if (!isLink(url)) { dlg.error = 'Lien non valide : https, mailto:, #ancre ou /page-du-site.'; return }
    run((c) => c.extendMarkRange('link').setLink({ href: url }))
  } else {
    if (!isHttps(url)) { dlg.error = 'Un lien https est obligatoire pour une image.'; return }
    if (!dlg.alt.trim()) { dlg.error = 'Décris l\'image (texte alternatif obligatoire).'; return }
    run((c) => c.insertContent({ type: 'image', attrs: { src: url, alt: dlg.alt.trim() } }))
  }
  closeDialog()
}

// ---------- Insertions ----------
const DEMO = '<button id="b">Cliquer</button> <span id="n">0</span>\n<script>\n  let n = 0\n  b.onclick = () => { n++; document.getElementById("n").textContent = n }\n<\/script>'
const wrap = (type, attrs) => run((c) => c.wrapIn(type, attrs))
const insertTable = () => run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))
const insertDemo = () => run((c) => c.insertContent({ type: 'codeBlock', attrs: { language: 'demo', file: 'Ma démo' }, content: [{ type: 'text', text: DEMO }] }))
const insertCard = () => run((c) => c.insertContent({ type: 'linkcard', attrs: { url: 'https://', title: 'Titre de la carte' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Description courte.' }] }] }))
const headingValue = computed(() => { tick.value; for (const l of [2, 3, 4]) if (e().isActive('heading', { level: l })) return String(l); return '0' })
function setHeading(v) { run((c) => (v === '0' ? c.setParagraph() : c.setHeading({ level: Number(v) }))) }
const canUndo = computed(() => { tick.value; return e().can().undo() })
const canRedo = computed(() => { tick.value; return e().can().redo() })

const GROUPS = [
  { label: 'Texte', items: [
    { id: 'bold', t: 'G', cls: 'b', title: 'Gras (Ctrl+B)', on: () => is('bold'), do: (c) => c.toggleBold() },
    { id: 'italic', t: 'I', cls: 'i', title: 'Italique (Ctrl+I)', on: () => is('italic'), do: (c) => c.toggleItalic() },
    { id: 'underline', t: 'S', cls: 'u', title: 'Souligné (Ctrl+U)', on: () => is('underline'), do: (c) => c.toggleMark('underline') },
    { id: 'strike', t: 'B', cls: 's', title: 'Barré', on: () => is('strike'), do: (c) => c.toggleStrike() },
    { id: 'highlight', t: 'Aa', cls: 'm', title: 'Surligné', on: () => is('highlight'), do: (c) => c.toggleHighlight() },
    { id: 'code', t: '</>', cls: 'c', title: 'Code dans le texte', on: () => is('code'), do: (c) => c.toggleCode() },
  ] },
  { label: 'Structure', items: [
    { id: 'ul', t: '•', title: 'Liste à puces', on: () => is('bulletList'), do: (c) => c.toggleBulletList() },
    { id: 'ol', t: '1.', title: 'Liste numérotée', on: () => is('orderedList'), do: (c) => c.toggleOrderedList() },
    { id: 'quote', t: '❝', title: 'Citation simple', on: () => is('blockquote'), do: (c) => c.toggleBlockquote() },
    { id: 'hr', t: '—', title: 'Séparateur', do: (c) => c.setHorizontalRule() },
  ] },
]
const BLOCKS = [
  { id: 'callout', t: 'Encadré', title: 'Encadré (info, astuce, attention, à retenir)', do: () => wrap('callout', { kind: 'info' }) },
  { id: 'details', t: 'Dépliable', title: 'Section dépliable', do: () => wrap('details', { title: 'Titre visible' }) },
  { id: 'pullquote', t: 'Citation+', title: 'Citation mise en valeur', do: () => wrap('pullquote', {}) },
  { id: 'card', t: 'Carte lien', title: 'Carte de lien', do: insertCard },
  { id: 'align', t: 'Aligner', title: 'Aligner un bloc (centré, droite, justifié)', do: () => wrap('alignBlock', { align: 'center' }) },
  { id: 'table', t: 'Tableau', title: 'Tableau', do: insertTable },
  { id: 'image', t: 'Image', title: 'Image externe en https', do: () => openDialog('image') },
  { id: 'code', t: 'Code', title: 'Bloc de code coloré', do: () => run((c) => c.setCodeBlock({ language: 'javascript' })) },
  { id: 'demo', t: 'Démo', title: 'Démo exécutée dans l\'article (HTML, CSS, JS)', do: insertDemo },
]
</script>

<template>
  <div class="ve">
    <div class="tb" role="toolbar" aria-label="Mise en forme">
      <div class="grp">
        <label class="sr" for="ve-head">Style du paragraphe</label>
        <select id="ve-head" class="sel" :value="headingValue" @change="setHeading($event.target.value)">
          <option value="0">Paragraphe</option><option value="2">Titre</option><option value="3">Sous-titre</option><option value="4">Petit titre</option>
        </select>
      </div>
      <div v-for="g in GROUPS" :key="g.label" class="grp" role="group" :aria-label="g.label">
        <button v-for="it in g.items" :key="it.id" type="button" class="tbtn" :class="{ on: it.on?.() }" :title="it.title" :aria-label="it.title" :aria-pressed="it.on ? !!it.on() : undefined" @mousedown.prevent @click="run(it.do)"><span :class="it.cls">{{ it.t }}</span></button>
        <button v-if="g.label === 'Texte'" type="button" class="tbtn" :class="{ on: is('link') }" title="Lien (Ctrl+K)" aria-label="Lien" @mousedown.prevent @click="openDialog('link')">Lien</button>
      </div>
      <div class="grp" role="group" aria-label="Blocs">
        <button v-for="b in BLOCKS" :key="b.id" type="button" class="tbtn" :title="b.title" :aria-label="b.title" @mousedown.prevent @click="b.do()">{{ b.t }}</button>
      </div>
      <div class="grp" role="group" aria-label="Historique">
        <button type="button" class="tbtn" title="Annuler (Ctrl+Z)" aria-label="Annuler" :disabled="!canUndo" @mousedown.prevent @click="run((c) => c.undo())">↶</button>
        <button type="button" class="tbtn" title="Rétablir (Ctrl+Y)" aria-label="Rétablir" :disabled="!canRedo" @mousedown.prevent @click="run((c) => c.redo())">↷</button>
      </div>
    </div>

    <div v-if="inTable" class="ctx" role="group" aria-label="Tableau">
      <strong>Tableau</strong>
      <button type="button" class="mini" @mousedown.prevent @click="run((c) => c.addRowAfter())">+ Ligne</button>
      <button type="button" class="mini" @mousedown.prevent @click="run((c) => c.addColumnAfter())">+ Colonne</button>
      <button type="button" class="mini" @mousedown.prevent @click="run((c) => c.deleteRow())">− Ligne</button>
      <button type="button" class="mini" @mousedown.prevent @click="run((c) => c.deleteColumn())">− Colonne</button>
      <button type="button" class="mini danger" @mousedown.prevent @click="run((c) => c.deleteTable())">Supprimer le tableau</button>
    </div>

    <div v-for="c in ctx" :key="c.type + c.pos" class="ctx" role="group" :aria-label="LABELS[c.type]">
      <strong>{{ LABELS[c.type] }}</strong>
      <template v-if="c.type === 'callout'">
        <label>Type <select :value="c.attrs.kind" @change="setAttr(c, 'kind', $event.target.value)"><option v-for="(l, k) in CALLOUTS" :key="k" :value="k">{{ l }}</option></select></label>
        <label>Titre <input :value="c.attrs.title" maxlength="80" placeholder="Facultatif" @input="setAttr(c, 'title', $event.target.value)" /></label>
      </template>
      <template v-else-if="c.type === 'details'">
        <label>Titre visible <input :value="c.attrs.title" maxlength="80" @input="setAttr(c, 'title', $event.target.value)" /></label>
      </template>
      <template v-else-if="c.type === 'pullquote'">
        <label>Auteur <input :value="c.attrs.author" maxlength="80" @input="setAttr(c, 'author', $event.target.value)" /></label>
        <label>Source <input :value="c.attrs.source" maxlength="80" @input="setAttr(c, 'source', $event.target.value)" /></label>
      </template>
      <template v-else-if="c.type === 'linkcard'">
        <label>Adresse <input type="url" :value="c.attrs.url" placeholder="https://…" @input="setAttr(c, 'url', $event.target.value)" /></label>
        <label>Titre <input :value="c.attrs.title" maxlength="80" @input="setAttr(c, 'title', $event.target.value)" /></label>
      </template>
      <template v-else-if="c.type === 'alignBlock'">
        <label>Alignement <select :value="c.attrs.align" @change="setAttr(c, 'align', $event.target.value)"><option v-for="a in ALIGN_BLOCKS" :key="a" :value="a">{{ { left: 'Gauche', center: 'Centré', right: 'Droite', justify: 'Justifié' }[a] }}</option></select></label>
      </template>
      <template v-else-if="c.type === 'image'">
        <label>Texte alternatif <input :value="c.attrs.alt" maxlength="200" @input="setAttr(c, 'alt', $event.target.value)" /></label>
        <label>Légende <input :value="c.attrs.title" maxlength="200" @input="setAttr(c, 'title', $event.target.value)" /></label>
        <label>Largeur <select :value="c.attrs.width" @change="setAttr(c, 'width', Number($event.target.value))"><option v-for="w in IMAGE_WIDTHS" :key="w" :value="w">{{ w }} %</option></select></label>
        <label>Position <select :value="c.attrs.align" @change="setAttr(c, 'align', $event.target.value)"><option value="left">Gauche</option><option value="center">Centrée</option><option value="right">Droite</option></select></label>
        <label class="chk"><input type="checkbox" :checked="c.attrs.zoom" @change="setAttr(c, 'zoom', $event.target.checked)" /> Zoom au clic</label>
      </template>
      <template v-else-if="c.type === 'codeBlock'">
        <label>Langage <select :value="c.attrs.language || ''" @change="setAttr(c, 'language', $event.target.value || null)">
          <option value="">Sans coloration</option><option value="demo">Démo exécutée (HTML + CSS + JS)</option><option v-for="l in CODE_LANGUAGES" :key="l" :value="l">{{ l }}</option>
        </select></label>
        <label>{{ c.attrs.language === 'demo' ? 'Titre de la démo' : 'Nom du fichier' }} <input :value="c.attrs.file" maxlength="80" placeholder="Facultatif" @input="setAttr(c, 'file', $event.target.value)" /></label>
      </template>
    </div>

    <EditorContent :editor="ed" class="page" @keydown.ctrl.k.prevent="openDialog('link')" @keydown.meta.k.prevent="openDialog('link')" />

    <dialog ref="dlgEl" class="dlg" aria-labelledby="ve-dlg-title" @cancel.prevent="closeDialog">
      <form v-if="dlg.kind" novalidate @submit.prevent="submitDialog">
        <h3 id="ve-dlg-title">{{ dlg.kind === 'link' ? 'Lien' : 'Insérer une image' }}</h3>
        <label>{{ dlg.kind === 'link' ? 'Adresse du lien' : 'Lien de l\'image' }}
          <input v-model="dlg.url" type="url" :placeholder="dlg.kind === 'link' ? 'https://… (vide pour retirer le lien)' : 'https://…'" />
        </label>
        <label v-if="dlg.kind === 'image'">Texte alternatif<input v-model="dlg.alt" maxlength="200" placeholder="Décris ce que montre l'image" /></label>
        <img v-if="dlg.kind === 'image' && isHttps(dlg.url)" class="thumb" :src="dlg.url.trim()" alt="" referrerpolicy="no-referrer" />
        <p v-if="dlg.error" class="err" role="alert">{{ dlg.error }}</p>
        <div class="bar">
          <button class="btn btn-primary" type="submit">{{ dlg.kind === 'link' ? 'Valider' : 'Insérer' }}</button>
          <button class="btn btn-ghost" type="button" @click="closeDialog">Annuler</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.ve{display:grid;gap:10px}
.tb{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:6px 12px;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--card)}
.grp{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.grp+.grp{padding-left:12px;border-left:1px solid var(--line)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.sel,.ctx select,.ctx input:not([type=checkbox]){min-height:34px;padding:0 8px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:14px var(--font)}
.tbtn{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;padding:0 9px;border:1px solid transparent;border-radius:8px;background:none;color:var(--fg);font:600 14px var(--font);cursor:pointer}
.tbtn:hover:not(:disabled){border-color:var(--line);background:var(--bg)}
.tbtn:disabled{opacity:.4;cursor:default}
.tbtn:focus-visible,.mini:focus-visible{outline:3px solid var(--green);outline-offset:1px}
.tbtn.on{background:var(--green);border-color:var(--green);color:var(--on-green)}
.tbtn .b{font-weight:800}.tbtn .i{font-style:italic;font-family:var(--serif)}.tbtn .s{text-decoration:line-through}.tbtn .u{text-decoration:underline}.tbtn .c{font-family:ui-monospace,monospace;font-size:13px}
.tbtn .m{background:color-mix(in srgb,var(--neon) 45%,transparent);border-radius:4px;padding:0 3px}
.ctx{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:8px 12px;border:1px solid var(--line);border-left:4px solid var(--green);border-radius:10px;background:var(--card);font-size:14px}
.ctx label{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.ctx label input:not([type=checkbox]){min-width:150px}
.mini{min-height:32px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:600 13px var(--font);cursor:pointer}
.mini.danger{color:#b3261e;border-color:currentColor}
.page{border:1px solid var(--line);border-radius:12px;background:var(--bg);min-height:62vh}
.page :deep(.pm){min-height:62vh;padding:24px 28px;outline:none;font:17px/1.7 var(--font);color:var(--fg);overflow-wrap:anywhere}
.page :deep(.pm:focus-visible){outline:3px solid var(--green);outline-offset:-3px;border-radius:12px}
.page :deep(.pm>*:first-child){margin-top:0}
.page :deep(h2),.page :deep(h3),.page :deep(h4){font-family:var(--serif);line-height:1.25;margin:1.6em 0 .5em}
.page :deep(h2){font-size:1.7em}.page :deep(h3){font-size:1.35em}.page :deep(h4){font-size:1.12em}
.page :deep(p){margin:.7em 0}
.page :deep(a){color:var(--green);text-decoration:underline}
.page :deep(code){padding:1px 5px;border:1px solid var(--line);border-radius:5px;background:var(--card);font-size:.9em}
.page :deep(mark){background:color-mix(in srgb,var(--neon) 45%,transparent);color:inherit;border-radius:3px;padding:0 2px}
.page :deep(blockquote){margin:1em 0;padding:.2em 1em;border-left:4px solid var(--line);color:var(--muted)}
.page :deep(hr){border:0;border-top:1px solid var(--line);margin:1.6em 0}
.page :deep(ul),.page :deep(ol){padding-left:1.5em}
.page :deep(li){color:var(--fg)}
.page :deep(li>p){margin:.25em 0}
.page :deep(pre){margin:1em 0;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--card);overflow:auto;font:14px/1.55 ui-monospace,monospace}
.page :deep(pre code){padding:0;border:0;background:none;font-size:1em}
.page :deep(pre[data-file])::before{content:attr(data-file);display:block;margin-bottom:8px;color:var(--muted);font:600 12px var(--font)}
.page :deep(pre:has(code.language-demo))::after,.page :deep(pre)::after{content:none}
.page :deep(.blk){margin:1em 0;padding:.4em 1em;border:1px dashed var(--line);border-radius:10px}
.page :deep(.blk::before){display:block;margin-bottom:2px;color:var(--muted);font:700 12px var(--font);letter-spacing:.04em;text-transform:uppercase}
.page :deep(.blk-callout){border-style:solid;border-left:4px solid var(--green);background:var(--card)}
.page :deep(.blk-callout::before){content:attr(data-callout) " · " attr(data-title)}
.page :deep(.blk-fold::before){content:"▸ Dépliable · " attr(data-title)}
.page :deep(.blk-quote){font-family:var(--serif);font-size:1.15em}
.page :deep(.blk-quote::before){content:"Citation · " attr(data-author) " " attr(data-source)}
.page :deep(.blk-card::before){content:"Carte · " attr(data-title) " → " attr(data-url)}
.page :deep(.blk-align::before){content:"Alignement : " attr(data-align)}
.page :deep(.blk-align[data-align=center]){text-align:center}.page :deep(.blk-align[data-align=right]){text-align:right}.page :deep(.blk-align[data-align=justify]){text-align:justify}
.page :deep(img.blk-img){display:block;max-width:100%;height:auto;margin:1em auto;border-radius:10px;cursor:pointer}
.page :deep(img.blk-img[data-align=left]){margin-left:0}.page :deep(img.blk-img[data-align=right]){margin-right:0}
.page :deep(img.blk-img[data-width="25"]){width:25%}.page :deep(img.blk-img[data-width="33"]){width:33%}.page :deep(img.blk-img[data-width="50"]){width:50%}.page :deep(img.blk-img[data-width="66"]){width:66%}.page :deep(img.blk-img[data-width="75"]){width:75%}
.page :deep(img.ProseMirror-selectednode){outline:3px solid var(--green);outline-offset:2px}
.page :deep(table){width:100%;border-collapse:collapse;margin:1em 0;table-layout:fixed}
.page :deep(th),.page :deep(td){min-width:60px;padding:6px 10px;border:1px solid var(--line);vertical-align:top;text-align:left}
.page :deep(th){background:var(--card)}
.page :deep(td>p),.page :deep(th>p){margin:0}
.page :deep(.selectedCell){background:color-mix(in srgb,var(--green) 20%,transparent)}
.dlg{width:min(520px,94vw);padding:0;border:1px solid var(--line);border-radius:16px;background:var(--bg);color:var(--fg)}
.dlg::backdrop{background:rgba(0,0,0,.55)}
.dlg form{display:grid;gap:14px;margin:0;padding:22px;border:0;background:none}
.dlg h3{margin:0;font-size:20px}
.dlg label{display:grid;gap:6px;font-weight:600}
.dlg .thumb{max-width:100%;max-height:160px;object-fit:contain;border-radius:8px;justify-self:start}
</style>
