// Outils de cryptographie (WebCrypto, disponible dans Cloudflare Workers).
const enc = new TextEncoder()
const dec = new TextDecoder()

export const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
export const toB64 = (buf) => { let s = ''; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b); return btoa(s) }
export const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))
export const randomToken = (n = 32) => toHex(randomBytes(n))
export const sha256Hex = async (s) => toHex(await crypto.subtle.digest('SHA-256', enc.encode(s)))

// Comparaison en temps constant (évite de deviner un secret caractère par caractère via le temps de réponse).
export function safeEqual(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b))
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
}

// Cloudflare Workers plafonne PBKDF2 à 100 000 itérations.
// On compense avec un « poivre » secret (APP_SECRET, hors base de données) + 2FA + limitation des tentatives.
export const PBKDF2_ITERATIONS = 100_000
export const newSalt = () => toB64(randomBytes(16))
export async function hashPassword(password, salt, pepper) {
  const pre = await hmacHex(pepper, password)
  const key = await crypto.subtle.importKey('raw', enc.encode(pre), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(salt), iterations: PBKDF2_ITERATIONS }, key, 256)
  return toHex(bits)
}

// Chiffrement AES-GCM d'un texte (pour le secret 2FA stocké en base).
async function aesKey(secret) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('aes:' + secret))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
}
export async function encryptText(plain, secret) {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), enc.encode(plain))
  return `${toB64(iv)}.${toB64(ct)}`
}
export async function decryptText(blob, secret) {
  const [iv, ct] = blob.split('.')
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await aesKey(secret), fromB64(ct)))
}
