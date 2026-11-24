// Comparaison de deux contenus JSON, ligne par ligne : on « aplatit » chaque objet en lignes lisibles puis on cherche les lignes communes.
const IGNORED = new Set(['updatedAt', 'updated_at'])

export function flatten(v, path = '', out = []) {
  if (Array.isArray(v)) {
    if (!v.length) out.push(`${path} : (liste vide)`)
    v.forEach((x, i) => flatten(x, `${path}[${i + 1}]`, out))
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!IGNORED.has(k)) flatten(x, path ? `${path} › ${k}` : k, out)
  } else if (typeof v === 'string' && v.includes('\n')) {
    v.split('\n').forEach((l, i) => out.push(`${path} (l.${i + 1}) : ${l}`))
  } else out.push(`${path} : ${v === '' || v == null ? '(vide)' : v}`)
  return out
}

// Plus longue sous-suite commune (programmation dynamique) -> [{ t: 'same' | 'add' | 'del', s }]
export function diffLines(a, b) {
  const n = a.length, m = b.length
  const w = m + 1
  const L = new Uint16Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * w + j] = a[i] === b[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1])
  const out = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ t: 'same', s: a[i] }); i++; j++ }
    else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) out.push({ t: 'del', s: a[i++] })
    else out.push({ t: 'add', s: b[j++] })
  }
  while (i < n) out.push({ t: 'del', s: a[i++] })
  while (j < m) out.push({ t: 'add', s: b[j++] })
  return out
}

// Ne garde que les lignes modifiées et une ligne de contexte autour.
export function compact(lines, ctx = 1) {
  const keep = new Array(lines.length).fill(false)
  lines.forEach((l, i) => { if (l.t !== 'same') for (let k = Math.max(0, i - ctx); k <= Math.min(lines.length - 1, i + ctx); k++) keep[k] = true })
  const out = []
  let gap = false
  lines.forEach((l, i) => { if (keep[i]) { if (gap) out.push({ t: 'gap', s: '…' }); out.push(l); gap = false } else gap = true })
  return out
}
