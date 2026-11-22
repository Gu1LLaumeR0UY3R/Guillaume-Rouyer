-- CV téléchargeable : un seul fichier PDF (une seule ligne), remplaçable depuis l'administration.
CREATE TABLE cv (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
