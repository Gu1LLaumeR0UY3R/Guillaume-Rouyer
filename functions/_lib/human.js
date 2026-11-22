// Trois petits défis « humains » avant de télécharger le CV : un calcul, un choix d'image, un curseur.
// Sans état : les questions sont recalculées par le serveur à partir d'un nombre aléatoire signé, les réponses ne sont jamais envoyées au navigateur.
import { HttpError } from './http.js'
import { randomHex, sign, signingKey } from './contact.js'

const MIN_AGE = 3_000          // trop rapide = robot
const MAX_AGE = 10 * 60_000
const DL_TTL = 2 * 60_000      // durée de validité du lien de téléchargement
const NUMS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']
const WORDS = {
  'un fruit': [['🍎', 'pomme'], ['🍌', 'banane'], ['🍇', 'raisin'], ['🍓', 'fraise'], ['🍐', 'poire']],
  'un animal': [['🐶', 'chien'], ['🐱', 'chat'], ['🐴', 'cheval'], ['🐟', 'poisson'], ['🐢', 'tortue']],
  'un moyen de transport': [['🚗', 'voiture'], ['🚲', 'vélo'], ['✈️', 'avion'], ['🚂', 'train'], ['🚢', 'bateau']],
  'un outil': [['🔨', 'marteau'], ['🔧', 'clé'], ['✂️', 'ciseaux'], ['📏', 'règle'], ['🪓', 'hache']],
}

const toBytes = (h) => Uint8Array.from(h.match(/../g), (x) => parseInt(x, 16))

// Construit les 3 défis (questions + bonnes réponses) à partir de 32 octets pseudo-aléatoires.
function build(bytes) {
  let i = 0
  const next = (n) => bytes[i++] % n
  const a = 2 + next(8), b = 2 + next(8)
  const minus = next(2) === 1 && a > b
  const calc = { type: 'calc', text: `Combien font ${NUMS[a]} ${minus ? 'moins' : 'plus'} ${NUMS[b]} ?` }
  const calcAns = String(minus ? a - b : a + b)

  const cats = Object.keys(WORDS)
  const cat = cats[next(cats.length)]
  const good = WORDS[cat][next(5)]
  const others = cats.filter((c) => c !== cat)
  const opts = [good, ...others.map((c) => WORDS[c][next(5)])]
  for (let j = opts.length - 1; j > 0; j--) { const k = next(j + 1); [opts[j], opts[k]] = [opts[k], opts[j]] }
  const pick = { type: 'pick', text: `Lequel est ${cat} ?`, options: opts.map(([emoji, label]) => ({ emoji, label })) }

  const target = 10 + 5 * next(17) // 10 à 90
  const slide = { type: 'slide', text: `Place le curseur sur ${target}.`, min: 0, max: 100, step: 5 }
  return { questions: [calc, pick, slide], answers: [calcAns, good[1], String(target)] }
}

async function derive(env, nonce) {
  return build(toBytes(await sign(await signingKey(env), `cvq.${nonce}`)))
}

export async function makeHuman(env) {
  const nonce = randomHex(12), iat = Date.now()
  const k = await signingKey(env)
  const { questions } = await derive(env, nonce)
  return { nonce, iat, sig: await sign(k, `cvh.${nonce}.${iat}`), questions }
}

// Vérifie les réponses ; chaque série de défis ne sert qu'une fois (réussie ou non). Renvoie un jeton de téléchargement.
export async function verifyHuman(env, b) {
  const fail = () => new HttpError(400, 'Un défi est incorrect. De nouveaux défis ont été préparés, réessaie.')
  const { nonce, iat, sig, answers } = b ?? {}
  if (typeof nonce !== 'string' || !/^[a-f0-9]{24}$/.test(nonce) || !Number.isInteger(iat) || typeof sig !== 'string' || !Array.isArray(answers) || answers.length !== 3) throw fail()
  const age = Date.now() - iat
  if (age < MIN_AGE || age > MAX_AGE) throw fail()
  const k = await signingKey(env)
  if ((await sign(k, `cvh.${nonce}.${iat}`)) !== sig) throw fail()
  const used = await env.DB.prepare('INSERT INTO pow_used (salt, expires_at) VALUES (?, ?) ON CONFLICT DO NOTHING').bind(`cv.${nonce}`, iat + MAX_AGE).run()
  if (!used.meta?.changes) throw fail()
  const { answers: good } = await derive(env, nonce)
  const norm = (v) => String(v ?? '').trim().toLowerCase()
  if (!good.every((g, n) => norm(answers[n]) === g)) throw fail()
  const exp = Date.now() + DL_TTL
  return { token: `${exp}.${await sign(k, `cvd.${exp}`)}`, expiresIn: DL_TTL }
}

export async function validDownload(env, t) {
  const m = /^(\d{13})\.([a-f0-9]{64})$/.exec(String(t ?? ''))
  if (!m || Number(m[1]) < Date.now()) return false
  return (await sign(await signingKey(env), `cvd.${m[1]}`)) === m[2]
}
