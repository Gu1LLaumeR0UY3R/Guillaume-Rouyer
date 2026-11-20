// Formulaire de contact : défi anti-robot (preuve de travail signée), vérification de l'e-mail, limites.
// Aucun service tiers, aucun cookie, aucune adresse IP enregistrée avec le message.
import { HttpError } from './http.js'

const MAX_NUMBER = 60_000 // difficulté : ~30 000 calculs en moyenne, environ une seconde sur un téléphone
const MIN_AGE = 2_000 // un défi ne peut pas être rendu avant 2 s
const MAX_AGE = 10 * 60_000 // ni après 10 min
const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)).buffer)

// Clé de signature des défis : générée une fois et gardée dans la base (jamais exposée)
async function key(env) {
  await env.DB.prepare("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('secret.pow', ?, ?)").bind(JSON.stringify(randomHex(32)), Date.now()).run()
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'secret.pow'").first()
  return crypto.subtle.importKey('raw', enc.encode(JSON.parse(row.value)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
const sign = async (k, text) => hex(await crypto.subtle.sign('HMAC', k, enc.encode(text)))

export async function makeChallenge(env) {
  const k = await key(env)
  const salt = `${randomHex(12)}.${Date.now()}`
  const number = crypto.getRandomValues(new Uint32Array(1))[0] % MAX_NUMBER
  const challenge = await sha256(salt + number)
  return { salt, challenge, maxnumber: MAX_NUMBER, signature: await sign(k, challenge + salt) }
}

// Vérifie la solution envoyée (texte base64 d'un JSON) ; un défi ne sert qu'une fois.
export async function verifyPow(env, payload) {
  const fail = () => new HttpError(400, 'Vérification anti-robot échouée : recharge la page et réessaie.')
  let p
  try { p = JSON.parse(atob(String(payload))) } catch { throw fail() }
  const { salt, number, challenge, signature } = p ?? {}
  if (typeof salt !== 'string' || typeof challenge !== 'string' || typeof signature !== 'string' || !Number.isInteger(number) || number < 0 || number >= MAX_NUMBER) throw fail()
  const issued = Number(salt.split('.')[1])
  const age = Date.now() - issued
  if (!Number.isFinite(issued) || age < MIN_AGE || age > MAX_AGE) throw fail()
  const k = await key(env)
  if ((await sign(k, challenge + salt)) !== signature) throw fail()
  if ((await sha256(salt + number)) !== challenge) throw fail()
  const r = await env.DB.prepare('INSERT INTO pow_used (salt, expires_at) VALUES (?, ?) ON CONFLICT DO NOTHING').bind(salt, issued + MAX_AGE).run()
  if (!r.meta?.changes) throw fail() // défi déjà utilisé
}

// --- E-mail ---
export const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}$/
const DISPOSABLE = new Set(('mailinator.com guerrillamail.com guerrillamail.net guerrillamail.org sharklasers.com grr.la 10minutemail.com 10minutemail.net tempmail.com temp-mail.org temp-mail.io ' +
  'throwawaymail.com yopmail.com yopmail.fr yopmail.net trashmail.com trashmail.net getnada.com nada.email dispostable.com maildrop.cc mailnesia.com mintemail.com ' +
  'fakeinbox.com spamgourmet.com tempinbox.com emailondeck.com mohmal.com burnermail.io mytemp.email tempr.email discard.email moakt.com tmpmail.org tmpmail.net ' +
  'getairmail.com anonbox.net mailcatch.com spambox.us 33mail.com fakemail.net inboxkitten.com harakirimail.com tempail.com emailfake.com crazymailing.com ' +
  'mail.tm mailpoof.com byom.de wegwerfmail.de einrot.com trbvm.com cuvox.de dayrep.com armyspy.com rhyta.com superrito.com teleworm.us jourrapide.com gustr.com').split(' '))

// Vérifie l'adresse : forme, domaine jetable, domaine qui existe vraiment (enregistrement MX ou A, via DNS public).
// Si le service DNS ne répond pas, on accepte : mieux vaut un message de trop qu'un vrai message refusé.
export async function checkEmail(email) {
  if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, 'Adresse e-mail invalide')
  const domain = email.split('@')[1].toLowerCase()
  if (DISPOSABLE.has(domain)) throw new HttpError(400, 'Les adresses e-mail jetables ne sont pas acceptées')
  const ask = async (type) => {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(2500) })
    if (!r.ok) return null
    return r.json()
  }
  try {
    const mx = await ask('MX')
    if (!mx) return
    if (mx.Status === 3) throw new HttpError(400, "Ce nom de domaine n'existe pas : vérifie ton adresse e-mail")
    if (mx.Answer?.some((a) => a.type === 15)) return
    const a = await ask('A')
    if (a && a.Status === 3) throw new HttpError(400, "Ce nom de domaine n'existe pas : vérifie ton adresse e-mail")
    if (a && !a.Answer?.length && !mx.Answer?.length) throw new HttpError(400, "Ce domaine ne peut pas recevoir d'e-mails : vérifie ton adresse")
  } catch (e) {
    if (e instanceof HttpError) throw e
    /* DNS injoignable : on accepte */
  }
}

// --- Limites (en mémoire, rien d'enregistré) ---
const hits = new Map()
export function limited(ip, scope, max, windowMs) {
  const now = Date.now(), k = `${scope}:${ip}`, h = hits.get(k)
  if (!h || now - h.t > windowMs) { hits.set(k, { t: now, n: 1 }); if (hits.size > 5000) hits.clear(); return false }
  h.n++
  return h.n > max
}

// --- Champs ---
const tidy = (v) => String(v ?? '').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').replace(/\r\n?/g, '\n').trim()
export function parseMessage(b) {
  const f = (v, min, max, label) => {
    const t = tidy(v)
    if (t.length < min) throw new HttpError(400, min > 0 ? `${label} : ${min} caractères au minimum` : `${label} manquant`)
    if (t.length > max) throw new HttpError(400, `${label} : ${max} caractères au maximum`)
    return t
  }
  const name = f(b.name, 2, 80, 'Nom'), email = f(b.email, 3, 254, 'E-mail').toLowerCase(), subject = f(b.subject, 0, 120, 'Sujet').replace(/\n/g, ' '), body = f(b.message, 10, 4000, 'Message')
  if ((body.match(/https?:\/\//gi) ?? []).length > 3) throw new HttpError(400, 'Trop de liens dans le message')
  return { name: name.replace(/\n/g, ' '), email, subject, body }
}
