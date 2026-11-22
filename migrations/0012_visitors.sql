-- Visiteurs uniques (seulement avec accord) : une empreinte par jour, impossible à relier d'un jour à l'autre.
CREATE TABLE vis_day (
  day TEXT NOT NULL,
  h TEXT NOT NULL,
  PRIMARY KEY (day, h)
);
