// Public : récupère les en-têtes HTTP d'un site pour le labo cybersécurité (/cybersecurite).
// Un endpoint qui « va chercher une URL » est la cible classique des attaques SSRF : le visiteur essaie de faire
// contacter au serveur une adresse interne. Ici : HTTPS seulement, port 443, noms de domaine publics uniquement,
// redirections suivies à la main (et revalidées à chaque étape), délai court, corps de réponse jamais lu.
import { HttpError, getIp, json, route } from '../../_lib/http.js'
import { limited } from '../../_lib/contact.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET })

const MAX_REDIRECTS = 4
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i

// Accepte « exemple.fr » ou « https://exemple.fr/page ». Refuse tout ce qui ressemble à une adresse interne.
export function parseTarget(input) {
  let raw = String(input ?? '').trim()
  if (!raw || raw.length > 300) throw new HttpError(400, 'Adresse manquante ou trop longue')
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`
  let u
  try { u = new URL(raw) } catch { throw new HttpError(400, 'Adresse invalide') }
  if (u.protocol !== 'https:') throw new HttpError(400, 'Seules les adresses https:// sont analysées')
  if (u.username || u.password) throw new HttpError(400, 'Identifiants dans l\'adresse refusés')
  if (u.port && u.port !== '443') throw new HttpError(400, 'Seul le port 443 est autorisé')
  const host = u.hostname.toLowerCase().replace(/\.$/, '')
  const labels = host.split('.')
  if (host.length > 253 || labels.length < 2 || !labels.every((l) => LABEL.test(l))) throw new HttpError(400, 'Nom de domaine invalide')
  if (/^\d+(\.\d+)*$/.test(host) || host.includes(':')) throw new HttpError(400, 'Les adresses IP ne sont pas acceptées : utilise un nom de domaine')
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|test|invalid|onion)$/.test(host)) throw new HttpError(400, 'Nom de domaine interne refusé')
  u.hash = ''
  return u
}

// Nettoyage : valeurs plafonnées, sans caractères de contrôle. Le client les affiche en texte brut (jamais en HTML).
const tidy = (v) => String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, 2000)

async function GET(ctx) {
  const { request } = ctx
  if (limited(getIp(request), 'cyber-headers', 8, 60_000)) throw new HttpError(429, 'Trop d\'analyses : réessaie dans une minute.')
  let url = parseTarget(new URL(request.url).searchParams.get('url'))
  const start = url.hostname
  const chain = []
  let res
  for (let hop = 0; ; hop++) {
    try {
      res = await fetch(url.href, {
        method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Er1gon359-HeaderCheck/1.0 (+https://er1gon359.com/cybersecurite)', Accept: 'text/html,*/*;q=0.5' },
      })
    } catch { throw new HttpError(502, 'Le site n\'a pas répondu (ou son certificat HTTPS est invalide).') }
    res.body?.cancel() // on ne lit jamais le corps : seuls les en-têtes nous intéressent
    const loc = res.headers.get('Location')
    if (res.status >= 300 && res.status < 400 && loc) {
      if (hop >= MAX_REDIRECTS) throw new HttpError(502, 'Trop de redirections')
      chain.push({ status: res.status, to: tidy(loc).slice(0, 300) })
      url = parseTarget(new URL(loc, url).href) // la cible de la redirection est revalidée comme l'adresse d'origine
      continue
    }
    break
  }
  const headers = {}
  let n = 0
  for (const [k, v] of res.headers) { if (k === 'set-cookie') continue; if (n++ < 60) headers[k.toLowerCase()] = tidy(v) }
  const cookies = (res.headers.getSetCookie?.() ?? []).slice(0, 20).map(tidy)
  await log(ctx, 'info', 'cyber_headers', { host: start })
  return json({ url: url.href, status: res.status, redirects: chain, headers, cookies })
}
