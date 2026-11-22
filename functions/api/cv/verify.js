// Public : contrôle les réponses aux défis et donne un lien de téléchargement valable 2 minutes.
import { HttpError, getIp, json, readJson, route } from '../../_lib/http.js'
import { limited } from '../../_lib/contact.js'
import { verifyHuman } from '../../_lib/human.js'

export const onRequest = (ctx) => route(ctx, { POST })

async function POST({ env, request }) {
  if (limited(getIp(request), 'cvv', 15, 10 * 60_000)) throw new HttpError(429, 'Trop d\'essais : réessaie dans quelques minutes.')
  const r = await verifyHuman(env, await readJson(request, 2_000))
  return json({ ok: true, url: `/cv.pdf?t=${r.token}` }, 200, { 'Cache-Control': 'no-store' })
}
