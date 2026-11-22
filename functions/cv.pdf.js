// Public : sert le CV en PDF (le fichier se remplace depuis l'administration).
import { fromBase64 } from './_lib/media.js'

const H = { 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin' }

export async function onRequestGet({ env }) {
  let row
  try { row = await env.DB.prepare('SELECT data, updated_at FROM cv WHERE id = 1').first() } catch (e) { console.error('cv_error', e.message) }
  if (!row) return new Response('Aucun CV pour le moment.', { status: 404, headers: { ...H, 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(fromBase64(row.data), {
    headers: { ...H, 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="CV-Guillaume-Rouyer.pdf"', 'Cache-Control': 'public, max-age=300' },
  })
}
