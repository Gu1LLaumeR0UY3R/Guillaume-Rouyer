// Public : créneaux déjà pris (demandes non fermées). Aucune donnée personnelle : seulement des dates.
// Les créneaux libres, eux, se calculent dans le navigateur à partir des réglages publics (voir _lib/availability.js).
import { json, route } from '../_lib/http.js'
import { bookableWindow } from '../_lib/availability.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env }) {
  const { from, to } = bookableWindow()
  const { results } = await env.DB.prepare("SELECT slot FROM messages WHERE slot != '' AND status != 'closed' AND slot >= ? AND slot <= ? LIMIT 300").bind(from, to).all()
  return json({ taken: results.map((r) => r.slot) }, 200, { 'Cache-Control': 'public, max-age=10' })
}
