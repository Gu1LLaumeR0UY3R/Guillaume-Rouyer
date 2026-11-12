// Contenu de la page d'étude de cas de Bataille Navale. Les images se déposent dans src/assets/bataille-navale/.
export const GAME_URL = 'https://bataille-navale.pages.dev/' // adresse du jeu en ligne : elle fait apparaître le bouton « Jouer »
export const REPO = 'https://github.com/Gu1LLaumeR0UY3R/Bataille-Navale'

export const HERO = {
  kicker: 'Projet de portfolio',
  title: 'Bataille Navale',
  tagline: 'Une bataille sous le soleil.',
  text: "Un jeu de stratégie navale en 3D : plateau animé, arsenal d'outils, trois niveaux d'IA et un éditeur de cartes pour créer son propre archipel.",
  meta: ['Vue.js', 'TypeScript', 'BabylonLite (WebGPU)'],
}

export const GAMEPLAY = {
  kicker: '01 — Gameplay',
  title: 'Un plateau, une flotte, un arsenal.',
  paragraphs: [
    "La grille fait 10 × 10 cases. Chaque camp place cinq navires, puis tire à tour de rôle. Le joueur et l'IA jouent avec exactement les mêmes règles.",
    "Chaque tour rapporte 10 poissons, la monnaie du jeu, à dépenser dans l'arsenal. On ne garde qu'un exemplaire de chaque outil, qu'il faut laisser recharger avant d'en racheter un.",
    "Le sonar et le drone remplacent le tir du tour : ils sont puissants, donc chers et lents à recharger. Le brouilleur et la bouée leurre sont des défenses discrètes, qui laissent tirer ensuite.",
  ],
  fleet: [['Porte-avions', 5], ['Croiseur', 4], ['Contre-torpilleur', 3], ['Sous-marin', 3], ['Torpilleur', 2]],
}

export const ARSENAL = [
  { id: 'sonar', name: 'Sonar 3 × 3', price: 150, recharge: 4, turn: true, text: 'Révèle les cases exactes des navires dans une zone de 3 × 3.' },
  { id: 'brouilleur', name: 'Brouilleur', price: 40, recharge: 5, turn: false, text: 'Le prochain sonar adverse ne renvoie rien.' },
  { id: 'bouee', name: 'Bouée leurre', price: 20, recharge: 3, turn: false, text: 'Un faux navire pour le sonar adverse, pendant 4 tours.' },
  { id: 'drone', name: 'Drone de réparation', price: 100, recharge: 5, turn: true, text: "Quatre drones réparent toutes les cases touchées d'un navire et les protègent d'un tir." },
]

export const EDITOR = {
  kicker: '02 — Éditeur de cartes',
  title: 'Build your own archipelago.',
  subtitle: "Un bac à sable 3D pour façonner son terrain de jeu, importer ses propres objets et créer des configurations tactiques.",
  verbs: [
    { key: 'Place', title: 'Placer', text: 'Ajoutez des îles, des rochers et des bouées, puis sélectionnez-les dans la scène.' },
    { key: 'Transform', title: 'Transformer', text: "Réglez la position, la rotation et l'échelle de chaque objet." },
    { key: 'Import', title: 'Importer', text: 'Chargez vos propres modèles au format .glb.' },
    { key: 'Shape', title: 'Façonner', text: "Changez la teinte et la luminosité de l'eau, l'azimut, la hauteur et l'intensité du soleil." },
    { key: 'Block', title: 'Bloquer', text: 'Peignez des cases comme bloquées pour modifier les placements possibles et la stratégie.' },
    { key: 'Save & share', title: 'Partager', text: 'Exportez une carte en .zip et importez celles des autres joueurs.' },
  ],
  steps: [
    { slot: 'editeur-placement', title: '1. Placez vos éléments', alt: "Placement d'objets dans l'éditeur" },
    { slot: 'editeur-cases-bloquees', title: '2. Bloquez des zones', alt: 'Cases bloquées sur la grille' },
    { slot: 'editeur-export', title: '3. Exportez et partagez', alt: "Export d'une carte en .zip" },
  ],
  maps: ['Aube', 'Crépuscule', 'Lagon', 'Mer du Nord', 'Tropiques'],
}

