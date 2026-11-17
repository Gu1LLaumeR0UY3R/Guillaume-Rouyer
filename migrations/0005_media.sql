-- Lot 2 : gestionnaire de médias. Les images (déjà réduites et converties par le navigateur) sont stockées en base64.
-- Le reste du site ne garde que leur chemin : /media/<id>
-- Appliquer AVANT de déployer : npx wrangler d1 migrations apply portfolio-db --remote
CREATE TABLE media (
  id TEXT PRIMARY KEY,                -- 24 caractères aléatoires, jamais réutilisés
  name TEXT NOT NULL,                 -- nom d'origine du fichier (affichage seulement)
  alt TEXT NOT NULL,                  -- texte alternatif, obligatoire (accessibilité)
  mime TEXT NOT NULL,                 -- détecté sur le contenu du fichier, pas sur ce que dit le navigateur
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  size INTEGER NOT NULL,              -- octets de l'image
  data TEXT NOT NULL,                 -- image encodée en base64
  created_at INTEGER NOT NULL,
  deleted_at INTEGER                  -- non nul = dans la corbeille (supprimé définitivement après 30 jours)
);
CREATE INDEX idx_media_deleted ON media (deleted_at, created_at);
