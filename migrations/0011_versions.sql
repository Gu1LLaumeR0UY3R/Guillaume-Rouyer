-- Historique des versions (avant chaque écrasement) et brouillons / publications programmées.
CREATE TABLE versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('content', 'project')),
  ref TEXT NOT NULL,              -- clé du bloc ou identifiant du projet
  data TEXT NOT NULL,             -- JSON : l'état tel qu'il était
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_versions_ref ON versions (kind, ref, created_at);

-- Un brouillon par élément. publish_at renseigné = publication programmée.
CREATE TABLE drafts (
  kind TEXT NOT NULL CHECK (kind IN ('content', 'project')),
  ref TEXT NOT NULL,
  data TEXT NOT NULL,
  publish_at INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (kind, ref)
);
CREATE INDEX idx_drafts_due ON drafts (publish_at);
