// Rendu des articles de veille : Markdown -> HTML assaini + sommaire.
// Sécurité : le HTML brut est désactivé, seuls les liens https/mailto/internes passent, les images sont en https uniquement,
// et le résultat final repasse par DOMPurify. Les options (largeur, alignement...) viennent de listes blanches, jamais de style en ligne.
import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import mark from 'markdown-it-mark'
import ins from 'markdown-it-ins'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import php from 'highlight.js/lib/languages/php'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import python from 'highlight.js/lib/languages/python'
import yaml from 'highlight.js/lib/languages/yaml'
import java from 'highlight.js/lib/languages/java'
import diff from 'highlight.js/lib/languages/diff'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import markdown from 'highlight.js/lib/languages/markdown'
import ini from 'highlight.js/lib/languages/ini'

export const CODE_LANGUAGES = ['javascript', 'typescript', 'json', 'bash', 'sql', 'php', 'xml', 'css', 'python', 'yaml', 'java', 'diff', 'dockerfile', 'markdown', 'ini']
const LIBS = { javascript, typescript, json, bash, sql, php, xml, css, python, yaml, java, diff, dockerfile, markdown, ini }
for (const [name, lib] of Object.entries(LIBS)) hljs.registerLanguage(name, lib)
const ALIASES = { javascript: ['js', 'jsx', 'mjs'], typescript: ['ts', 'tsx'], bash: ['sh', 'shell', 'zsh'], xml: ['html', 'vue', 'svg'], yaml: ['yml'], python: ['py'], markdown: ['md'], dockerfile: ['docker'], json: ['jsonc'], ini: ['toml', 'conf'] }
for (const [name, list] of Object.entries(ALIASES)) hljs.registerAliases(list, { languageName: name })

export const IMAGE_WIDTHS = [25, 33, 50, 66, 75, 100]
export const IMAGE_ALIGNS = ['left', 'center', 'right']
export const ALIGN_BLOCKS = ['left', 'center', 'right', 'justify']
export const CALLOUTS = { info: 'Info', tip: 'Astuce', warning: 'Attention', important: 'À retenir' }

const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: false })
const esc = md.utils.escapeHtml
md.use(mark).use(ins)
// Seuls https, http, mailto, ancres et chemins du site sont acceptés (pas de javascript:, data:, //hôte).
md.validateLink = (url) => /^(https?:\/\/|mailto:|#|\/(?!\/))/i.test(url.trim())

const isHttps = (u) => /^https:\/\//i.test(u)
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const idSlug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '')

// ---------- Liens ----------
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const t = tokens[idx]
  if (/^https?:\/\//i.test(t.attrGet('href') ?? '')) { t.attrSet('target', '_blank'); t.attrSet('rel', 'noopener noreferrer') }
  return self.renderToken(tokens, idx, options)
}

// ---------- Titres : # devient h2 (un seul h1 par page), ids pour le sommaire ----------
md.core.ruler.push('veille_headings', (state) => {
  const toc = (state.env.toc = [])
  const used = new Set()
  const t = state.tokens
  for (let i = 0; i < t.length; i++) {
    if (t[i].type !== 'heading_open') continue
    const level = Math.max(2, Number(t[i].tag.slice(1)))
    t[i].tag = `h${level}`
    if (t[i + 2]?.type === 'heading_close') t[i + 2].tag = `h${level}`
    const text = (t[i + 1].children ?? []).filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('').trim()
    let id = idSlug(text) || 'section'
    for (let n = 2; used.has(id); n++) id = `${idSlug(text) || 'section'}-${n}`
    used.add(id)
    t[i].attrSet('id', id)
    if (level <= 3) toc.push({ id, text, level })
  }
})

// ---------- Images : ![alt](https://… "Légende"){width=50 align=center zoom} ----------
md.inline.ruler.after('image', 'veille_image_attrs', (state, silent) => {
  if (silent || state.src.charCodeAt(state.pos) !== 0x7b) return false
  const prev = state.tokens[state.tokens.length - 1]
  if (prev?.type !== 'image') return false
  const end = state.src.indexOf('}', state.pos)
  if (end < 0) return false
  const raw = state.src.slice(state.pos + 1, end).trim()
  if (!/^[a-z0-9= ]+$/i.test(raw)) return false
  const meta = {}
  for (const part of raw.split(/\s+/)) {
    const [k, v] = part.split('=')
    if (k === 'width' && IMAGE_WIDTHS.includes(Number(v))) meta.width = Number(v)
    else if (k === 'align' && IMAGE_ALIGNS.includes(v)) meta.align = v
    else if (k === 'zoom' && v === undefined) meta.zoom = true
    else return false // option inconnue : on laisse le texte tel quel
  }
  prev.meta = { ...prev.meta, ...meta }
  state.pos = end + 1
  return true
})

