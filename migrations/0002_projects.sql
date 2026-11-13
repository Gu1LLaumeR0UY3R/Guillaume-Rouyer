-- Projets du portfolio : fiche (carte) + contenu de la page détaillée.
CREATE TABLE projects (
  slug TEXT PRIMARY KEY,                       -- identifiant dans l'adresse : /projets/<slug>
  name TEXT NOT NULL,
  tag TEXT NOT NULL,                           -- catégorie (Web, Mobile, IA, API, 3D...)
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'wip', 'maintenance', 'hidden')),
  accent TEXT NOT NULL DEFAULT '',             -- dégradé de la bannière (validé côté serveur)
  description TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '[]',            -- JSON : liste des technologies
  repo TEXT,                                   -- lien du code (https uniquement)
  note TEXT,                                   -- texte affiché quand le code est privé
  featured INTEGER NOT NULL DEFAULT 0,         -- 1 = projet phare, avec page dédiée
  board TEXT,                                  -- lien interne spécial (ex. tableau SpiderNet)
  maintenance_message TEXT,                    -- message de la page de maintenance
  details TEXT NOT NULL DEFAULT '{}',          -- JSON : { lead, notice, sections: [{ title, paragraphs, points }] }
  position INTEGER NOT NULL DEFAULT 0,         -- ordre d'affichage
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_projects_position ON projects (position);
