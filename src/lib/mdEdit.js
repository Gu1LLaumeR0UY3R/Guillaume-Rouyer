// Actions de la barre d'outils : fonctions pures qui transforment (texte, sélection) en une « modification ».
// Une modification = { from, to, text, selStart, selEnd } : remplacer value[from..to] par text, puis sélectionner selStart..selEnd (positions dans le nouveau texte).
import { ALIGN_BLOCKS } from './markdown.js'

const lineStartOf = (v, i) => v.lastIndexOf('\n', i - 1) + 1
const lineEndOf = (v, i) => { const k = v.indexOf('\n', i); return k < 0 ? v.length : k }
// Début et fin des lignes touchées par la sélection (une sélection qui finit en début de ligne ne prend pas cette ligne).
function lineSpan(v, s, e) {
  const end = e > s && v[e - 1] === '\n' ? e - 1 : e
  return [lineStartOf(v, s), lineEndOf(v, end)]
}
const maxRun = (text, ch) => Math.max(0, ...(text.match(new RegExp(`${ch === '`' ? '`' : ch}+`, 'g')) ?? []).map((m) => m.length))
const edit = (from, to, text, selStart, selEnd) => ({ from, to, text, selStart, selEnd })

// ---------- Style en ligne : gras, italique, barré, surligné, souligné, code ----------
export function wrapInline(v, s, e, open, close = open, placeholder = 'texte') {
  const sel = v.slice(s, e)
  if (s >= open.length && v.slice(s - open.length, s) === open && v.slice(e, e + close.length) === close) {
    return edit(s - open.length, e + close.length, sel, s - open.length, s - open.length + sel.length) // déjà entouré : on retire
  }
  if (sel.length >= open.length + close.length && sel.startsWith(open) && sel.endsWith(close)) {
    const inner = sel.slice(open.length, sel.length - close.length)
    return edit(s, e, inner, s, s + inner.length)
  }
  const inner = sel || placeholder
  return edit(s, e, open + inner + close, s + open.length, s + open.length + inner.length)
}

