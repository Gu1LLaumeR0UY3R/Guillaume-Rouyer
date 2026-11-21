// Public : contenu modifiable d'un bloc (ex. le tableau SpiderNet). Vide = le site garde son contenu d'origine.
import { HttpError, json, route } from '../../_lib/http.js'
import { getBlock, isBlock } from '../../_lib/content.js'
import { publishDue } from '../../_lib/versions.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env, params }) {
  if (!isBlock(params.key)) throw new HttpError(404, 'Contenu introuvable')
  await publishDue(env)
  const b = await getBlock(env, params.key)
  return json(b ?? {}, 200, { 'Cache-Control': 'public, max-age=15' })
}
