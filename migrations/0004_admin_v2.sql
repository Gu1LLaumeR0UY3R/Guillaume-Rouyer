-- Admin v2 : alertes, infos de session, ancien statut (bascule maintenance), 2FA en attente.
-- Appliquer AVANT de déployer le nouveau code : npx wrangler d1 migrations apply portfolio-db --remote

-- Sessions : d'où et avec quoi la connexion a été faite (liste des sessions dans « Compte et sécurité »)
ALTER TABLE sessions ADD COLUMN ip TEXT;
ALTER TABLE sessions ADD COLUMN ua TEXT;
ALTER TABLE sessions ADD COLUMN country TEXT;

-- Régénération du 2FA : le nouveau secret reste ici (chiffré) tant que le premier code n'a pas été validé
ALTER TABLE admin ADD COLUMN pending_totp TEXT;

-- Interrupteur de maintenance : mémorise le statut d'avant pour le rétablir à la désactivation
ALTER TABLE projects ADD COLUMN prev_status TEXT;

-- Alertes : un événement important = une ligne (les répétitions sont regroupées avec un compteur)
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,                              -- dernière occurrence
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'critical')),
  kind TEXT NOT NULL,                               -- type d'événement (login_locked, origin_refused...)
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 1,
  dedupe_key TEXT,                                  -- même clé dans l'heure = même alerte
  is_read INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_alerts_read_id ON alerts (is_read, id);
CREATE INDEX idx_alerts_key_at ON alerts (dedupe_key, at);
