// Cookie d'audience : posé seulement avec l'accord du visiteur. Il contient un identifiant aléatoire et le jour de la première visite.
// Côté serveur, on ne garde qu'une empreinte par jour (identifiant + jour + secret) : on compte les visiteurs du jour sans pouvoir les suivre d'un jour à l'autre.
const NAME = '__Host-vid'
const LIFE = 395 * 86400 // 13 mois, durée maximale conseillée par la CNIL ; elle n'est jamais prolongée
const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export function readVisitor(cookieHeader) {
  const m = (cookieHeader || '').match(/(?:^|;\s*)__Host-vid=([a-f0-9]{16})\.(\d{8})(?:;|$)/)
  return m ? { id: m[1], first: m[2] } : null
}
export const newVisitor = (day8) => ({ id: hex(crypto.getRandomValues(new Uint8Array(8)).buffer), first: day8 })
export const visitorCookie = (v) => `${NAME}=${v.id}.${v.first}; Path=/; Max-Age=${LIFE}; Secure; HttpOnly; SameSite=Lax`
export const clearCookie = () => `${NAME}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`

let secret
async function getSecret(env) {
  if (secret) return secret
  await env.DB.prepare("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('secret.vid', ?, ?)").bind(JSON.stringify(hex(crypto.getRandomValues(new Uint8Array(32)).buffer)), Date.now()).run()
  secret = JSON.parse((await env.DB.prepare("SELECT value FROM settings WHERE key = 'secret.vid'").first()).value)
  return secret
}
export async function dayHash(env, day, id) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(`${await getSecret(env)}:${day}:${id}`))
  return hex(d).slice(0, 20)
}
