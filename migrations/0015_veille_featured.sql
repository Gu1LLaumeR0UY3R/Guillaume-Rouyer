-- Articles mis à la une : affichés en premier sur /veille avec un badge (3 au maximum, contrôlé côté serveur).
ALTER TABLE veille_articles ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;
