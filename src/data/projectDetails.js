// Contenu des pages de détail. Chaque section : un titre, des paragraphes et/ou une liste de points.
export const DETAILS = {
  spidernet: {
    lead: "Une application web de signalement et de suivi d'incidents urbains géolocalisés. Des citoyens signalent un incident avec leur position ; des héros et des administrateurs le vérifient, le valident ou le rejettent, puis le résolvent. Tout est tracé.",
    sections: [
      {
        title: "L'idée",
        paragraphs: [
          "L'ambiance reprend l'univers Spider-Man, avec l'application de Ganke des jeux PlayStation en inspiration. C'est un projet de fan non officiel, sans aucun asset Marvel.",
          "Projet de cours du Bachelor (Symfony, DAO, PostgreSQL), pensé aussi comme pièce de portfolio : une application complète, sécurisée, avec du SQL spatial et une architecture propre.",
          "L'application affiche la mention « projet de démonstration : ne remplace pas le 112 ».",
        ],
      },
      {
        title: 'Trois rôles',
        points: [
          "Citoyen : signale un incident et conteste l'alerte d'un autre",
          'Héros : valide, rejette, résout et prend en charge un incident',
          'Admin : tout ce que fait un héros, y compris sur son propre signalement',
        ],
        paragraphs: ["Les rôles héros et admin ne s'obtiennent que par une commande, jamais à l'inscription : le formulaire n'a aucun champ « rôle »."],
      },
      {
        title: "Cycle de vie d'un incident",
        paragraphs: [
          'Un incident passe de signalé à validé, puis résolu. Une fausse alerte clôt le dossier. « Résolu » et « fausse alerte » sont définitifs.',
          'Chaque changement écrit qui, quand et pourquoi dans un historique, dans la même transaction, avec un verrou de ligne pour éviter deux modifications simultanées.',
        ],
      },
      {
        title: 'Règles métier',
        points: [
          '10 signalements par heure au maximum par membre',
          "Un héros ne traite pas son propre signalement (l'admin fait exception)",
          'Une alerte validée rapporte +2 de fiabilité à son auteur, une fausse alerte coûte −10 (score entre 0 et 100)',
          "À 3 contestations distinctes, un incident non validé devient fausse alerte ; un incident validé par un héros n'est jamais écrasé par la communauté",
          'Sur la carte : pas de fausses alertes, et les incidents résolus restent visibles 24 h',
        ],
        paragraphs: ["Ces règles vivent dans des services, pas dans les DAO ni dans les contrôleurs."],
      },
      {
        title: 'Technique',
        points: [
          'Symfony 7.4 LTS, PHP 8.3, Twig',
          'DAO en PDO, sans ORM : requêtes préparées partout, SQL PostGIS écrit à la main',
          'PostgreSQL 16 et PostGIS 3.4 dans Docker',
          'Position en geography(Point, 4326) avec index GiST ; altitude et précision nullables',
          'Carte prévue avec MapLibre GL JS, puis vue 3D avec Deck.gl',
        ],
      },
      {
        title: 'Sécurité',
        points: [
          'Mots de passe hachés, 12 caractères minimum',
          'Jetons CSRF sur la connexion et la déconnexion',
          'Message de connexion unique, pour ne pas révéler quels comptes existent',
          'Anti force brute : 5 échecs par couple e-mail et IP, 20 par IP, sur 15 minutes',
          'Cookie de session HttpOnly et SameSite=Lax, en-têtes de sécurité',
          'Utilisateur rechargé depuis la base à chaque requête : un blocage ou un changement de rôle est immédiat',
        ],
      },
      {
        title: 'Qualité',
        paragraphs: ["41 tests PHPUnit, dont 5 d'intégration contre une vraie base PostGIS. Les tests fonctionnels utilisent de faux DAO en mémoire."],
      },
      {
        title: "État d'avancement",
        paragraphs: [
          "Le socle est en cours : comptes et rôles faits, règles métier en cours d'écriture. Restent l'API JSON, la carte 2D et le formulaire d'alerte, puis la valorisation : carte semi-3D, statistiques par tuile hexagonale, temps réel avec Mercure.",
          "Côté données personnelles, une position précise liée à un compte en fait une donnée personnelle : durée de conservation et anonymisation des anciens incidents sont prévues. État en octobre 2026.",
        ],
      },
    ],
  },
  goodnight: {
    lead: "Plateforme immobilière complète en PHP, avec trois rôles d'utilisateurs, des indicateurs de suivi et un calendrier.",
    sections: [
      {
        title: 'Points clés',
        points: [
          'Architecture MVC en PHP',
          "3 rôles d'utilisateurs",
          'Tableaux de bord avec KPI (Chart.js)',
          'Calendrier avec FullCalendar',
          'Sécurité : requêtes préparées PDO et protection contre les failles XSS',
          '174 commits',
        ],
      },
    ],
  },
  teyvathubfr: {
    lead: "Site encyclopédique sur Genshin Impact : choix des personnages possédés avec leur constellation et leur arme, roulette de personnage à build, roulette d'équipe et récapitulatif de l'histoire du jeu.",
    notice: "La page dédiée à Teyvat Hub est en cours de maintenance. Le code source reste consultable sur GitHub.",
    sections: [
      {
        title: 'Fonctionnalités',
        points: ['Authentification à deux facteurs (2FA)', 'Administration avec CRUD', 'Blog', 'Jeu Motus intégré', 'Tests automatisés avec PHPUnit'],
      },
      { title: 'Technique', points: ['Laravel 12 et Blade', 'Alpine.js', 'Tailwind CSS'] },
    ],
  },
  'bataille-navale': {
    lead: 'Bataille navale en 3D : interface en Vue.js, modèles 3D avec Babylon.js et interaction avec un serveur. Bientôt en ligne.',
    sections: [
      { title: 'Technique', points: ['Interface en Vue.js', 'Modèles 3D avec Babylon.js', 'Interaction avec le serveur via une API'] },
    ],
  },
}
