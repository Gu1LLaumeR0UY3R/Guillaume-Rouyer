-- Veille technologique : sujets libres, articles rédigés en Markdown, et lien article <-> sujets.

-- Sujets (IA, self-hosting, jeux...). Un article peut en avoir plusieurs.
CREATE TABLE veille_topics (
  slug TEXT PRIMARY KEY,                       -- identifiant dans l'adresse : /veille?sujet=<slug>
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6c8cff',       -- couleur de la pastille (hexadécimal, validé côté serveur)
  position INTEGER NOT NULL DEFAULT 0,         -- ordre d'affichage des filtres
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_veille_topics_position ON veille_topics (position);

-- Articles. Le corps est du Markdown (avec les blocs personnalisés), rendu et assaini côté serveur et navigateur.
CREATE TABLE veille_articles (
  slug TEXT PRIMARY KEY,                       -- identifiant dans l'adresse : /veille/<slug>
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',            -- résumé : liste /veille et meta description (SEO)
  body TEXT NOT NULL DEFAULT '',               -- Markdown
  cover_url TEXT,                              -- image de couverture : lien externe https uniquement
  cover_alt TEXT,                              -- texte alternatif (obligatoire si une couverture existe)
  cover_caption TEXT,                          -- légende de la couverture
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  reading_minutes INTEGER NOT NULL DEFAULT 1,  -- temps de lecture, recalculé à chaque enregistrement
  published_at INTEGER,                        -- date de première publication (NULL tant que brouillon)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_veille_articles_status ON veille_articles (status, published_at);

-- Liaison article <-> sujets (supprimée automatiquement si l'article ou le sujet disparaît).
CREATE TABLE veille_article_topics (
  article_slug TEXT NOT NULL REFERENCES veille_articles (slug) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL REFERENCES veille_topics (slug) ON DELETE CASCADE,
  PRIMARY KEY (article_slug, topic_slug)
);
CREATE INDEX idx_veille_article_topics_topic ON veille_article_topics (topic_slug);
