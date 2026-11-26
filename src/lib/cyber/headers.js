// Analyse des en-têtes HTTP de sécurité d'une réponse. Fonction pure : elle reçoit des en-têtes, rend un rapport.
// `headers` : objet { nom-en-minuscules: valeur } ; `cookies` : liste de lignes Set-Cookie (peut être vide).

const OK = 'ok', WARN = 'warn', BAD = 'bad', INFO = 'info'

function parseCsp(v) {
  const d = {}
  for (const part of v.split(';')) {
    const [name, ...vals] = part.trim().split(/\s+/)
    if (name) d[name.toLowerCase()] = vals
  }
  return d
}

export function analyzeHeaders(headers, cookies = []) {
  const h = headers
  const checks = []
  const add = (id, label, status, detail, advice = '', weight = 10) => checks.push({ id, label, status, detail, advice, weight })

  // Strict-Transport-Security : force HTTPS pendant une durée donnée
  const hsts = h['strict-transport-security']
  if (!hsts) add('hsts', 'Strict-Transport-Security (HSTS)', BAD, 'Absent : un attaquant sur le réseau peut forcer une connexion non chiffrée.', 'Strict-Transport-Security: max-age=31536000; includeSubDomains')
  else {
    const age = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0)
    if (age >= 31536000) add('hsts', 'Strict-Transport-Security (HSTS)', OK, `max-age=${age} (≥ 1 an)${/includeSubDomains/i.test(hsts) ? ', sous-domaines inclus' : ''}.`)
    else add('hsts', 'Strict-Transport-Security (HSTS)', WARN, `max-age=${age} : durée courte.`, 'Viser au moins max-age=31536000 (1 an).')
  }

  // Content-Security-Policy : liste blanche des sources de scripts, styles, images… (la meilleure défense contre le XSS)
  const cspRaw = h['content-security-policy']
  let csp = null
  if (!cspRaw) add('csp', 'Content-Security-Policy (CSP)', BAD, 'Absente : rien ne limite les scripts exécutables si une faille XSS existe.', "Commencer par : default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'", 20)
  else {
    csp = parseCsp(cspRaw)
    const script = csp['script-src'] ?? csp['default-src'] ?? []
    const problems = []
    if (script.includes("'unsafe-inline'")) problems.push("'unsafe-inline' dans script-src (annule la protection contre le XSS)")
    if (script.includes("'unsafe-eval'")) problems.push("'unsafe-eval' autorisé")
    if (script.some((s) => s === '*' || s === 'https:' || s === 'http:' || s === 'data:')) problems.push('source de script trop large (*, https:, data:)')
    if (!csp['script-src'] && !csp['default-src']) problems.push('ni script-src ni default-src')
    if (!csp['object-src'] && !(csp['default-src'] ?? []).includes("'none'")) problems.push("object-src non restreint (ajouter object-src 'none')")
    if (!csp['base-uri']) problems.push("base-uri absent (ajouter base-uri 'none' ou 'self')")
    if (!problems.length) add('csp', 'Content-Security-Policy (CSP)', OK, 'Politique stricte : pas de script inline ni de source trop large.', '', 20)
    else add('csp', 'Content-Security-Policy (CSP)', WARN, `Présente mais perfectible : ${problems.join(' ; ')}.`, 'Supprimer les sources trop larges et utiliser des nonces ou des hachages à la place de unsafe-inline.', 20)
  }

  // Anti-clickjacking : empêcher qu'un autre site affiche celui-ci dans un cadre invisible
  const xfo = (h['x-frame-options'] ?? '').toUpperCase()
  if (csp?.['frame-ancestors'] || /^(DENY|SAMEORIGIN)$/.test(xfo)) add('frame', 'Anti-clickjacking', OK, csp?.['frame-ancestors'] ? `frame-ancestors ${csp['frame-ancestors'].join(' ')}` : `X-Frame-Options: ${xfo}`)
  else add('frame', 'Anti-clickjacking', BAD, "Le site peut être affiché dans une iframe d'un site pirate (clickjacking).", "frame-ancestors 'none' (CSP) ou X-Frame-Options: DENY")

  if ((h['x-content-type-options'] ?? '').toLowerCase() === 'nosniff') add('nosniff', 'X-Content-Type-Options', OK, 'nosniff : le navigateur respecte le type annoncé.', '', 5)
  else add('nosniff', 'X-Content-Type-Options', WARN, 'Absent : le navigateur peut « deviner » un type et exécuter un fichier comme un script.', 'X-Content-Type-Options: nosniff', 5)

  const rp = (h['referrer-policy'] ?? '').toLowerCase()
  if (!rp) add('referrer', 'Referrer-Policy', WARN, "Absente : l'adresse complète de la page peut fuiter vers les sites externes.", 'Referrer-Policy: strict-origin-when-cross-origin', 5)
  else if (/unsafe-url|no-referrer-when-downgrade/.test(rp)) add('referrer', 'Referrer-Policy', WARN, `${rp} : envoie trop d'informations.`, 'strict-origin-when-cross-origin ou no-referrer', 5)
  else add('referrer', 'Referrer-Policy', OK, rp, '', 5)

  if (h['permissions-policy']) add('perms', 'Permissions-Policy', OK, 'Les API sensibles (caméra, micro, géolocalisation…) sont restreintes.', '', 5)
  else add('perms', 'Permissions-Policy', WARN, 'Absente : rien ne coupe explicitement caméra, micro, géolocalisation.', 'Permissions-Policy: camera=(), microphone=(), geolocation=()', 5)

  const coop = h['cross-origin-opener-policy'], corp = h['cross-origin-resource-policy']
  if (coop || corp) add('isolation', 'Isolation (COOP / CORP)', OK, [coop && `COOP: ${coop}`, corp && `CORP: ${corp}`].filter(Boolean).join(' · '), '', 3)
  else add('isolation', 'Isolation (COOP / CORP)', INFO, 'Non défini : protège contre certaines attaques inter-fenêtres (type Spectre).', 'Cross-Origin-Opener-Policy: same-origin', 3)

  // Fuites d'information : version du serveur, framework
  const leaks = [['server', /\d/], ['x-powered-by', /./], ['x-aspnet-version', /./], ['x-generator', /./]].filter(([k, re]) => h[k] && re.test(h[k])).map(([k]) => `${k}: ${h[k]}`)
  if (leaks.length) add('leak', 'Fuite d\'informations', WARN, `Le serveur annonce sa technologie : ${leaks.join(' · ')}.`, 'Retirer ou masquer ces en-têtes : ils aident à cibler des failles connues.', 5)
  else add('leak', 'Fuite d\'informations', OK, 'Aucune version ni technologie annoncée.', '', 5)

  // CORS : qui peut lire les réponses depuis un autre site
  const acao = h['access-control-allow-origin'], acac = (h['access-control-allow-credentials'] ?? '').toLowerCase()
  if (acao === '*' && acac === 'true') add('cors', 'CORS', BAD, 'Origine * avec identifiants : configuration dangereuse (refusée par les navigateurs, mais signe d\'une erreur).', 'Lister précisément les origines autorisées.', 8)
  else if (acao === '*') add('cors', 'CORS', INFO, 'Access-Control-Allow-Origin: * (acceptable pour une API publique sans données privées).', '', 0)

  // Cookies : trois attributs à vérifier
  if (cookies.length) {
    const bad = []
    for (const c of cookies) {
      const name = c.split('=')[0].trim()
      const miss = [!/;\s*secure/i.test(c) && 'Secure', !/;\s*httponly/i.test(c) && 'HttpOnly', !/;\s*samesite=/i.test(c) && 'SameSite'].filter(Boolean)
      if (miss.length) bad.push(`${name} (manque ${miss.join(', ')})`)
    }
    if (bad.length) add('cookies', 'Cookies', WARN, `Attributs manquants : ${bad.join(' ; ')}.`, 'Secure (HTTPS seulement), HttpOnly (illisible par JavaScript), SameSite=Lax ou Strict (anti-CSRF).', 10)
    else add('cookies', 'Cookies', OK, `${cookies.length} cookie(s), tous avec Secure, HttpOnly et SameSite.`, '', 10)
  }

  // Note finale : points obtenus / points possibles
  const pts = { ok: 1, info: 0.8, warn: 0.4, bad: 0 }
  const total = checks.reduce((s, c) => s + c.weight, 0)
  const got = checks.reduce((s, c) => s + c.weight * pts[c.status], 0)
  const pct = Math.round((got / total) * 100)
  const grade = pct >= 95 ? 'A+' : pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'F'
  return { checks, pct, grade }
}
