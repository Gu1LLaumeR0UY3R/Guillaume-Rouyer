// Admin : une sauvegarde automatique.
//  GET            -> éléments enregistrés ce jour-là
//  GET ?key=…     -> contenu d'un élément à cette date, avec son état actuel (pour comparer)
//  GET ?download=1 -> état complet du site à cette date, en fichier JSON
//  POST { key }   -> remet cet élément dans l'état de cette date
import { HttpError, json, readJson, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { collect, itemAt, restoreItem, runDetail, stateAt } from '../../../_lib/autobackup.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })
const idOf = (ctx) => { if (!/^\d{1,12}$/.test(ctx.params.id)) throw new HttpError(404, 'Sauvegarde introuvable'); return Number(ctx.params.id) }
const parse = (t) => { try { return JSON.parse(t) } catch { return t } }

async function GET(ctx) {
  await requireAdmin(ctx)
  const id = idOf(ctx)
  const url = new URL(ctx.request.url)
  const detail = await runDetail(ctx.env, id)
  if (url.searchParams.get('download')) {
    const state = await stateAt(ctx.env, id)
    const day = new Date(detail.run.at).toISOString().slice(0, 10)
    const out = { format: 'portfolio-autobackup', version: 1, at: new Date(detail.run.at).toISOString(), items: Object.fromEntries([...state].map(([k, v]) => [k, parse(v)])) }
    await log(ctx, 'info', 'autobackup_downloaded', { id })
    return json(out, 200, { 'Content-Disposition': `attachment; filename="sauvegarde-auto-${day}.json"` })
  }
  const key = url.searchParams.get('key')
  if (key) {
    const [then, now] = await Promise.all([itemAt(ctx.env, id, key), collect(ctx.env).then((m) => m.get(key) ?? null)])
    return json({ key, then: then === null ? null : parse(then), now: now === null ? null : parse(now) })
  }
  return json(detail)
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const id = idOf(ctx)
  const { key } = await readJson(ctx.request)
  if (typeof key !== 'string' || key.length > 120) throw new HttpError(400, 'Élément invalide')
  await restoreItem(ctx.env, id, key)
  await log(ctx, 'warn', 'autobackup_restored', { id, key })
  return json({ ok: true })
}
