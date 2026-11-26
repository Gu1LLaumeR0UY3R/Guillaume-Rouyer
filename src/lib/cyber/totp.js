// TOTP (RFC 6238) : le code à 6 chiffres des applis d'authentification. Version pédagogique : on garde les étapes.
import { hmac } from './crypto.js'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function base32Encode(bytes) {
  let bits = '', out = ''
  for (const b of bytes) bits += b.toString(2).padStart(8, '0')
  for (let i = 0; i < bits.length; i += 5) out += ALPHA[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]
  return out
}
export function base32Decode(str) {
  let bits = ''
  for (const c of str.replace(/=+$/, '').toUpperCase()) {
    const i = ALPHA.indexOf(c)
    if (i < 0) throw new Error('base32 invalide')
    bits += i.toString(2).padStart(5, '0')
  }
  const out = []
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2))
  return Uint8Array.from(out)
}
export const newSecret = () => base32Encode(crypto.getRandomValues(new Uint8Array(20)))

// Calcule le code ET les valeurs intermédiaires, pour les montrer à l'écran
export async function totpSteps(keyBytes, timeMs, { step = 30, digits = 6 } = {}) {
  const counter = Math.floor(timeMs / 1000 / step) // le temps découpé en tranches de 30 s
  const msg = new Uint8Array(8) // le compteur sur 8 octets (grand-boutiste)
  new DataView(msg.buffer).setUint32(4, counter)
  const mac = await hmac('SHA-1', keyBytes, msg) // HMAC-SHA1(secret, compteur) : 20 octets
  const offset = mac[19] & 0x0f // « troncature dynamique » : le dernier demi-octet choisit où lire
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3]
  return { counter, mac, offset, bin, code: String(bin % 10 ** digits).padStart(digits, '0') }
}

// Vérifie un code en acceptant la tranche précédente et la suivante (horloges légèrement décalées)
export async function verifyTotp(keyBytes, code, timeMs = Date.now()) {
  for (const d of [-1, 0, 1]) if ((await totpSteps(keyBytes, timeMs + d * 30000)).code === code) return true
  return false
}
