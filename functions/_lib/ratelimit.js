// Limitation des tentatives de connexion + nettoyage des vieilles données.
const WINDOW = 15 * 60 * 1000

export async function loginLocked(env, ip) {
  const since = Date.now() - WINDOW
  const mine = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND at > ? AND ok = 0').bind(ip, since).first()
  const all = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE at > ? AND ok = 0').bind(since).first()
  return mine.n >= 5 || all.n >= 40 // 5 échecs par IP, ou 40 échecs au total (attaque répartie sur plusieurs IP)
}
export const recordAttempt = (env, ip, ok) =>
  env.DB.prepare('INSERT INTO login_attempts (ip, at, ok) VALUES (?, ?, ?)').bind(ip, Date.now(), ok ? 1 : 0).run()

// Conservation : journaux 30 jours (cohérent avec la page confidentialité), tentatives 1 jour, sessions expirées.
export async function purgeOld(env) {
  const now = Date.now()
  await env.DB.batch([
    env.DB.prepare('DELETE FROM logs WHERE at < ?').bind(now - 30 * 86400000),
    env.DB.prepare('DELETE FROM login_attempts WHERE at < ?').bind(now - 86400000),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM alerts WHERE is_read = 1 AND at < ?').bind(now - 90 * 86400000), // alertes lues : 90 jours
  ])
}
