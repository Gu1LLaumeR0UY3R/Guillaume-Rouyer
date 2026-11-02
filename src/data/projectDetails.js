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
    lead: "Plateforme de location de biens immobiliers développée en binôme, en PHP avec une architecture MVC écrite à la main. Trois espaces : locataire, propriétaire et administrateur.",
    sections: [
      {
        title: 'Trois espaces',
        points: [
          'Locataire : recherche de biens, carte, réservation, favoris, commentaires et notes, profil personnalisable',
          'Propriétaire : gestion des biens, calendrier, blocages de dates, tarifs par saison, tableau de bord avec KPI et graphiques',
          'Administrateur : validation des biens, modération, utilisateurs, rôles, types de biens et saisons',
        ],
      },
      {
        title: 'Fonctionnalités',
        points: [
          'Validation des biens avant publication ; une modification critique remet le bien en attente',
          'Signalements et modération',
          'Commentaires et notes, un par locataire et par bien',
          "Notifications avec une cloche dans la barre de navigation, compteur interrogé toutes les 30 secondes",
          'Statistiques du propriétaire : réservations et revenus superposés sur un graphique à deux axes',
          'Profils avec cadres déblocables',
          'Thèmes jour et nuit',
        ],
      },
      {
        title: 'Technique',
        points: [
          'PHP 7.4+ avec une architecture MVC maison et PDO',
          'MySQL',
          'JavaScript sans framework',
          'FullCalendar, Chart.js et Mapbox GL JS',
        ],
      },
      {
        title: 'Sécurité',
        points: [
          'Requêtes préparées PDO et mots de passe hachés',
          'Contrôle des rôles sur les routes sensibles',
          'Échappement des sorties et vérification du type MIME des fichiers envoyés',
          'Cookie de session HttpOnly et SameSite',
          'À venir : jetons CSRF, limitation des tentatives de connexion, tests automatisés',
        ],
      },
      {
        title: 'En binôme',
        paragraphs: ['Projet réalisé à deux : 174 commits au total, dont une centaine de ma main.'],
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
    lead: 'Bataille navale en 3D : interface en Vue.js, modèles 3D avec Babylon.js et interaction avec un serveur.',
    notice: 'La page dédiée à la Bataille Navale est en cours de maintenance. Le code source reste consultable sur GitHub.',
    sections: [
      { title: 'Technique', points: ['Interface en Vue.js', 'Modèles 3D avec Babylon.js', 'Interaction avec le serveur via une API'] },
    ],
  },
}
