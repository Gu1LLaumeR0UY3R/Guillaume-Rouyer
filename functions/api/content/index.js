// Public : textes du site modifiés dans l'admin (accueil, à propos, compétences, parcours).
import { json, route } from '../../_lib/http.js'
import { publicContent } from '../../_lib/content.js'
import { publishDue } from '../../_lib/versions.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env }) {
  await publishDue(env)
  return json(await publicContent(env), 200, { 'Cache-Control': 'public, max-age=15' })
}
