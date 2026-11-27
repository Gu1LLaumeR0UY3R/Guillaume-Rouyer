// Passe sur toutes les pages du site (les fichiers /assets/* sont exclus : voir public/_routes.json).
// Applique les bannissements, la limite de requêtes et le mode protégé. En cas de panne de la base, le site reste ouvert.
import { guard } from './_lib/bans.js'

// Catalogues « agents IA » (ARD) : le site n'en publie pas. Sans cette réponse, la redirection générale renverrait la page
// d'accueil (du HTML) à la place d'un JSON, et les outils d'audit y verraient un catalogue invalide.
const NO_CATALOG = new Set(['/.well-known/ard.json', '/.well-known/ai-catalog.json', '/ai-catalog.json', '/ard.json'])

export async function onRequest(ctx) {
  if (NO_CATALOG.has(new URL(ctx.request.url).pathname)) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  let blocked = null
  try { blocked = await guard(ctx) } catch (e) { console.error('guard_error', e.message) }
  return blocked ?? ctx.next()
}