// Une image seule dans son paragraphe devient une figure (pas de <figure> dans un <p>).
md.core.ruler.push('veille_image_figures', (state) => {
  const t = state.tokens
  for (let i = 0; i < t.length - 2; i++) {
    if (t[i].type !== 'paragraph_open' || t[i + 1].type !== 'inline' || t[i + 2].type !== 'paragraph_close') continue
    const kids = (t[i + 1].children ?? []).filter((c) => !(c.type === 'text' && !c.content.trim()))
    if (kids.length === 1 && kids[0].type === 'image') {
      t[i].hidden = t[i + 2].hidden = true
      kids[0].meta = { ...kids[0].meta, figure: true }
    }
  }
})

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const t = tokens[idx]
  const src = t.attrGet('src') ?? ''
  if (env.editor) {
    const m = t.meta ?? {}
    const ttl = t.attrGet('title')
    return `<img src="${esc(src)}" alt="${esc(self.renderInlineAsText(t.children, options, env))}"${ttl ? ` title="${esc(ttl)}"` : ''} data-width="${m.width ?? 100}" data-align="${m.align ?? 'center'}"${m.zoom ? ' data-zoom="1"' : ''}>`
  }
  if (!isHttps(src)) return '<span class="art-img-error">[Image refusée : un lien https est obligatoire]</span>'
  const alt = esc(self.renderInlineAsText(t.children, options, env))
  const title = t.attrGet('title')
  const img = `<img src="${esc(src)}" alt="${alt}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
  const m = t.meta ?? {}
  if (!m.figure) return img.replace('<img ', '<img class="art-inline-img" ')
  const w = m.width ?? 100
  const a = m.align ?? 'center'
  const inner = m.zoom ? `<button type="button" class="art-zoom" data-zoom aria-label="Agrandir l'image : ${alt || 'image'}">${img}</button>` : img
  return `<figure class="art-img w-${w} al-${a}">${inner}${title ? `<figcaption>${esc(title)}</figcaption>` : ''}</figure>\n`
}

// ---------- Démo : ```demo Titre  (HTML + CSS + JS dans un seul bloc, exécuté dans un cadre isolé ; le code reste visible) ----------
function demoBlock(code, title) {
  const html = hljs.highlight(code, { language: 'xml', ignoreIllegals: true }).value
  return `<figure class="demo" data-demo><div class="demo-bar"><span class="demo-title">${esc(title || 'Démo')}</span><span class="demo-tabs" role="group" aria-label="Affichage"><button type="button" data-demo-tab="result" aria-selected="true">Résultat</button><button type="button" data-demo-tab="code" aria-selected="false">Code</button></span></div><div class="demo-stage"><p class="demo-fallback">La démo nécessite JavaScript. Le code est dans l'onglet « Code ».</p></div><div class="demo-code" hidden><button type="button" class="code-copy" data-copy aria-label="Copier le code">Copier</button><pre tabindex="0"><code class="hljs language-xml">${html}</code></pre></div></figure>\n`
}

