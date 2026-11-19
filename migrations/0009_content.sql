-- Contenus éditables du site (une ligne par bloc : spidernet, accueil, à propos...). La valeur est du JSON.
CREATE TABLE content (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
