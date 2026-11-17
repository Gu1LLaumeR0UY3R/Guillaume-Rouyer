// Admin : lire et modifier les réglages globaux du site.
import { json, readJson, route } from '../../_lib/http.js'
import { requireAdmin } from '../../_lib/auth.js'
import { getSettings, parseSettings, saveSettings } from '../../_lib/settings.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { GET, PUT })

async function GET(ctx) {
  await requireAdmin(ctx)
  return json({ settings: await getSettings(ctx.env) })
}

async function PUT(ctx) {
  await requireAdmin(ctx)
  const values = parseSettings(await readJson(ctx.request))
  const before = await getSettings(ctx.env)
  await saveSettings(ctx.env, values)
  await log(ctx, 'info', 'settings_updated', { keys: Object.keys(values) })
  if (values.maintenanceOn !== undefined && values.maintenanceOn !== before.maintenanceOn) {
    await log(ctx, 'warn', values.maintenanceOn ? 'site_maintenance_on' : 'site_maintenance_off')
  }
  return json({ settings: await getSettings(ctx.env) })
}
