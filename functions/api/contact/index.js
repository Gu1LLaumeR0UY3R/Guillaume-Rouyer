// Public : envoi d'un message via le formulaire de contact. Le message n'est lu que dans l'admin.
import { HttpError, getIp, json, readJson, route } from '../../_lib/http.js'
import { checkEmail, limited, parseMessage, verifyPow } from '../../_lib/contact.js'
import { newId } from '../../_lib/media.js'
import { raiseAlert } from '../../_lib/alerts.js'
import { log } from '../../_lib/logger.js'

export const onRequest = (ctx) => route(ctx, { POST })

const DAILY_CAP = 40 // au-delà, le formulaire se ferme jusqu'au lendemain (protège la base contre un envoi massif)

async function POST(ctx) {
  const { env, request } = ctx
  const b = await readJson(request, 12_000)
  // Piège : ce champ est caché aux humains. S'il est rempli, c'est un robot : on répond « envoyé » sans rien enregistrer.
  if (typeof b.website === 'string' && b.website.trim()) return json({ ok: true })

  const ip = getIp(request)
  const refuse = async (status, msg, why) => { await log(ctx, 'warn', 'contact_refused', { why }); throw new HttpError(status, msg) }
  // Essais (échecs compris) : 12 par 10 min. Messages réellement enregistrés : 3 par 10 min (voir plus bas).
  if (limited(ip, 'try', 12, 10 * 60_000)) await refuse(429, 'Trop d\'essais : réessaie dans quelques minutes.', 'rate')

  const m = parseMessage(b)
  try { await verifyPow(env, b.pow) } catch (e) { await refuse(e.status, e.message, 'pow') }
  await checkEmail(m.email)

  const now = Date.now()
  const today = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE created_at > ?').bind(now - 86400000).first()
  if (today.n >= DAILY_CAP) {
    await raiseAlert(env, { level: 'warn', kind: 'contact_cap', title: 'Formulaire de contact fermé pour aujourd\'hui', detail: `${DAILY_CAP} messages reçus en 24 h`, key: 'contact_cap' })
    throw new HttpError(429, 'Trop de messages reçus aujourd\'hui : réessaie demain ou écris directement par e-mail.')
  }
  const dup = await env.DB.prepare('SELECT 1 FROM messages WHERE email = ? AND body = ? AND created_at > ? LIMIT 1').bind(m.email, m.body, now - 86400000).first()
  if (!dup) {
    if (limited(ip, 'send', 3, 10 * 60_000)) await refuse(429, 'Tu as déjà envoyé plusieurs messages : réessaie dans quelques minutes.', 'rate_send')
    await env.DB.prepare('INSERT INTO messages (id, name, email, subject, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(newId(), m.name, m.email, m.subject, m.body, now, now).run()
  }
  return json({ ok: true })
}
