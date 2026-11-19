-- Lot 3b : bannissements gérés par le site (pas de domaine personnel, donc pas de pare-feu Cloudflare).
-- Une adresse IP n'est conservée que pour une règle de sécurité active, au plus 30 jours (voir la page Confidentialité).
-- Appliquer AVANT de déployer : npx wrangler d1 migrations apply portfolio-db --remote
CREATE TABLE bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('country', 'continent', 'ip')),
  value TEXT NOT NULL,                 -- code pays (FR), continent (EU) ou adresse IP
  reason TEXT NOT NULL DEFAULT '',
  auto INTEGER NOT NULL DEFAULT 0,     -- 1 = posé automatiquement par le site
  created_at INTEGER NOT NULL,
  expires_at INTEGER,                  -- NULL = sans fin (jamais pour une IP)
  UNIQUE (kind, value)
);
CREATE INDEX idx_bans_expires ON bans (expires_at);
