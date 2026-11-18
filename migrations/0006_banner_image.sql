-- Bannière d'un projet : image du gestionnaire de médias (facultative) + assombrissement pour garder le titre lisible.
-- Appliquer AVANT de déployer : npx wrangler d1 migrations apply portfolio-db --remote
ALTER TABLE projects ADD COLUMN banner_image TEXT;                          -- /media/<id>, ou NULL = dégradé seulement
ALTER TABLE projects ADD COLUMN banner_dim INTEGER NOT NULL DEFAULT 35;     -- 0 à 80 (% de noir par-dessus l'image)