// ---------- Titres ----------
export function heading(v, s, e, level) {
  const [a, b] = lineSpan(v, s, e)
  const prefix = `${'#'.repeat(level)} `
  const lines = v.slice(a, b).split('\n')
  const same = lines.every((l) => l.startsWith(prefix))
  let out = lines.map((l) => { const bare = l.replace(/^#{1,6}\s+/, ''); return same ? bare : prefix + bare }).join('\n')
  if (!same && lines.length === 1 && !lines[0].trim()) out = `${prefix}Titre`
  return edit(a, b, out, a, a + out.length)
}

// ---------- Listes et citation ----------
const MARKERS = { ul: /^(\s*)[-*]\s+/, ol: /^(\s*)\d+\.\s+/, quote: /^(\s*)>\s?/ }
const ANY_MARKER = /^(\s*)([-*]|\d+\.|>)\s+/
export function prefixLines(v, s, e, kind) {
  const [a, b] = lineSpan(v, s, e)
  const lines = v.slice(a, b).split('\n')
  const filled = lines.filter((l) => l.trim())
  const all = filled.length > 0 && filled.every((l) => MARKERS[kind].test(l))
  let n = 0
  const out = lines.map((l) => {
    if (!l.trim()) return l
    if (all) return l.replace(MARKERS[kind], '$1')
    const bare = l.replace(ANY_MARKER, '$1')
    n += 1
    return (kind === 'ul' ? '- ' : kind === 'ol' ? `${n}. ` : '> ') + bare
  }).join('\n')
  const text = out.trim() ? out : (kind === 'ul' ? '- ' : kind === 'ol' ? '1. ' : '> ')
  return edit(a, b, text, a + text.length, a + text.length)
}

// ---------- Blocs ::: (alignement, encadrés...) ----------
const OPEN = /^(:{3,})\s*([a-z]+)\b.*$/i
const CLOSE = /^(:{3,})\s*$/

// Conteneur qui entoure la ligne donnée (le plus proche), en ignorant les blocs de code.
function enclosing(v, pos, names) {
  const lines = v.split('\n')
  let off = 0, fence = null
  const stack = []
  let found = null
  const target = v.slice(0, pos).split('\n').length - 1
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const f = l.match(/^(`{3,}|~{3,})/)
    if (f) { if (!fence) fence = f[1][0].repeat(f[1].length); else if (l.startsWith(fence)) fence = null; off += l.length + 1; continue }
    if (!fence) {
      const o = l.match(OPEN), c = l.match(CLOSE)
      if (c && stack.length) {
        const top = stack.pop()
        if (top.line < target && i > target && names.includes(top.name)) found = { open: top, close: { line: i, start: off, end: off + l.length } }
      } else if (o) stack.push({ line: i, name: o[2].toLowerCase(), marker: o[1], start: off, end: off + l.length })
    }
    off += l.length + 1
  }
  return found // le dernier trouvé est le plus interne (il se ferme en premier)
}

export function align(v, s, e, kind) {
  const hit = enclosing(v, s, ALIGN_BLOCKS)
  if (hit) {
    const { open, close } = hit
    if (open.name === kind) { // même alignement : on retire le bloc
      const inner = v.slice(open.end + 1, close.start - 1)
      return edit(open.start, close.end, inner, open.start, open.start + inner.length)
    }
    const head = `${open.marker} ${kind}`
    return edit(open.start, open.end, head, s + (head.length - (open.end - open.start)), e + (head.length - (open.end - open.start)))
  }
  return wrapBlock(v, s, e, kind, 'Texte à aligner')
}

// Entoure les lignes sélectionnées d'un bloc ::: info ... :::  (marqueur plus long si la sélection contient déjà des blocs).
export function wrapBlock(v, s, e, info, placeholder = 'Contenu') {
  const [a, b] = lineSpan(v, s, e)
  const raw = v.slice(a, b)
  const content = raw.trim() ? raw : placeholder
  const marker = ':'.repeat(Math.max(3, maxRun(content.split('\n').filter((l) => /^:{3,}/.test(l)).join('\n'), ':') + 1))
  const head = `${marker} ${info}`
  const text = `${head}\n${content}\n${marker}`
  return edit(a, b, text, a + head.length + 1, a + head.length + 1 + content.length)
}

// ---------- Insertions ----------
// Insère un bloc dans son propre paragraphe (lignes vides avant et après).
export function insertBlock(v, s, e, md, select = false) {
  const before = v.slice(0, s), after = v.slice(e)
  const lead = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const trail = !after || after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
  const text = lead + md + trail
  return select ? edit(s, e, text, s + lead.length, s + lead.length + md.length) : edit(s, e, text, s + text.length, s + text.length)
}

export function link(v, s, e, url, label = 'texte du lien') {
  const text = v.slice(s, e) || label
  const md = `[${text}](${url})`
  return edit(s, e, md, s + md.length, s + md.length)
}

const clean = (t) => String(t ?? '').replace(/[\r\n]+/g, ' ').trim()
const encUrl = (u) => String(u).trim().replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29')
export function imageMd({ url, alt, caption = '', width = 100, align: al = 'center', zoom = false }) {
  const a = clean(alt).replace(/[\[\]\\]/g, '\\$&')
  const title = clean(caption) ? ` "${clean(caption).replace(/["\\]/g, '\\$&')}"` : ''
  const opts = [width !== 100 && `width=${width}`, al !== 'center' && `align=${al}`, zoom && 'zoom'].filter(Boolean)
  return `![${a}](${encUrl(url)}${title})${opts.length ? `{${opts.join(' ')}}` : ''}`
}

export function codeBlock(v, s, e, lang = '', file = '') {
  const code = v.slice(s, e).replace(/\n$/, '') || 'code'
  const fence = '`'.repeat(Math.max(3, maxRun(code, '`') + 1))
  const info = [lang, clean(file)].filter(Boolean).join(' ')
  return insertBlock(v, s, e, `${fence}${info}\n${code}\n${fence}`)
}

export const TABLE_TEMPLATE = '| Colonne 1 | Colonne 2 |\n| --- | --- |\n| Cellule | Cellule |'
