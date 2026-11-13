// Passe sur TOUTES les routes /api : contrôle d'origine (anti-CSRF) et gestion centralisée des erreurs.
import { HttpError, json, sameOrigin } from '../_lib/http.js'
import { log } from '../_lib/logger.js'

export async function onRequest(ctx) {
  try {
    if (!['GET', 'HEAD'].includes(ctx.request.method) && !sameOrigin(ctx.request)) {
      await log(ctx, 'security', 'origin_refused', { origin: ctx.request.headers.get('Origin') })
      return json({ error: 'Origine refusée' }, 403)
    }
    return await ctx.next()
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    await log(ctx, 'error', 'unhandled', { message: e.message }).catch(() => {})
    return json({ error: 'Erreur interne' }, 500) // jamais de détail technique côté visiteur
  }
}
