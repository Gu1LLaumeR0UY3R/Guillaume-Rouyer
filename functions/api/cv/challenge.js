// Public : prépare les 3 défis à résoudre avant de télécharger le CV.
import { HttpError, getIp, json, route } from '../../_lib/http.js'
import { limited } from '../../_lib/contact.js'
import { makeHuman } from '../../_lib/human.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env, request }) {
  if (limited(getIp(request), 'cvc', 20, 60_000)) throw new HttpError(429, 'Trop de requêtes, réessaie dans une minute')
  return json(await makeHuman(env), 200, { 'Cache-Control': 'no-store' })
}
