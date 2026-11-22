// Éditeur visuel -> Markdown : transforme le JSON ProseMirror (editor.getJSON()) en texte Markdown du dialecte de la veille.
// Le Markdown reste le seul format stocké ; cette fonction est l'inverse de markdownToEditorHtml (src/lib/markdown.js).
const LINK_OK = /^(https?:\/\/|mailto:|#|\/(?!\/))/i
const MARKS = ['link', 'bold', 'italic', 'strike', 'underline', 'highlight']
const DELIM = { bold: '**', italic: '*', strike: '~~', underline: '++', highlight: '==' }
const oneLine = (t) => String(t ?? '').replace(/\s+/g, ' ').trim()

// ---------- Texte ----------
function escapeText(t, inTable) {
  let s = t.replace(/[\\`*[\]<>~]/g, '\\$&')
  s = s.replace(/(^|[^A-Za-z0-9])_|_(?=[^A-Za-z0-9]|$)/g, (m) => (m.startsWith('_') ? '\\_' : `${m[0]}\\_`))
  s = s.replace(/==/g, '\\=\\=').replace(/\+\+/g, '\\+\\+').replace(/&(?=#?\w+;)/g, '\\&')
  if (inTable) s = s.replace(/\|/g, '\\|')
  return s
}
const escapeLineStarts = (s) => s.split('\n').map((l) => l.replace(/^(\s*)([-+=#]|\d+(?=[.)]\s)|:::)/, (m, sp, c) => (/^\d/.test(c) ? `${sp}${c}\\` : `${sp}\\${c}`))).join('\n')

function linkUrl(u) { return u.trim().replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29') }
function codeSpan(text) {
  const runs = text.match(/`+/g) ?? []
  const n = Math.max(0, ...runs.map((r) => r.length)) + 1
  const f = '`'.repeat(n)
  return /^`|`$/.test(text) ? `${f} ${text} ${f}` : `${f}${text}${f}`
}

// Aplatit les nœuds en ligne en segments { text, keys } puis pose les délimiteurs sans les doubler d'un segment à l'autre.
function inline(nodes = [], inTable = false) {
  const segs = []
  for (const n of nodes) {
    if (n.type === 'hardBreak') { segs.push({ br: true }); continue }
    if (n.type !== 'text' || !n.text) continue
    const marks = new Map((n.marks ?? []).map((m) => [m.type, m.attrs ?? {}]))
    if (marks.has('code')) { segs.push({ text: codeSpan(n.text), keys: [], raw: true, link: marks.get('link') }); continue }
    const keys = MARKS.filter((k) => marks.has(k) && (k !== 'link' || LINK_OK.test(marks.get('link').href ?? '')))
      .map((k) => (k === 'link' ? `link:${marks.get('link').href}` : k))
    const [, lead, core, trail] = n.text.match(/^(\s*)([\s\S]*?)(\s*)$/)
    if (lead) segs.push({ text: lead.replace(/\s+/g, ' '), keys: [] })
    if (core) segs.push({ text: escapeText(core, inTable), keys })
    if (trail) segs.push({ text: trail.replace(/\s+/g, ' '), keys: [] })
  }
  let out = ''
  let open = []
  const close = (to) => {
    while (open.length > to) {
      const k = open.pop()
      out += k.startsWith('link:') ? `](${linkUrl(k.slice(5))})` : DELIM[k]
    }
  }
  for (const sg of segs) {
    if (sg.br) { close(0); out += '\\\n'; continue }
    let keys = sg.keys
    if (sg.raw) {
      const href = sg.link?.href
      keys = href && LINK_OK.test(href) ? [`link:${href}`] : []
    }
    let i = 0
    while (i < open.length && i < keys.length && open[i] === keys[i]) i++
    close(i)
    for (const k of keys.slice(i)) { out += k.startsWith('link:') ? '[' : DELIM[k]; open.push(k) }
    out += sg.text
  }
  close(0)
  return out
}

// ---------- Blocs ----------
const indent = (s, pad) => s.split('\n').map((l, i) => (i === 0 || !l ? l : pad + l)).join('\n')
const depthOf = (n) => (n.content ?? []).reduce((m, c) => Math.max(m, depthOf(c)), 0) + (CONTAINERS.has(n.type) ? 1 : 0)
const CONTAINERS = new Set(['callout', 'details', 'pullquote', 'linkcard', 'alignBlock'])

function children(node, ctx) {
  return (node.content ?? []).map((c) => block(c, ctx)).filter((s) => s !== '')
}
function container(node, head, ctx) {
  const colons = ':'.repeat(3 + depthOf(node) - 1)
  const body = children(node, ctx).join('\n\n')
  return `${colons} ${head}\n\n${body}${body ? '\n\n' : ''}${colons}`
}
function listItem(li, ctx) {
  const parts = children(li, ctx)
  const tight = li.content?.length > 1 && li.content[0].type === 'paragraph' && li.content.slice(1).every((c) => c.type === 'bulletList' || c.type === 'orderedList')
  return parts.join(tight ? '\n' : '\n\n')
}
function list(node, ctx, ordered) {
  const start = node.attrs?.start ?? 1
  const items = (node.content ?? []).map((li, i) => {
    const marker = ordered ? `${start + i}. ` : '- '
    return marker + indent(listItem(li, ctx), ' '.repeat(marker.length))
  })
  const loose = (node.content ?? []).some((li) => (li.content ?? []).filter((c) => c.type !== 'bulletList' && c.type !== 'orderedList').length > 1)
  return items.join(loose ? '\n\n' : '\n')
}
function table(node, ctx) {
  const rows = (node.content ?? []).map((r) => (r.content ?? []).map((c) => {
    const text = (c.content ?? []).map((p) => (p.type === 'image' ? block(p, ctx) : inline(p.content, true))).filter(Boolean).join(' ')
    return text.replace(/\n/g, ' ').trim() || ' '
  }))
  if (!rows.length) return ''
  const cols = Math.max(...rows.map((r) => r.length))
  const line = (r) => `| ${Array.from({ length: cols }, (_, i) => r[i] ?? ' ').join(' | ')} |`
  return [line(rows[0]), `| ${Array.from({ length: cols }, () => '---').join(' | ')} |`, ...rows.slice(1).map(line)].join('\n')
}

function block(node, ctx = {}) {
  const a = node.attrs ?? {}
  switch (node.type) {
    case 'paragraph': {
      const t = inline(node.content)
      return t.trim() ? escapeLineStarts(t) : ''
    }
    case 'heading': {
      const t = oneLine(inline(node.content).replace(/\\\n/g, ' '))
      return t ? `${'#'.repeat(Math.min(4, Math.max(2, a.level ?? 2)))} ${t}` : ''
    }
    case 'bulletList': return list(node, ctx, false)
    case 'orderedList': return list(node, ctx, true)
    case 'blockquote': return children(node, ctx).join('\n\n').split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n')
    case 'horizontalRule': return '---'
    case 'codeBlock': {
      const code = (node.content ?? []).map((t) => t.text ?? '').join('')
      const n = Math.max(2, ...(code.match(/`{3,}/gm) ?? []).map((r) => r.length)) + 1
      const f = '`'.repeat(n)
      const lang = /^[a-z0-9+#-]{1,20}$/i.test(a.language ?? '') ? a.language : ''
      const file = oneLine(a.file)
      const info = lang ? `${lang}${file ? ` ${file}` : ''}` : file ? `text ${file}` : ''
      return `${f}${info}\n${code}\n${f}`
    }
    case 'image': {
      if (!a.src) return ''
      const opts = []
      if (a.width && Number(a.width) !== 100) opts.push(`width=${Number(a.width)}`)
      if (a.align && a.align !== 'center') opts.push(`align=${a.align}`)
      if (a.zoom) opts.push('zoom')
      const alt = oneLine(a.alt).replace(/[[\]\\]/g, '\\$&')
      const title = oneLine(a.title).replace(/["\\]/g, '\\$&')
      return `![${alt}](${linkUrl(a.src)}${title ? ` "${title}"` : ''})${opts.length ? `{${opts.join(' ')}}` : ''}`
    }
    case 'callout': return container(node, `${a.kind || 'info'}${a.title ? ` ${oneLine(a.title)}` : ''}`, ctx)
    case 'details': return container(node, `details${a.title ? ` ${oneLine(a.title)}` : ''}`, ctx)
    case 'pullquote': {
      const au = oneLine(a.author).replace(/\|/g, '/')
      const so = oneLine(a.source).replace(/\|/g, '/')
      return container(node, `quote${au || so ? ` ${au}${so ? ` | ${so}` : ''}` : ''}`, ctx)
    }
    case 'linkcard': return container(node, `link ${linkUrl(a.url || '')}${a.title ? ` ${oneLine(a.title)}` : ''}`, ctx)
    case 'alignBlock': return container(node, a.align || 'left', ctx)
    case 'table': return table(node, ctx)
    default: return ''
  }
}

export function editorToMarkdown(doc) {
  return children(doc ?? {}, {}).join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
