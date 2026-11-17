// Public : réglages du site (e-mail de contact, liens, pied de page, maintenance globale). Rien de secret ici.
import { json, route } from '../_lib/http.js'
import { getSettings, publicSettings } from '../_lib/settings.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env }) {
  return json({ settings: publicSettings(await getSettings(env)) }, 200, { 'Cache-Control': 'public, max-age=10' })
}
