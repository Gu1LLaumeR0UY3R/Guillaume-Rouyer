// Codes à 6 chiffres (TOTP, RFC 6238) compatibles Google Authenticator, Aegis, 2FAS, etc.
import { safeEqual } from './crypto.js'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(bytes) {
  let bits = 0, value = 0, out = ''
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5 }
    value &= (1 << bits) - 1
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}
export function base32Decode(str) {
  let bits = 0, value = 0
  const out = []
  for (const ch of str.replace(/=+$/, '').toUpperCase()) {
    const i = ALPHABET.indexOf(ch)
    if (i < 0) throw new Error('base32 invalide')
    value = (value << 5) | i; bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
    value &= (1 << bits) - 1
  }
  return new Uint8Array(out)
}

async function hotp(keyBytes, counter) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const buf = new ArrayBuffer(8), dv = new DataView(buf)
  dv.setUint32(0, Math.floor(counter / 2 ** 32)); dv.setUint32(4, counter >>> 0)
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf))
  const o = h[19] & 15
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, '0')
}

export const generateSecret = () => base32Encode(crypto.getRandomValues(new Uint8Array(20)))
export const otpauthUri = (secret, label = 'admin', issuer = 'Portfolio Er1gon359') =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`

// Renvoie le numéro de tranche de 30 s du code valide, ou null.
// Tolère ±1 tranche (décalage d'horloge) et refuse un code déjà utilisé (lastStep) : anti-rejeu.
export async function verifyTotp(secret, code, lastStep = 0, now = Date.now()) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null
  const key = base32Decode(secret), step = Math.floor(now / 30000)
  let found = null
  for (const d of [-1, 0, 1]) {
    const s = step + d
    if (s > lastStep && safeEqual(await hotp(key, s), code)) found = s
  }
  return found
}
