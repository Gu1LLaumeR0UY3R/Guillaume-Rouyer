// Extensions de l'éditeur visuel (TipTap) : les blocs de la veille (encadré, dépliable, citation, carte, alignement, image, code, démo).
// Chaque bloc a des attributs simples ; l'éditeur ne produit jamais de HTML libre, tout repasse par le Markdown.
import { Node, Mark, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import CodeBlock from '@tiptap/extension-code-block'
import { CALLOUTS, ALIGN_BLOCKS, IMAGE_WIDTHS } from './markdown.js'

const dataAttr = (name, fallback = '') => ({
  default: fallback,
  parseHTML: (el) => el.getAttribute(`data-${name}`) ?? fallback,
  renderHTML: (a) => ({ [`data-${name}`]: a[name] }),
})

export const Callout = Node.create({
  name: 'callout', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { kind: { default: 'info', parseHTML: (el) => el.getAttribute('data-callout') || 'info', renderHTML: (a) => ({ 'data-callout': a.kind }) }, title: dataAttr('title') } },
  parseHTML() { return [{ tag: 'div[data-callout]', getAttrs: (el) => (CALLOUTS[el.getAttribute('data-callout')] ? null : false) }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { class: 'blk blk-callout' }), 0] },
})

export const Details = Node.create({
  name: 'details', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { title: dataAttr('title') } },
  parseHTML() { return [{ tag: 'div[data-fold]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-fold': '', class: 'blk blk-fold' }), 0] },
})

export const Pullquote = Node.create({
  name: 'pullquote', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { author: dataAttr('author'), source: dataAttr('source') } },
  parseHTML() { return [{ tag: 'div[data-pullquote]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-pullquote': '', class: 'blk blk-quote' }), 0] },
})

export const LinkCard = Node.create({
  name: 'linkcard', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { url: dataAttr('url'), title: dataAttr('title') } },
  parseHTML() { return [{ tag: 'div[data-linkcard]' }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-linkcard': '', class: 'blk blk-card' }), 0] },
})

export const AlignBlock = Node.create({
  name: 'alignBlock', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { align: { default: 'center', parseHTML: (el) => el.getAttribute('data-align') || 'center', renderHTML: (a) => ({ 'data-align': a.align }) } } },
  parseHTML() { return [{ tag: 'div[data-align]', getAttrs: (el) => (ALIGN_BLOCKS.includes(el.getAttribute('data-align')) ? null : false) }] },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { class: 'blk blk-align' }), 0] },
})

export const ArticleImage = Node.create({
  name: 'image', group: 'block', atom: true, draggable: true, selectable: true,
  addAttributes() {
    return {
      src: { default: '' }, alt: { default: '' }, title: { default: '' },
      width: { default: 100, parseHTML: (el) => (IMAGE_WIDTHS.includes(Number(el.getAttribute('data-width'))) ? Number(el.getAttribute('data-width')) : 100), renderHTML: (a) => ({ 'data-width': a.width }) },
      align: { default: 'center', parseHTML: (el) => el.getAttribute('data-align') || 'center', renderHTML: (a) => ({ 'data-align': a.align }) },
      zoom: { default: false, parseHTML: (el) => el.hasAttribute('data-zoom'), renderHTML: (a) => (a.zoom ? { 'data-zoom': '1' } : {}) },
    }
  },
  parseHTML() { return [{ tag: 'img[src]' }] },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes, { referrerpolicy: 'no-referrer', class: 'blk-img' })] },
})

// Bloc de code : langage + nom de fichier ; le langage « demo » est le bloc exécuté dans l'article (le nom devient son titre).
export const ArticleCode = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      file: { default: '', parseHTML: (el) => el.getAttribute('data-file') || (el.parentElement?.getAttribute('data-file') ?? ''), renderHTML: (a) => (a.file ? { 'data-file': a.file } : {}) },
    }
  },
})

// Souligné = ++texte++ (le HTML <ins> ou <u> est accepté à la lecture).
export const Underline = Mark.create({
  name: 'underline',
  parseHTML() { return [{ tag: 'ins' }, { tag: 'u' }] },
  renderHTML({ HTMLAttributes }) { return ['u', HTMLAttributes, 0] },
  addKeyboardShortcuts() { return { 'Mod-u': () => this.editor.commands.toggleMark(this.name) } },
})

export function extensions() {
  return [
    StarterKit.configure({ heading: { levels: [2, 3, 4] }, codeBlock: false, underline: false, link: { openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer nofollow' } }, dropcursor: { color: 'var(--green)' } }),
    ArticleCode, Underline, Highlight,
    Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
    Callout, Details, Pullquote, LinkCard, AlignBlock, ArticleImage,
  ]
}
