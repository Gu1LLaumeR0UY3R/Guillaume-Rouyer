// Public : un projet avec le contenu de sa page détaillée.
import { HttpError, json, route } from '../../_lib/http.js'
import { COLUMNS, toApi, validSlug } from '../../_lib/projects.js'
import { publishDue } from '../../_lib/versions.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env, params }) {
  await publishDue(env)
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM projects WHERE slug = ? AND status != 'hidden'`).bind(validSlug(params.slug)).first()
  if (!row) throw new HttpError(404, 'Projet introuvable')
  return json({ project: toApi(row, { details: true }) }, 200, { 'Cache-Control': 'public, max-age=30' })
}