export const AI = {
  kicker: '03 — Intelligence artificielle',
  title: 'Trois adversaires. Trois façons de penser.',
  text: "Les trois IA tirent en priorité sur un contact de sonar et utilisent l'arsenal comme le joueur. Ce qui les distingue, c'est leur façon de choisir une case.",
  levels: [
    { id: 'easy', name: 'Facile', title: 'Le navigateur novice', principle: 'Tire sur une case libre au hasard, sans aucune stratégie.' },
    { id: 'medium', name: 'Moyen', title: 'Le capitaine stratège', principle: "Dès qu'un navire est touché, il vise les cases voisines (haut, bas, gauche, droite). Sinon il chasse en damier : tout navire d'au moins deux cases occupe au moins une case de chaque couleur." },
    { id: 'hard', name: 'Difficile', title: "L'amiral expérimenté", principle: "Calcule une carte de probabilités : pour chaque navire restant, il compte toutes les positions encore possibles. Une position qui recouvre une touche pèse beaucoup plus, une case que le sonar a dite vide beaucoup moins. Il tire sur la case la plus probable." },
  ],
  note: 'Simulation simplifiée : les trois stratégies jouent la même grille, sans arsenal ni sonar.',
}

export const WAVES = {
  kicker: '04 — Behind the waves',
  title: "Une mer qui bouge, à partir d'une équation.",
  paragraphs: [
    "La mer n'est pas une animation enregistrée : c'est une fonction du temps. En chaque point (x, z), la hauteur de l'eau est calculée à chaque image, en combinant deux ondes qui avancent dans des directions différentes.",
    "Les dalles, les marqueurs et les bateaux appellent tous cette même fonction : ils montent et descendent ensemble, sans décalage, et la pente de la surface incline les bateaux.",
  ],
  ondes: [
    { name: 'Onde 1', amplitude: 0.045, longueurOnde: 7, pulsation: 1.3, direction: [1, 0.35] },
    { name: 'Onde 2', amplitude: 0.02, longueurOnde: 3.7, pulsation: 1.9, direction: [-0.4, 1] },
  ],
  note: 'Démonstration : la même fonction et les mêmes paramètres que le jeu, vus en perspective. Le curseur d’amplitude exagère le relief pour mieux le voir.',
}

export const STATUS = [
  { state: 'done', label: 'Disponible', items: ['Plateau 3D de 10 × 10 cases et flotte de cinq navires', 'Arsenal de quatre outils et monnaie en poissons', 'Trois niveaux d’IA', 'Éditeur de cartes : placement, transformations, import .glb, environnement, cases bloquées, export et import .zip', 'Eau animée par deux ondes sinusoïdales', 'Cinq cartes fournies'] },
  { state: 'wip', label: 'En cours', items: ['Événements dynamiques : un événement aléatoire tous les 5 à 7 tours', 'Carte Kraken : le Kraken attaque quatre cases aléatoires', 'Carte Cimetière de pirates : un Man O’ War fantôme tire six cases aléatoires entre les deux joueurs'] },
  { state: 'next', label: 'Prévu', items: ['Validation de jouabilité des cartes : vérifier qu’il reste assez de placements légaux pour toute la flotte', 'Mode multijoueur'] },
]
export const STATUS_NOTE = 'Les règles des événements peuvent encore évoluer.'

export const CREDITS = {
  title: 'Crédits et transparence',
  paragraphs: [
    "Les modèles 3D viennent de créateurs tiers, sous licence CC-BY ; le détail est dans le fichier CREDITS.md du dépôt. L'éditeur de cartes, les IA, la logique de jeu et l'animation de l'eau sont développés dans ce projet.",
    "Ce projet a été développé avec l'aide d'outils d'IA (assistant de code Claude).",
  ],
}
