// Estimation locale de la robustesse d'un mot de passe. Aucun envoi réseau : tout est calculé dans la page.
import { randomInt } from './crypto.js'

// Petit échantillon des mots de passe les plus utilisés (les vraies listes en contiennent des millions)
export const COMMON = ('123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon 123123 baseball abc123 football monkey letmein shadow master 666666 qwertyuiop 123321 mustang 1234567890 michael 654321 superman 1qaz2wsx 7777777 121212 000000 qazwsx 123qwe killer trustno1 jordan jennifer zxcvbnm asdfgh hunter buster soccer harley batman andrew tigger sunshine iloveyou 2000 charlie robert thomas hockey ranger daniel starwars klaster 112233 george computer michelle jessica pepper 1111 zxcvbn 555555 11111111 131313 freedom 777777 pass maggie 159753 aaaaaa ginger princess joshua cheese amanda summer love ashley nicole chelsea biteme matthew access yankees 987654321 dallas austin thunder taylor matrix azerty azertyuiop motdepasse bonjour marseille doudou soleil chocolat loulou').split(' ')

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' }
const SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'azertyuiop', 'qsdfghjklm', 'wxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm']

// Détecte les motifs qui rendent un mot de passe prévisible (chaque motif est un « raccourci » pour l'attaquant)
export function findPatterns(pw) {
  const out = []
  const low = pw.toLowerCase()
  // On retire d'abord les chiffres/symboles de fin (« soleil2024 » = « soleil » + chiffres), PUIS on annule les remplacements (@ → a, 0 → o…)
  const base = low.replace(/[\d!@#$%^&*._-]+$/, '')
  const unleet = (x) => [...x].map((c) => LEET[c] ?? c).join('').replace(/[^a-z0-9]/g, '')
  if ([low, unleet(low), base, unleet(base)].some((w) => w.length >= 3 && COMMON.includes(w))) out.push({ id: 'common', text: 'ressemble à un mot de passe très courant (même avec des chiffres ou des remplacements comme a→@)' })
  if (/(.)\1{2,}/.test(pw)) out.push({ id: 'repeat', text: 'contient des caractères répétés (aaa, 111…)' })
  seq: for (const s of SEQUENCES) { // une seule alerte « suite évidente », même si plusieurs suites sont présentes
    for (let i = 0; i + 4 <= s.length; i++) {
      const frag = s.slice(i, i + 4)
      if (low.includes(frag) || low.includes([...frag].reverse().join(''))) { out.push({ id: 'seq', text: `contient une suite évidente (« ${frag} »)` }); break seq }
    }
  }
  if (/(19|20)\d{2}/.test(pw)) out.push({ id: 'year', text: 'contient une année (très fréquent, donc testé en premier)' })
  return out
}

export function estimate(pw) {
  if (!pw) return null
  // Taille de l'alphabet utilisé : plus il est grand, plus chaque caractère « pèse » en bits
  let pool = 0
  if (/[a-z]/.test(pw)) pool += 26
  if (/[A-Z]/.test(pw)) pool += 26
  if (/\d/.test(pw)) pool += 10
  if (/[ -/:-@[-`{-~]/.test(pw)) pool += 33
  if (/[^\x00-\x7F]/.test(pw)) pool += 100
  const raw = pw.length * Math.log2(pool || 1)
  const patterns = findPatterns(pw)
  let bits = raw
  // Phrase ou mot en langage naturel : une lettre apporte ~2 bits (pas log2(26)), car les mots sont prévisibles. Estimation prudente.
  if (/^[a-z\s-]{8,}$/i.test(pw)) bits = Math.min(bits, pw.length * 2.2)
  const ids = patterns.map((p) => p.id)
  if (ids.includes('common')) bits = Math.min(bits, 12) // ~4 000 essais : instantané (les autres pénalités ne s'additionnent pas)
  else {
    if (ids.includes('seq')) bits -= 12
    if (ids.includes('repeat')) bits -= 8
    if (ids.includes('year')) bits -= 6
  }
  bits = Math.max(1, bits)
  // Temps moyen = la moitié de l'espace de recherche, divisé par la vitesse de l'attaquant
  const speeds = [
    { id: 'online', label: 'Attaque en ligne (site qui limite les essais)', perSec: 100 },
    { id: 'fast', label: 'Hors ligne, hachage rapide (SHA-256, GPU)', perSec: 1e10 },
    { id: 'slow', label: 'Hors ligne, hachage lent (bcrypt / Argon2)', perSec: 1e4 },
  ].map((s) => ({ ...s, seconds: 2 ** (bits - 1) / s.perSec }))
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4
  return { raw, bits, pool, patterns, speeds, score, label: ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'][score] }
}

export function humanTime(sec) {
  if (sec < 1) return 'instantané'
  const units = [['seconde', 1, 60], ['minute', 60, 60], ['heure', 3600, 24], ['jour', 86400, 365], ['an', 31557600, 1000], ['millénaire', 31557600000, 1e6]]
  if (sec >= 31557600e9) return 'plus que l\'âge de l\'univers'
  for (let i = units.length - 1; i >= 0; i--) {
    const [name, size] = units[i]
    if (sec >= size) { const n = Math.floor(sec / size); return `${n.toLocaleString('fr-FR')} ${name}${n > 1 ? 's' : ''}` }
  }
}

// Générateur : tirage uniforme avec l'aléa du navigateur (crypto.getRandomValues), pas Math.random()
export function generate(len, { lower = true, upper = true, digits = true, symbols = true } = {}) {
  const sets = [lower && 'abcdefghijkmnopqrstuvwxyz', upper && 'ABCDEFGHJKLMNPQRSTUVWXYZ', digits && '23456789', symbols && '!@#$%^&*-_=+?'].filter(Boolean)
  if (!sets.length) return ''
  const all = sets.join('')
  const chars = sets.map((s) => s[randomInt(s.length)]) // au moins un caractère de chaque famille choisie
  while (chars.length < len) chars.push(all[randomInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]] } // mélange de Fisher-Yates
  return chars.slice(0, len).join('')
}
