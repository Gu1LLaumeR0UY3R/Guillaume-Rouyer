// JWT : trois morceaux séparés par des points : en-tête . contenu (payload) . signature.
// En-tête et contenu sont du JSON en base64url : lisibles par tout le monde. Seule la signature protège.
import { b64url, b64urlText, b64urlToText, hmac, utf8 } from './crypto.js'

// Découpe et décode un jeton. Ne vérifie RIEN : décoder n'est pas authentifier.
export function decodeJwt(token) {
  const parts = String(token).trim().split('.')
  if (parts.length !== 3) throw new Error('Un JWT contient exactement 3 morceaux séparés par des points.')
  try {
    return { header: JSON.parse(b64urlToText(parts[0])), payload: JSON.parse(b64urlToText(parts[1])), signature: parts[2], parts }
  } catch { throw new Error('En-tête ou contenu illisible (base64url + JSON attendus).') }
}

// Fabrique un jeton signé en HS256 (HMAC-SHA256) avec le secret donné
export async function signHs256(header, payload, secret) {
  const data = `${b64urlText(JSON.stringify(header))}.${b64urlText(JSON.stringify(payload))}`
  return `${data}.${b64url(await hmac('SHA-256', utf8(secret), utf8(data)))}`
}

// Comparaison à temps constant : évite qu'on devine la signature octet par octet en mesurant les temps de réponse
function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

// Vérificateur STRICT : l'algorithme attendu est fixé par le serveur, jamais lu dans le jeton.
export async function verifyStrict(token, secret, now = Date.now()) {
  let d
  try { d = decodeJwt(token) } catch (e) { return { ok: false, why: e.message } }
  if (d.header.alg !== 'HS256') return { ok: false, why: `Algorithme « ${d.header.alg} » refusé : seul HS256 est accepté.` }
  const expected = b64url(await hmac('SHA-256', utf8(secret), utf8(`${d.parts[0]}.${d.parts[1]}`)))
  if (!safeEqual(expected, d.signature)) return { ok: false, why: 'Signature invalide : le contenu a été modifié ou le secret est différent.' }
  if (typeof d.payload.exp === 'number' && d.payload.exp * 1000 < now) return { ok: false, why: 'Jeton expiré (exp dépassé).' }
  return { ok: true, why: 'Signature valide.' }
}

// Vérificateur NAÏF (celui des vieilles bibliothèques) : il fait confiance à l'algorithme annoncé dans le jeton.
// C'est la faille « alg: none » : l'attaquant se déclare « sans signature » et le serveur le croit.
export async function verifyNaive(token, secret) {
  let d
  try { d = decodeJwt(token) } catch (e) { return { ok: false, why: e.message } }
  if (String(d.header.alg).toLowerCase() === 'none') return { ok: true, why: 'alg « none » : aucune signature à vérifier… le jeton est accepté !' }
  return verifyStrict(token, secret)
}

// Fabrique un jeton « alg: none » (attaque) : signature vide
export const forgeNone = (payload) => `${b64urlText(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64urlText(JSON.stringify(payload))}.`
