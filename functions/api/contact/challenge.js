// Public : défi anti-robot à résoudre avant l'envoi du formulaire de contact.
import { HttpError, getIp, json, route } from '../../_lib/http.js'
import { limited, makeChallenge } from '../../_lib/contact.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env, request }) {
  if (limited(getIp(request), 'challenge', 30, 60_000)) throw new HttpError(429, 'Trop de requêtes, réessaie dans une minute')
  return json(await makeChallenge(env))
}
