// Passe sur toutes les pages du site (les fichiers /assets/* sont exclus : voir public/_routes.json).
// Applique les bannissements, la limite de requêtes et le mode protégé. En cas de panne de la base, le site reste ouvert.
import { guard } from './_lib/bans.js'

export async function onRequest(ctx) {
  let blocked = null
  try { blocked = await guard(ctx) } catch (e) { console.error('guard_error', e.message) }
  return blocked ?? ctx.next()
}
