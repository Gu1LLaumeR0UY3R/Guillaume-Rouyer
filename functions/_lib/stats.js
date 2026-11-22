// Statistiques d'audience : compteurs agrégés par jour, sans cookie, sans adresse IP, sans identifiant de visiteur.
export const DAY_CAP = 12000 // événements acceptés par jour au maximum (protège le quota gratuit de la base)

const dayFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }) // donne AAAA-MM-JJ
export const dayOf = (ms = Date.now()) => dayFmt.format(new Date(ms))

// Robots : on les exclut des chiffres (liste volontairement large ; un visiteur sans navigateur identifiable compte comme robot).
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|preview|fetch|curl|wget|python|axios|go-http|java\/|okhttp|scrapy|httpclient|libwww|facebookexternalhit|whatsapp|telegram|discord|slack|bing|yandex|baidu|duckduck|semrush|ahrefs|mj12|petalbot|gptbot|claude|anthropic|perplexity|ccbot|bytespider/i
export function isBot(req) {
  const ua = req.headers.get('User-Agent') || ''
  if (ua.length < 20 || BOT.test(ua)) return true
  if (req.cf?.botManagement?.verifiedBot) return true
  return false
}

export function deviceOf(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablette'
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile'
  return 'ordinateur'
}

// Seules les pages réelles du site sont comptées ; le reste est regroupé sous « autre » (pas de pollution par des chemins inventés).
const PAGE = /^\/(projets(\/[a-z0-9-]{1,60}(\/[a-z0-9-]{1,40})?)?|veille(\/[a-z0-9-]{1,60})?|a-propos|contact|mentions-legales|confidentialite)?$/
export function cleanPath(p) {
  if (typeof p !== 'string' || p.length > 120) return null
  let s = p.split(/[?#]/)[0].toLowerCase()
  if (s.length > 1) s = s.replace(/\/+$/, '')
  if (s.startsWith('/admin')) return null
  return PAGE.test(s) ? s : '/(autre)'
}

// Site d'origine : seulement le nom de domaine, jamais l'adresse complète. Notre propre site compte comme navigation interne.
export function refHost(ref, ownHost) {
  if (typeof ref !== 'string' || !ref || ref.length > 300) return '(direct)'
  let h
  try { const u = new URL(ref); if (!/^https?:$/.test(u.protocol)) return '(direct)'; h = u.hostname.toLowerCase().replace(/^www\./, '') } catch { return '(direct)' }
  if (h === ownHost.replace(/^www\./, '')) return null
  return h.slice(0, 60)
}

// Compteurs à ajouter : liste de [type, clé, quantité]
export const bump = (env, day, rows) => env.DB.batch(rows.map(([kind, key, n]) =>
  env.DB.prepare('INSERT INTO stat_daily (day, kind, key, n) VALUES (?, ?, ?, ?) ON CONFLICT (day, kind, key) DO UPDATE SET n = n + excluded.n').bind(day, kind, key, n)))
