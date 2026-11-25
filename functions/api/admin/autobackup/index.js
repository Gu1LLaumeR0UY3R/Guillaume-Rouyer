// Admin : sauvegardes automatiques (GET liste, POST lance un passage maintenant).
import { json, route } from '../../../_lib/http.js'
import { requireAdmin } from '../../../_lib/auth.js'
import { EVERY_DAYS, KEEP_DAYS, listRuns, runBackup } from '../../../_lib/autobackup.js'
import { log } from '../../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, POST })

async function GET(ctx) {
  await requireAdmin(ctx)
  const runs = await listRuns(ctx.env)
  return json({ runs, everyDays: EVERY_DAYS, keepDays: KEEP_DAYS, nextAt: runs.length ? runs.find((r) => r.kind === 'auto')?.at + EVERY_DAYS * 86400000 || null : null })
}

async function POST(ctx) {
  await requireAdmin(ctx)
  const r = await runBackup(ctx.env, 'manual')
  await log(ctx, 'info', 'autobackup_manual', { changed: r.changed, removed: r.removed })
  return json({ ok: true, run: r })
}
