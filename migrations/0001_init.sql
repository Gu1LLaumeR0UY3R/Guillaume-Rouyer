-- Socle admin : un seul compte, sessions, journaux, limitation des tentatives, réglages.
-- Appliquer avec : npx wrangler d1 migrations apply portfolio-db --remote

CREATE TABLE admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),          -- une seule ligne : un seul admin
  password_hash TEXT NOT NULL,                    -- PBKDF2 (jamais le mot de passe en clair)
  password_salt TEXT NOT NULL,
  totp_secret TEXT NOT NULL,                      -- secret 2FA chiffré (AES-GCM)
  totp_last_step INTEGER NOT NULL DEFAULT 0,      -- dernier code 2FA utilisé (anti-rejeu)
  confirmed INTEGER NOT NULL DEFAULT 0,           -- 1 une fois le 2FA vérifié à l'installation
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,                       -- hash SHA-256 du jeton (le jeton n'est jamais stocké)
  csrf TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  at INTEGER NOT NULL,
  ok INTEGER NOT NULL
);
CREATE INDEX idx_attempts_ip_at ON login_attempts (ip, at);
CREATE INDEX idx_attempts_at ON login_attempts (at);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  level TEXT NOT NULL,                            -- info | warn | error | security
  event TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  path TEXT,
  ua TEXT,
  meta TEXT
);
CREATE INDEX idx_logs_at ON logs (at);
CREATE INDEX idx_logs_level ON logs (level, id);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
