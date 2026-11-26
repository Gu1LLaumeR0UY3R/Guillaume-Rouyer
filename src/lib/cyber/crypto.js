// Outils de cryptographie partagés par les démos du labo.
// Tout passe par WebCrypto (intégré au navigateur) : aucune bibliothèque, et rien ne quitte la page.
const enc = new TextEncoder()
const dec = new TextDecoder()

export const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
export const utf8 = (s) => enc.encode(s)

// Empreinte d'un texte : algo = 'SHA-1' | 'SHA-256' | 'SHA-512'
export const sha = async (algo, text) => toHex(await crypto.subtle.digest(algo, enc.encode(text)))

// PBKDF2 : dérivation de clé lente et salée (c'est ce qu'on utilise pour stocker un mot de passe)
export async function pbkdf2(password, salt, iterations, hash = 'SHA-256') {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash }, key, 256))
}

// HMAC : signature avec une clé secrète (base du JWT HS256 et du TOTP)
export async function hmac(hash, keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, dataBytes))
}

// Base64url (variante du base64 sans + / =, utilisée par les JWT)
export const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
export const b64urlText = (text) => b64url(enc.encode(text))
export function fromB64url(s) {
  const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(s).length / 4) * 4, '='))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}
export const b64urlToText = (s) => dec.decode(fromB64url(s))

// Nombre de bits différents entre deux empreintes hexadécimales de même longueur (effet avalanche)
export function bitDiff(hexA, hexB) {
  let n = 0
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16)
    while (x) { n += x & 1; x >>= 1 }
  }
  return n
}

// Tirage aléatoire uniforme dans [0, max[ (rejet des valeurs qui fausseraient la répartition)
export function randomInt(max) {
  const lim = Math.floor(0x100000000 / max) * max
  const a = new Uint32Array(1)
  do crypto.getRandomValues(a); while (a[0] >= lim)
  return a[0] % max
}
