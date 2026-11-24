-- Corbeille : un projet ou un article supprimé est gardé 30 jours (copie complète en JSON) avant d'être effacé pour de bon.
CREATE TABLE trash (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('project', 'article')),
  ref TEXT NOT NULL,            -- identifiant (slug) d'origine
  title TEXT NOT NULL,
  data TEXT NOT NULL,           -- JSON : ligne d'origine (+ sujets pour un article)
  deleted_at INTEGER NOT NULL
);
CREATE INDEX idx_trash_deleted ON trash (deleted_at);
