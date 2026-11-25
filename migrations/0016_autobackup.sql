-- Sauvegarde automatique incrémentale : chaque passage n'enregistre que ce qui a changé depuis le précédent.
-- Un élément supprimé laisse une « pierre tombale » (data NULL). L'état à une date = dernière version de chaque élément jusque-là.
CREATE TABLE backup_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('auto', 'manual')),
  changed INTEGER NOT NULL DEFAULT 0,   -- éléments nouveaux ou modifiés
  removed INTEGER NOT NULL DEFAULT 0,   -- éléments supprimés depuis le passage précédent
  total INTEGER NOT NULL DEFAULT 0      -- éléments présents à cette date
);
CREATE INDEX idx_backup_runs_at ON backup_runs (at);
CREATE TABLE backup_items (
  run_id INTEGER NOT NULL,
  key TEXT NOT NULL,                    -- content:<clé> | project:<slug> | article:<slug> | topic:<slug> | settings
  hash TEXT NOT NULL,
  data TEXT,
  PRIMARY KEY (run_id, key)
);
CREATE INDEX idx_backup_items_key ON backup_items (key, run_id);
