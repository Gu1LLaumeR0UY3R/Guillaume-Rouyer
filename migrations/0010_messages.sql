-- Messages du formulaire de contact (lus seulement dans l'admin) et défis anti-robot déjà utilisés.
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'open', 'closed')),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  closed_at INTEGER
);
CREATE INDEX idx_messages_status ON messages (status, created_at DESC);

-- Chaque défi anti-robot ne peut servir qu'une fois
CREATE TABLE pow_used (
  salt TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
