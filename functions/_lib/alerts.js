// Alertes admin : un événement important = une alerte. Les répétitions (une attaque, par exemple) sont
// regroupées dans la même alerte avec un compteur, au lieu de remplir la liste.
const WINDOW = 60 * 60 * 1000 // même clé dans l'heure = même alerte
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max)

export async function raiseAlert(env, { level, kind, title, detail = '', key = kind }) {
  const now = Date.now()
  const d = clean(detail, 300)
  const existing = await env.DB.prepare('SELECT id FROM alerts WHERE dedupe_key = ? AND at > ? ORDER BY id DESC LIMIT 1').bind(key, now - WINDOW).first()
  if (existing) {
    await env.DB.prepare('UPDATE alerts SET count = count + 1, at = ?, detail = ?, is_read = 0 WHERE id = ?').bind(now, d, existing.id).run()
  } else {
    await env.DB.prepare('INSERT INTO alerts (at, level, kind, title, detail, dedupe_key) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(now, level, clean(kind, 40), clean(title, 120), d, clean(key, 80)).run()
  }
}

const where = (r) => `IP ${r.ip} (${r.country || 'pays inconnu'})`

// Règles : quel événement de journal déclenche quelle alerte. Appelé par logger.js après chaque écriture.
const RULES = {
  login_locked: (r) => ({ level: 'critical', title: 'Connexion verrouillée après trop d\'échecs', detail: where(r), key: `login_locked:${r.ip}` }),
  setup_bad_token: (r) => ({ level: 'critical', title: 'Jeton d\'installation incorrect', detail: where(r), key: `setup_bad_token:${r.ip}` }),
  setup_bad_code: (r) => ({ level: 'warn', title: 'Code 2FA incorrect pendant l\'installation', detail: where(r), key: `setup_bad_code:${r.ip}` }),
  reauth_failed: (r) => ({ level: 'critical', title: 'Échec de confirmation d\'identité avec une session admin ouverte', detail: where(r), key: `reauth_failed:${r.ip}` }),
  origin_refused: (r) => ({ level: 'warn', title: 'Requête refusée : origine inconnue', detail: `${where(r)} · ${r.path}`, key: `origin_refused:${r.ip}` }),
  unhandled: (r) => ({ level: 'warn', title: 'Erreur interne du serveur', detail: r.path, key: `unhandled:${r.path}` }),
  password_changed: () => ({ level: 'info', title: 'Mot de passe modifié', detail: 'Les autres sessions ont été fermées.', key: `password_changed:${Date.now()}` }),
  totp_changed: () => ({ level: 'info', title: 'Double authentification régénérée', detail: 'Les autres sessions ont été fermées.', key: `totp_changed:${Date.now()}` }),
}

export async function alertForLog(env, row) {
  if (row.event === 'login_failed') {
    // 3 échecs ou plus en 15 minutes depuis la même IP : tentative suspecte (le verrouillage vient à 5)
    const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM logs WHERE event = 'login_failed' AND ip = ? AND at > ?").bind(row.ip, Date.now() - 15 * 60 * 1000).first()
    if (n >= 3) await raiseAlert(env, { level: 'warn', kind: 'login_failed', title: 'Tentatives de connexion échouées', detail: where(row), key: `login_failed:${row.ip}` })
    return
  }
  const rule = RULES[row.event]
  if (rule) await raiseAlert(env, { kind: row.event, ...rule(row) })
}
