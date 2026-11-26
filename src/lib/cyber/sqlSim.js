// Mini-interpréteur SQL pour la démo d'injection. Il ne touche à aucune vraie base : il lit une table fictive en mémoire.
// Il comprend juste ce qu'il faut pour montrer les attaques classiques : OR, commentaires (-- # /* */), UNION SELECT, erreurs de syntaxe.
export class SqlError extends Error {}

export const USERS = [
  { id: 1, username: 'admin', password: 'S3cr3t!Admin', role: 'admin' },
  { id: 2, username: 'alice', password: 'azerty123', role: 'user' },
  { id: 3, username: 'bob', password: 'hunter2', role: 'user' },
]
const COLS = ['id', 'username', 'password', 'role']

// 1) Découpage en jetons
function tokenize(sql) {
  const out = []
  let i = 0
  while (i < sql.length) {
    const c = sql[i]
    if (/\s/.test(c)) { i++; continue }
    if ((c === '-' && sql[i + 1] === '-') || c === '#') { const nl = sql.indexOf('\n', i); if (nl < 0) break; i = nl; continue } // commentaire de ligne : le reste est ignoré
    if (c === '/' && sql[i + 1] === '*') { const e = sql.indexOf('*/', i + 2); if (e < 0) throw new SqlError('commentaire /* non fermé'); i = e + 2; continue }
    if (c === "'") {
      let j = i + 1, s = ''
      for (;;) {
        if (j >= sql.length) throw new SqlError(`guillemet non fermé près de '${s.slice(0, 20)}'`) // l'erreur classique qui trahit une injection possible
        if (sql[j] === "'") { if (sql[j + 1] === "'") { s += "'"; j += 2; continue } break } // '' = une apostrophe échappée
        s += sql[j++]
      }
      out.push({ t: 'str', v: s }); i = j + 1; continue
    }
    const num = /^\d+(\.\d+)?/.exec(sql.slice(i))
    if (num) { out.push({ t: 'num', v: Number(num[0]) }); i += num[0].length; continue }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sql.slice(i))
    if (id) { out.push({ t: 'id', v: id[0].toLowerCase() }); i += id[0].length; continue }
    const op = /^(<>|!=|<=|>=|=|<|>)/.exec(sql.slice(i))
    if (op) { out.push({ t: 'op', v: op[0] }); i += op[0].length; continue }
    if ('(),*;'.includes(c)) { out.push({ t: 'p', v: c }); i++; continue }
    throw new SqlError(`caractère inattendu « ${c} »`)
  }
  return out
}

// 2) Analyse (descente récursive) + exécution. Priorité : AND avant OR, comme en vrai SQL.
export function runSql(sql) {
  if (sql.length > 400) throw new SqlError('requête trop longue pour la démo')
  const toks = tokenize(sql)
  let p = 0
  const peek = () => toks[p]
  const isKw = (kw) => peek()?.t === 'id' && peek().v === kw
  const eatKw = (kw) => { if (!isKw(kw)) throw new SqlError(`erreur de syntaxe près de « ${peek()?.v ?? 'fin de requête'} » (attendu : ${kw.toUpperCase()})`); p++ }
  const eatP = (ch) => { if (peek()?.t === 'p' && peek().v === ch) { p++; return true } return false }

  const operand = () => {
    const t = peek()
    if (!t) throw new SqlError('erreur de syntaxe : fin de requête inattendue')
    p++
    if (t.t === 'str' || t.t === 'num') return () => t.v
    if (t.t === 'id' && COLS.includes(t.v)) return (row) => row[t.v]
    if (t.t === 'p' && t.v === '(') { const e = orExpr(); if (!eatP(')')) throw new SqlError('parenthèse fermante manquante'); return e }
    throw new SqlError(`erreur de syntaxe près de « ${t.v} »`)
  }
  // Comme MySQL : comparer un texte et un nombre convertit le texte en nombre (« abc » vaut 0)
  const same = (a, b) => (typeof a === typeof b ? a === b : (Number(a) || 0) === (Number(b) || 0))
  const cmp = () => {
    const l = operand()
    const t = peek()
    if (t?.t === 'op') {
      p++
      const r = operand()
      return (row) => {
        const a = l(row), b = r(row)
        switch (t.v) {
          case '=': return same(a, b)
          case '<>': case '!=': return !same(a, b)
          case '<': return a < b
          case '>': return a > b
          case '<=': return a <= b
          default: return a >= b
        }
      }
    }
    return (row) => Boolean(l(row)) && l(row) !== 0 // une valeur seule : vraie si non nulle
  }
  const andExpr = () => { let l = cmp(); while (isKw('and')) { p++; const a = l, r = cmp(); l = (row) => a(row) && r(row) } return l }
  function orExpr() { let l = andExpr(); while (isKw('or')) { p++; const a = l, r = andExpr(); l = (row) => a(row) || r(row) } return l }

  const select = () => {
    eatKw('select')
    const cols = []
    do {
      const t = peek()
      if (!t) throw new SqlError('erreur de syntaxe : colonnes attendues')
      p++
      if (t.t === 'p' && t.v === '*') cols.push(...COLS.map((c) => ({ name: c, get: (r) => r[c] })))
      else if (t.t === 'id' && COLS.includes(t.v)) cols.push({ name: t.v, get: (r) => r[t.v] })
      else if (t.t === 'num' || t.t === 'str') cols.push({ name: String(t.v), get: () => t.v })
      else throw new SqlError(`colonne inconnue « ${t.v} »`)
    } while (eatP(','))
    eatKw('from')
    eatKw('users')
    let where = () => true
    if (isKw('where')) { p++; where = orExpr() }
    return { cols, rows: USERS.filter(where) }
  }

  let first = select()
  const names = first.cols.map((c) => c.name)
  let rows = first.rows.map((r) => first.cols.map((c) => c.get(r)))
  while (isKw('union')) {
    p++
    if (isKw('all')) p++
    const next = select()
    if (next.cols.length !== first.cols.length) throw new SqlError('The used SELECT statements have a different number of columns') // l'attaquant doit deviner le bon nombre de colonnes
    rows = rows.concat(next.rows.map((r) => next.cols.map((c) => c.get(r))))
  }
  eatP(';')
  if (p < toks.length) throw new SqlError(`erreur de syntaxe près de « ${toks[p].v} »`) // une 2e requête (« ; DROP … ») n'est pas exécutée
  return { cols: names, rows }
}

// Version vulnérable : on COLLE les saisies dans le texte de la requête
export const vulnerableQuery = (u, pw) => `SELECT id, username, role FROM users WHERE username = '${u}' AND password = '${pw}'`

// Version sûre : requête préparée. Les valeurs voyagent à part et ne sont JAMAIS interprétées comme du SQL.
export function preparedLogin(u, pw) {
  const rows = USERS.filter((x) => x.username === u && x.password === pw)
  return { cols: ['id', 'username', 'role'], rows: rows.map((r) => [r.id, r.username, r.role]) }
}
