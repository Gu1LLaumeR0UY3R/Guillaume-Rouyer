// Public : sert le CV en PDF, seulement avec un lien obtenu après les défis anti-robot (valable 2 minutes).
// Sans lien valide, on renvoie vers l'accueil où la fenêtre de défis s'ouvre.
import { fromBase64 } from './_lib/media.js'
import { validDownload } from './_lib/human.js'
import { bump, dayOf } from './_lib/stats.js'

const H = { 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Robots-Tag': 'noindex, nofollow' }

export async function onRequestGet({ request, env, waitUntil }) {
  const t = new URL(request.url).searchParams.get('t')
  if (!(await validDownload(env, t))) return new Response(null, { status: 302, headers: { Location: '/?cv=1', 'Cache-Control': 'no-store' } })
  let row
  try { row = await env.DB.prepare('SELECT data FROM cv WHERE id = 1').first() } catch (e) { console.error('cv_error', e.message) }
  if (!row) return new Response('Aucun CV pour le moment.', { status: 404, headers: { ...H, 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } })
  waitUntil?.(bump(env, dayOf(), [['click', 'cv', 1]]).catch(() => {})) // vrai téléchargement
  return new Response(fromBase64(row.data), {
    headers: { ...H, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="CV-Guillaume-Rouyer.pdf"', 'Cache-Control': 'private, no-store' },
  })
}
