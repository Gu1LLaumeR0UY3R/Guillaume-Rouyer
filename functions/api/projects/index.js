// Public : liste des projets visibles (les projets masqués n'apparaissent pas).
import { json, route } from '../../_lib/http.js'
import { COLUMNS, toApi } from '../../_lib/projects.js'
import { publishDue } from '../../_lib/versions.js'

export const onRequest = (ctx) => route(ctx, { GET })

async function GET({ env }) {
  await publishDue(env)
  const { results } = await env.DB.prepare(`SELECT ${COLUMNS} FROM projects WHERE status != 'hidden' ORDER BY position, slug`).all()
  return json({ projects: results.map((r) => toApi(r)) }, 200, { 'Cache-Control': 'public, max-age=30' })
}
