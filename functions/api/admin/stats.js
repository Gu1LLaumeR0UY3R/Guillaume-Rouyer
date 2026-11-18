// Admin : statistiques d'audience sur 7, 30 ou 90 jours, avec comparaison à la période précédente.
import { json, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { dayOf } from '../../_lib/stats.js'
import { int } from '../../_lib/validate.js'

export const onRequest = (ctx) => route(ctx, { GET })

const DAY = 86400000
async function GET(ctx) {
  await requireAdmin(ctx)
  const days = int(new URL(ctx.request.url).searchParams.get('days'), { min: 1, max: 90, def: 30, name: 'période' })
  if (![7, 30, 90].includes(days)) return json({ error: 'Période : 7, 30 ou 90 jours' }, 400)
  const now = Date.now()
  const list = Array.from({ length: days }, (_, i) => dayOf(now - (days - 1 - i) * DAY)) // du plus ancien à aujourd'hui
  const prevStart = dayOf(now - (2 * days - 1) * DAY)
  const { results } = await ctx.env.DB.prepare('SELECT day, kind, key, n FROM stat_daily WHERE day >= ?').bind(prevStart).all()

  const cur = new Set(list)
  const by = (kind) => {
    const m = new Map()
    for (const r of results) if (r.kind === kind && cur.has(r.day)) m.set(r.key, (m.get(r.key) ?? 0) + r.n)
    return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n)
  }
  const perDay = (kind) => list.map((d) => results.filter((r) => r.kind === kind && r.day === d).reduce((a, r) => a + r.n, 0))
  const total = (kind, inCur) => results.filter((r) => r.kind === kind && cur.has(r.day) === inCur).reduce((a, r) => a + r.n, 0)

  const timeSum = new Map(by('time_sum').map((x) => [x.key, x.n])), timeCnt = new Map(by('time_cnt').map((x) => [x.key, x.n]))
  const sumAll = [...timeSum.values()].reduce((a, n) => a + n, 0), cntAll = [...timeCnt.values()].reduce((a, n) => a + n, 0)
  return json({
    days: list,
    views: perDay('view'), trees: perDay('tree'),
    totals: {
      views: total('view', true), viewsBefore: total('view', false),
      trees: total('tree', true), treesBefore: total('tree', false),
      clicks: total('click', true), clicksBefore: total('click', false),
      avgSeconds: cntAll ? Math.round(sumAll / cntAll) : 0,
      countries: by('country').filter((c) => c.key !== 'XX').length,
    },
    pages: by('view').map((p) => ({ ...p, avgSeconds: timeCnt.get(p.key) ? Math.round(timeSum.get(p.key) / timeCnt.get(p.key)) : null })),
    countries: by('country'), continents: by('continent'), referrers: by('ref'), devices: by('device'), themes: by('theme'), clicks: by('click'),
    capToday: results.find((r) => r.kind === 'events' && r.day === dayOf(now))?.n ?? 0,
  })
}
