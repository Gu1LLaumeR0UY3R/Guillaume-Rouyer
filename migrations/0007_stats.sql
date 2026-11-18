-- Lot 3 : statistiques d'audience sans cookie. Uniquement des compteurs agrégés par jour : aucune adresse IP,
-- aucun identifiant de visiteur, aucune ligne par visite.
-- Appliquer AVANT de déployer : npx wrangler d1 migrations apply portfolio-db --remote
CREATE TABLE stat_daily (
  day TEXT NOT NULL,      -- jour (heure de Paris), ex. 2026-11-18
  kind TEXT NOT NULL,     -- view, country, continent, device, ref, theme, click, tree, time_sum, time_cnt, events
  key TEXT NOT NULL,      -- page, code pays, type d'appareil, site d'origine...
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, key)
) WITHOUT ROWID;
CREATE INDEX idx_stat_kind_day ON stat_daily (kind, day);
