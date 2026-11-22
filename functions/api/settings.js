// Public : réglages du site (e-mail de contact, liens, pied de page, maintenance globale). Rien de secret ici.
import { json, route } from '../_lib/http.js'
import { getSettings, publicSettings } from '../_lib/settings.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env }) {
  const settings = publicSettings(await getSettings(env))
  try { settings.hasCv = !!(await env.DB.prepare('SELECT 1 x FROM cv WHERE id = 1').first()) } catch { settings.hasCv = false } // table absente avant la migration
  return json({ settings }, 200, { 'Cache-Control': 'public, max-age=10' })
}