// ---------- Code : ```js fichier.js ----------
md.renderer.rules.fence = (tokens, idx, options, env) => {
  const t = tokens[idx]
  const [rawLang = '', ...rest] = t.info.trim().split(/\s+/)
  const lang = /^[a-z0-9+#-]{1,20}$/i.test(rawLang) ? rawLang.toLowerCase() : ''
  const file = rest.join(' ').slice(0, 80)
  const code = t.content.replace(/\n$/, '')
  if (env.editor) return `<pre${file ? ` data-file="${esc(file)}"` : ''}><code${lang ? ` class="language-${esc(lang)}"` : ''}>${esc(code)}</code></pre>\n`
  if (rawLang.toLowerCase() === 'demo') return demoBlock(code, rest.join(' ').slice(0, 80))
  const known = lang && hljs.getLanguage(lang) ? hljs.getLanguage(lang) : null
  const html = known ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : esc(code)
  const cls = known ? ` language-${esc(lang)}` : ''
  return `<figure class="code"><div class="code-bar"><span class="code-name">${esc(file)}</span><span class="code-lang">${esc(lang)}</span><button type="button" class="code-copy" data-copy aria-label="Copier le code">Copier</button></div><pre tabindex="0"><code class="hljs${cls}">${html}</code></pre></figure>\n`
}

// ---------- Tableaux défilants ----------
md.renderer.rules.table_open = (tokens, idx, options, env) => (env.editor ? '<table>\n' : '<div class="table-wrap"><table>\n')
md.renderer.rules.table_close = (tokens, idx, options, env) => (env.editor ? '</table>\n' : '</table></div>\n')

// ---------- Blocs ::: ----------
const infoOf = (tokens, idx, name) => tokens[idx].info.trim().slice(name.length).trim()
// Mode éditeur (env.editor) : balises neutres lues par l'éditeur visuel (data-*), sans mise en forme de lecture.
const attr = (v) => esc(String(v ?? ''))
const EDITOR_BLOCKS = {
  callout: (name, info) => `<div data-callout="${name}" data-title="${attr(info)}">\n`,
  details: (name, info) => `<div data-fold data-title="${attr(info)}">\n`,
  quote: (name, info) => { const [a = '', s = ''] = info.split('|').map((x) => x.trim()); return `<div data-pullquote data-author="${attr(a)}" data-source="${attr(s)}">\n` },
  link: (name, info) => { const [u = '', ...w] = info.split(/\s+/); return `<div data-linkcard data-url="${attr(u)}" data-title="${attr(w.join(' '))}">\n` },
  align: (name) => `<div data-align="${name}">\n`,
}
function block(name, open, close) {
  const kind = ALIGN_BLOCKS.includes(name) ? 'align' : CALLOUTS[name] ? 'callout' : name
  md.use(container, name, {
    render(tokens, idx, options, env) {
      const info = infoOf(tokens, idx, name)
      if (env.editor) return tokens[idx].nesting === 1 ? EDITOR_BLOCKS[kind](name, info) : '</div>\n'
      return tokens[idx].nesting === 1 ? open(info, env) : close(env)
    },
  })
}
for (const a of ALIGN_BLOCKS) block(a, () => `<div class="al-${a}">\n`, () => '</div>\n')
for (const [k, label] of Object.entries(CALLOUTS)) {
  block(k, (title) => `<div class="callout callout-${k}" role="note"><p class="callout-title">${esc(title || label)}</p>\n`, () => '</div>\n')
}
block('details', (title) => `<details class="fold"><summary>${esc(title || 'Détails')}</summary><div class="fold-body">\n`, () => '</div></details>\n')
// ::: quote Auteur | Source
block('quote',
  (info, env) => {
    const [author = '', source = ''] = info.split('|').map((s) => s.trim())
    ;(env.quotes ??= []).push({ author, source })
    return '<figure class="pullquote"><blockquote>\n'
  },
  (env) => {
    const q = (env.quotes ??= []).pop() ?? {}
    const cap = [q.author && esc(q.author), q.source && `<cite>${esc(q.source)}</cite>`].filter(Boolean).join(', ')
    return `</blockquote>${cap ? `<figcaption>— ${cap}</figcaption>` : ''}</figure>\n`
  })
// ::: link https://exemple.com Titre de la carte   (la description est le texte du bloc)
block('link',
  (info) => {
    const [url = '', ...words] = info.split(/\s+/)
    const title = words.join(' ') || hostOf(url) || 'Lien'
    if (!isHttps(url)) return `<div class="linkcard"><span class="linkcard-title">${esc(title)}</span><div class="linkcard-desc">\n`
    return `<div class="linkcard"><a class="linkcard-title" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a><span class="linkcard-host">${esc(hostOf(url))}</span><div class="linkcard-desc">\n`
  },
  () => '</div></div>\n')

const PURIFY = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target', 'referrerpolicy', 'loading', 'decoding'],
  FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'select', 'iframe', 'object', 'embed', 'script', 'link', 'meta'],
}

// Renvoie { html, toc } ; toc = [{ id, text, level }] pour les titres h2 et h3.
export function renderMarkdown(src) {
  const env = {}
  const raw = md.render(String(src ?? ''), env)
  const html = DOMPurify.isSupported ? DOMPurify.sanitize(raw, PURIFY) : ''
  return { html, toc: env.toc ?? [] }
}

// HTML neutre pour l'éditeur visuel (aucun traitement de lecture ; l'éditeur filtre lui-même ce qu'il comprend).
export function markdownToEditorHtml(src) {
  return md.render(String(src ?? ''), { editor: true })
}
